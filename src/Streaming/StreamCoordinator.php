<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Streaming;

use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Contracts\LLMClient;
use Aanfarhan\Chatbot\Events\ChatbotMessageCompleted;
use Aanfarhan\Chatbot\Events\ChatbotMessageFailed;
use Aanfarhan\Chatbot\Events\ChatbotMessageStarted;
use Aanfarhan\Chatbot\Exceptions\ChatbotException;
use Aanfarhan\Chatbot\Exceptions\ChatbotTimeoutException;
use Aanfarhan\Chatbot\Responses\StreamChunk;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Illuminate\Contracts\Events\Dispatcher;
use Psr\Log\LoggerInterface;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class StreamCoordinator
{
    private const CACHE_COUNTER_KEY = 'chatbot.active_streams';

    public function __construct(
        private readonly LLMClient $llm,
        private readonly ConversationStore $store,
        private readonly ConfigRepository $config,
        private readonly ?CacheRepository $cache = null,
        private readonly ?Dispatcher $events = null,
        private readonly ?LoggerInterface $logger = null,
    ) {}

    /**
     * @param  list<array{role: string, content: string}>  $messages
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
    ): StreamedResponse {
        $isAborted ??= static fn (): bool => (bool) connection_aborted();
        $streamDuration = (int) $this->config->get('chatbot.stream_duration', 60);

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
        ): void {
            $this->incrementCounter();
            $startedAt = microtime(true);
            $assembled = '';
            $usage = null;
            $aborted = false;
            $chatbotException = null;

            $resolvedModel = $model ?? (string) $this->config->get('chatbot.model', '');

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

                foreach ($this->llm->stream($messages, model: $model) as $chunk) {
                    if ($isAborted()) {
                        $aborted = true;
                        break;
                    }

                    if ((microtime(true) - $startedAt) >= $streamDuration) {
                        throw new ChatbotTimeoutException('stream duration exceeded');
                    }

                    /** @var StreamChunk $chunk */
                    $assembled .= $chunk->content;

                    if ($chunk->usage !== null) {
                        $usage = $chunk->usage;
                    }

                    $this->emit('token', ['content' => $chunk->content]);
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

            $durationMs = (int) round((microtime(true) - $startedAt) * 1000);

            if (! $aborted) {
                $this->store->append(
                    conversationId: $conversationId,
                    role: 'assistant',
                    content: $assembled,
                    routeName: $routeName,
                    contextHash: $contextHash,
                    inputTokens: $usage?->inputTokens ?? 0,
                    outputTokens: $usage?->outputTokens ?? 0,
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
                    'input_tokens' => $usage?->inputTokens ?? 0,
                    'output_tokens' => $usage?->outputTokens ?? 0,
                ];

                if ($chatbotException !== null) {
                    $logContext['error_code'] = $chatbotException->code();
                    $this->logger?->info('[chatbot] turn failed', $logContext);
                } else {
                    $this->emit('done', [
                        'usage' => [
                            'input_tokens' => $usage?->inputTokens ?? 0,
                            'output_tokens' => $usage?->outputTokens ?? 0,
                        ],
                    ]);

                    if ($this->events !== null) {
                        $this->events->dispatch(new ChatbotMessageCompleted(
                            inputTokens: $usage?->inputTokens ?? 0,
                            outputTokens: $usage?->outputTokens ?? 0,
                            model: $resolvedModel,
                        ));
                    }

                    $this->logger?->info('[chatbot] turn completed', $logContext);
                }
            }
        });
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
}
