<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Streaming;

use Aanfarhan\Chatbot\Config\Defaults;
use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Contracts\LLMClient;
use Aanfarhan\Chatbot\Events\ChatbotMessageCompleted;
use Aanfarhan\Chatbot\Events\ChatbotMessageFailed;
use Aanfarhan\Chatbot\Events\ChatbotMessageStarted;
use Aanfarhan\Chatbot\Exceptions\ChatbotException;
use Aanfarhan\Chatbot\Tools\ToolInvoker;
use Closure;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Illuminate\Contracts\Events\Dispatcher;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class StreamCoordinator
{
    private const CACHE_COUNTER_KEY = 'chatbot.active_streams';

    private readonly TurnStreamer $turnStreamer;

    public function __construct(
        LLMClient $llm,
        private readonly ConversationStore $store,
        private readonly ConfigRepository $config,
        private readonly ?CacheRepository $cache = null,
        private readonly ?Dispatcher $events = null,
        private readonly ?LoggerInterface $logger = null,
        private readonly ?Closure $clock = null,
        private readonly StreamEmitter $emitter = new SseStreamEmitter,
        private readonly ?ToolInvoker $toolInvoker = null,
    ) {
        $this->turnStreamer = new TurnStreamer($llm, $emitter, $toolInvoker, $clock);
    }

    /**
     * Monotonic wall-clock source in seconds. Injectable so timing-dependent
     * behaviour (the stream budget) is testable without real sleeps.
     */
    private function now(): float
    {
        return $this->clock !== null ? ($this->clock)() : microtime(true);
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
        string $conversationUuid = '',
    ): StreamedResponse {
        $isAborted ??= static fn (): bool => (bool) connection_aborted();
        $streamDuration = $this->config->integer('chatbot.stream_duration', Defaults::STREAM_DURATION);

        return new StreamedResponse(function () use (
            $messages,
            $conversationId,
            $conversationUuid,
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

            $resolvedModel = $model ?? $this->config->string('chatbot.model', '');

            if ($this->events !== null) {
                $this->events->dispatch(new ChatbotMessageStarted(
                    conversationId: $conversationId,
                    channel: $channel,
                    model: $resolvedModel,
                ));
            }

            $preflightFailure = null;
            try {
                if ($preflight !== null) {
                    $preflight();
                }

                if ($contextSummary !== null) {
                    $this->emitter->contextSummary($contextSummary);
                }
            } catch (ChatbotException $e) {
                // Preflight rejections (quota, auth) produce a Failed result before the LLM round starts.
                $preflightFailure = $e;
            }

            try {
                $toolDefs = $this->resolveToolDefs($allowedTools);

                $result = $preflightFailure !== null
                    ? new TurnResult('', null, TurnOutcome::Failed, $preflightFailure)
                    : $this->turnStreamer->run(
                        messages: $messages,
                        toolDefs: $toolDefs,
                        maxCalls: $this->maxCallsPerTurn(),
                        streamDuration: $streamDuration,
                        startedAt: $startedAt,
                        isAborted: $isAborted,
                        model: $model,
                        channel: $channel,
                        conversationId: $conversationId,
                        actor: $actor,
                        allowedTools: $allowedTools,
                    );
            } finally {
                $this->decrementCounter();
            }

            $durationMs = (int) round(($this->now() - $startedAt) * 1000);

            match ($result->outcome) {
                TurnOutcome::Aborted => null,

                TurnOutcome::Failed => $this->handleFailed($result, $conversationId, $channel, $routeName, $contextHash, $resolvedModel, $durationMs),

                TurnOutcome::Completed => $this->handleCompleted($result, $conversationId, $conversationUuid, $channel, $routeName, $contextHash, $resolvedModel, $durationMs),
            };
        });
    }

    private function handleFailed(
        TurnResult $result,
        int $conversationId,
        string $channel,
        string $routeName,
        string $contextHash,
        string $resolvedModel,
        int $durationMs,
    ): void {
        $e = $result->requireFailure();

        $this->emitter->error($e->code(), $e->getMessage(), $e->isRetryable());

        if ($this->events !== null) {
            $this->events->dispatch(new ChatbotMessageFailed(
                conversationId: $conversationId,
                channel: $channel,
                exception: $e,
            ));
        }

        $this->store->append(
            conversationId: $conversationId,
            role: 'assistant',
            content: $result->assembled,
            routeName: $routeName,
            contextHash: $contextHash,
            inputTokens: $result->usage !== null ? $result->usage->inputTokens : 0,
            outputTokens: $result->usage !== null ? $result->usage->outputTokens : 0,
            error: ['code' => $e->code(), 'message' => $e->getMessage()],
        );

        $this->logger?->info('[chatbot] turn failed', [
            'conversation_id' => $conversationId,
            'channel' => $channel,
            'model' => $resolvedModel,
            'duration_ms' => $durationMs,
            'input_tokens' => $result->usage !== null ? $result->usage->inputTokens : 0,
            'output_tokens' => $result->usage !== null ? $result->usage->outputTokens : 0,
            'error_code' => $e->code(),
        ]);
    }

    private function handleCompleted(
        TurnResult $result,
        int $conversationId,
        string $conversationUuid,
        string $channel,
        string $routeName,
        string $contextHash,
        string $resolvedModel,
        int $durationMs,
    ): void {
        $this->store->append(
            conversationId: $conversationId,
            role: 'assistant',
            content: $result->assembled,
            routeName: $routeName,
            contextHash: $contextHash,
            inputTokens: $result->usage !== null ? $result->usage->inputTokens : 0,
            outputTokens: $result->usage !== null ? $result->usage->outputTokens : 0,
            error: null,
        );

        $this->emitter->done(
            $conversationUuid,
            $result->usage !== null ? $result->usage->inputTokens : 0,
            $result->usage !== null ? $result->usage->outputTokens : 0,
        );

        if ($this->events !== null) {
            $this->events->dispatch(new ChatbotMessageCompleted(
                inputTokens: $result->usage !== null ? $result->usage->inputTokens : 0,
                outputTokens: $result->usage !== null ? $result->usage->outputTokens : 0,
                model: $resolvedModel,
            ));
        }

        $this->logger?->info('[chatbot] turn completed', [
            'conversation_id' => $conversationId,
            'channel' => $channel,
            'model' => $resolvedModel,
            'duration_ms' => $durationMs,
            'input_tokens' => $result->usage !== null ? $result->usage->inputTokens : 0,
            'output_tokens' => $result->usage !== null ? $result->usage->outputTokens : 0,
        ]);
    }

    /**
     * @param  list<string>|null  $allowedTools
     * @return list<array<string, mixed>>
     */
    private function resolveToolDefs(?array $allowedTools): array
    {
        if ($this->config->boolean('chatbot.provider.supports_tools', true) === false || $this->toolInvoker === null) {
            return [];
        }

        return $this->toolInvoker->definitions($allowedTools);
    }

    private function maxCallsPerTurn(): int
    {
        return $this->config->integer('chatbot.tools.max_calls_per_turn', Defaults::MAX_CALLS_PER_TURN);
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
}
