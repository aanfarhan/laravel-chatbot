<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Streaming;

use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Contracts\LLMClient;
use Aanfarhan\Chatbot\Contracts\PersistableTool;
use Aanfarhan\Chatbot\Contracts\ToolInvocationStore;
use Aanfarhan\Chatbot\Events\ChatbotMessageCompleted;
use Aanfarhan\Chatbot\Events\ChatbotMessageFailed;
use Aanfarhan\Chatbot\Events\ChatbotMessageStarted;
use Aanfarhan\Chatbot\Exceptions\ChatbotException;
use Aanfarhan\Chatbot\Exceptions\ChatbotTimeoutException;
use Aanfarhan\Chatbot\Responses\StreamChunk;
use Aanfarhan\Chatbot\Tools\ToolArgumentValidator;
use Aanfarhan\Chatbot\Tools\ToolInvocation;
use Aanfarhan\Chatbot\Tools\ToolRegistry;
use Closure;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Illuminate\Contracts\Events\Dispatcher;
use Illuminate\Support\Carbon;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class StreamCoordinator
{
    private const CACHE_COUNTER_KEY = 'chatbot.active_streams';

    private const RESULT_SIZE_CAP = 4096;

    private ?ToolArgumentValidator $argumentValidator = null;

    public function __construct(
        private readonly LLMClient $llm,
        private readonly ConversationStore $store,
        private readonly ConfigRepository $config,
        private readonly ?CacheRepository $cache = null,
        private readonly ?Dispatcher $events = null,
        private readonly ?LoggerInterface $logger = null,
        private readonly ?ToolRegistry $toolRegistry = null,
        private readonly ?ToolInvocationStore $toolInvocationStore = null,
        private readonly ?Closure $clock = null,
    ) {}

    /**
     * Monotonic wall-clock source in seconds. Injectable so timing-dependent
     * behaviour (the stream budget) is testable without real sleeps.
     */
    private function now(): float
    {
        return $this->clock !== null ? ($this->clock)() : microtime(true);
    }

    private function argumentValidator(): ToolArgumentValidator
    {
        if ($this->argumentValidator === null) {
            $raw = $this->config->get('chatbot.tools.default_max_arg_length', 10240);
            $this->argumentValidator = new ToolArgumentValidator(is_int($raw) ? $raw : 10240);
        }

        return $this->argumentValidator;
    }

    /**
     * @param  list<array<string, mixed>>  $messages
     * @param  list<string>|null  $allowedTools  null means use full registry (legacy path); [] means no tools
     */
    public function handle(
        array $messages,
        int $conversationId,
        string $routeName,
        string $contextHash,
        ?callable $isAborted = null,
        ?string $model = null,
        ?callable $preflight = null,
        ?string $contextSummary = null,
        string $channel = 'default',
        ?array $allowedTools = null,
        ?Authenticatable $actor = null,
    ): StreamedResponse {
        $isAborted ??= static fn (): bool => (bool) connection_aborted();
        $rawDuration = $this->config->get('chatbot.stream_duration', 60);
        $streamDuration = is_int($rawDuration) ? $rawDuration : 60;

        return new StreamedResponse(function () use (
            $messages,
            $conversationId,
            $routeName,
            $contextHash,
            $isAborted,
            $streamDuration,
            $model,
            $preflight,
            $contextSummary,
            $channel,
            $allowedTools,
            $actor,
        ): void {
            $this->incrementCounter();
            $startedAt = $this->now();
            $assembled = '';
            $usage = null;
            $aborted = false;
            $chatbotException = null;

            $rawModel = $this->config->get('chatbot.model', '');
            $resolvedModel = $model ?? (is_string($rawModel) ? $rawModel : '');

            if ($this->events !== null) {
                $this->events->dispatch(new ChatbotMessageStarted(
                    conversationId: $conversationId,
                    channel: $channel,
                    model: $resolvedModel,
                ));
            }

            try {
                if ($preflight !== null) {
                    $preflight();
                }

                if ($contextSummary !== null) {
                    $this->emit('context_summary', ['summary' => $contextSummary]);
                }

                $toolDefs = $this->resolveToolDefs($allowedTools);
                $loopMessages = $messages;
                $callsThisTurn = 0;
                $maxCalls = $toolDefs !== [] ? $this->maxCallsPerTurn() : PHP_INT_MAX;

                // Wall-clock spent blocked in synchronous tool handlers. Excluded from
                // the stream budget, which measures LLM-streaming time only (ADR-0006).
                $toolTimeSpent = 0.0;

                while (true) {
                    // Cut a runaway loop before opening a new LLM round-trip.
                    if (($this->now() - $startedAt - $toolTimeSpent) >= $streamDuration) {
                        throw new ChatbotTimeoutException('stream duration exceeded');
                    }

                    $iterToolCalls = [];
                    $iterText = '';

                    foreach ($this->llm->stream($loopMessages, tools: $toolDefs, model: $model) as $chunk) {
                        if ($isAborted()) {
                            $aborted = true;
                            break 2;
                        }

                        // Cut a runaway model stream between chunks.
                        if (($this->now() - $startedAt - $toolTimeSpent) >= $streamDuration) {
                            throw new ChatbotTimeoutException('stream duration exceeded');
                        }

                        /** @var StreamChunk $chunk */
                        if ($chunk->toolCalls !== []) {
                            foreach ($chunk->toolCalls as $tc) {
                                $iterToolCalls[] = $tc;
                            }
                        }

                        if ($chunk->content !== '') {
                            $iterText .= $chunk->content;
                            $assembled .= $chunk->content;
                            $this->emit('token', ['content' => $chunk->content]);
                        }

                        if ($chunk->usage !== null) {
                            $usage = $chunk->usage;
                        }
                    }

                    if ($iterToolCalls === []) {
                        break;
                    }

                    // Build assistant message carrying the tool_calls
                    $assistantMsg = ['role' => 'assistant', 'content' => $iterText !== '' ? $iterText : null];
                    $assistantMsg['tool_calls'] = array_map(
                        fn (array $tc): array => [
                            'id' => $tc['id'],
                            'type' => 'function',
                            'function' => ['name' => $tc['name'], 'arguments' => $tc['arguments']],
                        ],
                        $iterToolCalls,
                    );
                    $loopMessages[] = $assistantMsg;

                    foreach ($iterToolCalls as $tc) {
                        if ($callsThisTurn >= $maxCalls) {
                            $loopMessages[] = [
                                'role' => 'tool',
                                'tool_call_id' => $tc['id'],
                                'name' => $tc['name'],
                                'content' => '[budget exhausted — tool call limit reached for this turn]',
                            ];

                            continue;
                        }

                        $toolStart = $this->now();
                        $loopMessages[] = $this->invokeToolCall(
                            name: $tc['name'],
                            argumentsJson: $tc['arguments'],
                            callId: $tc['id'],
                            channel: $channel,
                            conversationId: $conversationId,
                            allowedTools: $allowedTools,
                            actor: $actor,
                        );
                        $toolTimeSpent += $this->now() - $toolStart;
                        $callsThisTurn++;
                    }

                    if ($callsThisTurn >= $maxCalls) {
                        $toolDefs = [];
                    }
                }
            } catch (ChatbotException $e) {
                $chatbotException = $e;
                $this->emit('error', [
                    'code' => $e->code(),
                    'message' => $e->getMessage(),
                    'retryable' => $e->isRetryable(),
                ]);

                if ($this->events !== null) {
                    $this->events->dispatch(new ChatbotMessageFailed(
                        conversationId: $conversationId,
                        channel: $channel,
                        exception: $e,
                    ));
                }
            } finally {
                $this->decrementCounter();
            }

            $durationMs = (int) round(($this->now() - $startedAt) * 1000);

            if (! $aborted) {
                $this->store->append(
                    conversationId: $conversationId,
                    role: 'assistant',
                    content: $assembled,
                    routeName: $routeName,
                    contextHash: $contextHash,
                    inputTokens: $usage !== null ? $usage->inputTokens : 0,
                    outputTokens: $usage !== null ? $usage->outputTokens : 0,
                    error: $chatbotException !== null ? [
                        'code' => $chatbotException->code(),
                        'message' => $chatbotException->getMessage(),
                    ] : null,
                );

                $logContext = [
                    'conversation_id' => $conversationId,
                    'channel' => $channel,
                    'model' => $resolvedModel,
                    'duration_ms' => $durationMs,
                    'input_tokens' => $usage !== null ? $usage->inputTokens : 0,
                    'output_tokens' => $usage !== null ? $usage->outputTokens : 0,
                ];

                if ($chatbotException !== null) {
                    $logContext['error_code'] = $chatbotException->code();
                    $this->logger?->info('[chatbot] turn failed', $logContext);
                } else {
                    $this->emit('done', [
                        'conversation_id' => $conversationId,
                        'usage' => [
                            'input_tokens' => $usage !== null ? $usage->inputTokens : 0,
                            'output_tokens' => $usage !== null ? $usage->outputTokens : 0,
                        ],
                    ]);

                    if ($this->events !== null) {
                        $this->events->dispatch(new ChatbotMessageCompleted(
                            inputTokens: $usage !== null ? $usage->inputTokens : 0,
                            outputTokens: $usage !== null ? $usage->outputTokens : 0,
                            model: $resolvedModel,
                        ));
                    }

                    $this->logger?->info('[chatbot] turn completed', $logContext);
                }
            }
        });
    }

    /**
     * @param  list<string>|null  $allowedTools
     * @return list<array<string, mixed>>
     */
    private function resolveToolDefs(?array $allowedTools): array
    {
        $supportsTools = $this->config->get('chatbot.provider.supports_tools', true);
        if ($supportsTools === false) {
            return [];
        }

        if ($this->toolRegistry === null) {
            return [];
        }

        if ($allowedTools === null) {
            return $this->toolRegistry->toDefinitions();
        }

        return $this->toolRegistry->toDefinitionsFor($allowedTools);
    }

    private function maxCallsPerTurn(): int
    {
        $raw = $this->config->get('chatbot.tools.max_calls_per_turn', 5);

        return is_int($raw) ? $raw : 5;
    }

    private function defaultTimeout(): int
    {
        $raw = $this->config->get('chatbot.tools.default_timeout', 10);

        return is_int($raw) ? $raw : 10;
    }

    /**
     * @param  list<string>|null  $allowedTools
     * @return array{role: string, tool_call_id: string, name: string, content: string}
     */
    private function invokeToolCall(string $name, string $argumentsJson, string $callId, string $channel, int $conversationId, ?array $allowedTools = null, ?Authenticatable $actor = null): array
    {
        if ($allowedTools !== null && ! in_array($name, $allowedTools, true)) {
            return [
                'role' => 'tool',
                'tool_call_id' => $callId,
                'name' => $name,
                'content' => "[error: tool '{$name}' is not permitted on this channel]",
            ];
        }

        $tool = $this->toolRegistry?->resolve($name);

        if ($tool === null) {
            return [
                'role' => 'tool',
                'tool_call_id' => $callId,
                'name' => $name,
                'content' => "[error: tool '{$name}' not found in registry]",
            ];
        }

        $decoded = json_decode($argumentsJson, true);
        /** @var array<string, mixed> $args */
        $args = is_array($decoded) ? $decoded : [];

        if (! $this->argumentValidator()->validate($tool->parameters(), $args)) {
            $this->emit('tool_failed', ['name' => $name, 'phase' => 'failed']);

            $errorMsg = 'arguments did not match schema';
            $this->persistInvocation($conversationId, $name, $args, '', 'rejected_schema', $errorMsg, now());

            return [
                'role' => 'tool',
                'tool_call_id' => $callId,
                'name' => $name,
                'content' => $errorMsg,
            ];
        }

        $invocation = new ToolInvocation(
            args: $args,
            channel: $channel,
            context: [],
        );

        $this->emit('tool_started', ['name' => $name, 'phase' => 'started']);

        $startedAt = now();

        try {
            if (! $tool->authorize($actor, $invocation)) {
                $this->emit('tool_failed', ['name' => $name, 'phase' => 'failed']);

                $errorMsg = "[error: not authorized to call tool '{$name}']";
                $this->persistInvocation($conversationId, $name, $args, $errorMsg, 'handler_error', 'not authorized', $startedAt);

                return [
                    'role' => 'tool',
                    'tool_call_id' => $callId,
                    'name' => $name,
                    'content' => $errorMsg,
                ];
            }

            // The advisory budget is a measurement, not a control-flow gate (ADR-0006):
            // we run the handler to completion, record whether it overran, and always
            // feed the real result back to the model.
            $deadline = $this->now() + $this->defaultTimeout();
            $result = $tool->handle($actor, $invocation);
            $overran = $this->now() > $deadline;

            $encoded = is_array($result) ? json_encode($result, JSON_THROW_ON_ERROR) : (string) $result;

            if (strlen($encoded) > self::RESULT_SIZE_CAP) {
                $encoded = substr($encoded, 0, self::RESULT_SIZE_CAP).'[truncated]';
            }

            $this->emit('tool_finished', ['name' => $name, 'phase' => 'finished']);

            $this->persistToolSuccess($tool, $invocation, $conversationId, $name, $args, $result, $encoded, $startedAt, $overran);

            return [
                'role' => 'tool',
                'tool_call_id' => $callId,
                'name' => $name,
                'content' => $encoded,
            ];
        } catch (\Throwable $e) {
            $this->emit('tool_failed', ['name' => $name, 'phase' => 'failed']);

            $errorMsg = "[error: tool '{$name}' threw an exception: {$e->getMessage()}]";
            $this->persistInvocation($conversationId, $name, $args, $errorMsg, 'handler_error', $e->getMessage(), $startedAt);

            return [
                'role' => 'tool',
                'tool_call_id' => $callId,
                'name' => $name,
                'content' => $errorMsg,
            ];
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function emit(string $event, array $data): void
    {
        echo "event: {$event}\n";
        echo 'data: '.json_encode($data, JSON_THROW_ON_ERROR)."\n";
        echo "\n";
        flush();
    }

    private function incrementCounter(): void
    {
        try {
            $this->cache?->increment(self::CACHE_COUNTER_KEY);
        } catch (\Throwable) {
        }
    }

    private function decrementCounter(): void
    {
        try {
            $this->cache?->decrement(self::CACHE_COUNTER_KEY);
        } catch (\Throwable) {
        }
    }

    /**
     * @param  array<string, mixed>  $args
     * @param  array<string, mixed>|string  $rawResult
     */
    private function persistToolSuccess(
        ChatbotTool $tool,
        ToolInvocation $invocation,
        int $conversationId,
        string $name,
        array $args,
        array|string $rawResult,
        string $encodedResult,
        Carbon $startedAt,
        bool $overran,
    ): void {
        if ($this->toolInvocationStore === null) {
            return;
        }

        if ($tool instanceof PersistableTool) {
            $payload = $tool->persist($invocation, $rawResult);
            if ($payload === null) {
                return;
            }
            $storedResult = json_encode($payload, JSON_THROW_ON_ERROR);
        } else {
            $storedResult = $encodedResult;
        }

        $this->toolInvocationStore->record(
            conversationId: $conversationId,
            messageId: null,
            toolName: $name,
            arguments: $args,
            result: $storedResult,
            status: 'ok',
            error: null,
            startedAt: $startedAt,
            finishedAt: now(),
            overran: $overran,
        );
    }

    /**
     * @param  array<string, mixed>  $args
     */
    private function persistInvocation(
        int $conversationId,
        string $name,
        array $args,
        string $result,
        string $status,
        ?string $error,
        Carbon $startedAt,
    ): void {
        $this->toolInvocationStore?->record(
            conversationId: $conversationId,
            messageId: null,
            toolName: $name,
            arguments: $args,
            result: $result,
            status: $status,
            error: $error,
            startedAt: $startedAt,
            finishedAt: now(),
        );
    }
}
