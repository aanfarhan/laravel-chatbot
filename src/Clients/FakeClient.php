<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Clients;

use Aanfarhan\Chatbot\Contracts\LLMClient;
use Aanfarhan\Chatbot\Responses\ChatResponse;
use Aanfarhan\Chatbot\Responses\StreamChunk;
use Illuminate\Support\Facades\Log;
use PHPUnit\Framework\Assert;

final class FakeClient implements LLMClient
{
    public const CANNED_REPLY = "I'm a fake chatbot — no reply has been queued for this test.";

    /** @var list<string> */
    private array $queue = [];

    /** @var list<list<string>> */
    private array $streamQueue = [];

    private bool $streamAborted = false;

    private ?\Throwable $streamException = null;

    /** @var list<list<array{role: string, content: string}>> */
    private array $recorded = [];

    /** @var list<string|null> */
    private array $recordedModels = [];

    public function respondWith(string $reply): self
    {
        $this->queue[] = $reply;

        return $this;
    }

    /**
     * @param  list<string>  $chunks
     */
    public function respondWithStream(array $chunks): self
    {
        $this->streamQueue[] = $chunks;

        return $this;
    }

    public function throwDuringStream(\Throwable $exception, array $chunksBefore = []): self
    {
        $this->streamException = $exception;
        $this->streamQueue[] = $chunksBefore;

        return $this;
    }

    public function chat(array $messages, array $tools = [], ?string $model = null): ChatResponse
    {
        $this->recorded[] = $messages;
        $this->recordedModels[] = $model;

        if ($this->queue === []) {
            Log::warning('Aanfarhan\\Chatbot\\Clients\\FakeClient::chat() was called with no queued reply; returning canned response. Use respondWith() to set one.');

            return new ChatResponse(self::CANNED_REPLY);
        }

        return new ChatResponse((string) array_shift($this->queue));
    }

    /**
     * @return list<list<array{role: string, content: string}>>
     */
    public function recordedPrompts(): array
    {
        return $this->recorded;
    }

    public function assertSentPrompt(callable $callback): void
    {
        foreach ($this->recorded as $messages) {
            if ($callback($messages)) {
                return;
            }
        }

        Assert::fail('No recorded prompt matched the assertion callback.');
    }

    public function wasStreamAborted(): bool
    {
        return $this->streamAborted;
    }

    public function assertSentWithModel(string $model): void
    {
        foreach ($this->recordedModels as $sent) {
            if ($sent === $model) {
                return;
            }
        }

        Assert::fail("No call was made with model '{$model}'. Recorded models: ".implode(', ', array_map(
            static fn (?string $m): string => $m ?? '(null)',
            $this->recordedModels,
        )));
    }

    public function assertNothingSent(): void
    {
        Assert::assertEmpty(
            $this->recorded,
            'Expected no LLM calls to be made, but '.count($this->recorded).' call(s) were recorded.',
        );
    }

    /**
     * @return iterable<StreamChunk>
     */
    public function stream(array $messages, array $tools = [], ?string $model = null): iterable
    {
        $this->recorded[] = $messages;
        $this->recordedModels[] = $model;
        $this->streamAborted = false;

        $chunks = array_shift($this->streamQueue) ?? [];
        $exception = $this->streamException;
        $this->streamException = null;
        $exhausted = false;

        try {
            foreach ($chunks as $content) {
                yield new StreamChunk($content);
            }

            if ($exception !== null) {
                throw $exception;
            }

            $exhausted = true;
        } finally {
            if (! $exhausted) {
                $this->streamAborted = true;
            }
        }
    }
}
