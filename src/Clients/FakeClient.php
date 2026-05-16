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

    /** @var list<list<string|StreamChunk>> */
    private array $streamQueue = [];

    private bool $streamAborted = false;

    private ?\Throwable $streamException = null;

    /** @var list<list<array<string, mixed>>> */
    private array $recorded = [];

    /** @var list<string|null> */
    private array $recordedModels = [];

    /** @var list<list<array<string, mixed>>> */
    private array $recordedTools = [];

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

    /**
     * @param  list<string>  $chunksBefore
     */
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
     * @return list<list<array<string, mixed>>>
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
     * Stage a single tool call as the next stream response.
     *
     * @param  array<string, mixed>  $arguments
     */
    public function respondWithToolCall(string $name, array $arguments, string $callId = 'call_1'): self
    {
        return $this->respondWithToolCalls([
            ['name' => $name, 'arguments' => $arguments, 'id' => $callId],
        ]);
    }

    /**
     * Stage multiple tool calls as the next stream response.
     *
     * @param  list<array{name: string, arguments: array<string, mixed>, id: string}>  $calls
     */
    public function respondWithToolCalls(array $calls): self
    {
        $toolCalls = array_map(
            fn (array $c): array => [
                'id' => $c['id'],
                'name' => $c['name'],
                'arguments' => json_encode($c['arguments'], JSON_THROW_ON_ERROR),
            ],
            $calls,
        );

        $this->streamQueue[] = [new StreamChunk('', toolCalls: $toolCalls)];

        return $this;
    }

    public function assertToolCalled(string $name, ?callable $argsCallback = null): void
    {
        foreach ($this->recorded as $messages) {
            foreach ($messages as $msg) {
                if (! is_string($msg['role'] ?? null) || $msg['role'] !== 'tool') {
                    continue;
                }

                if (! is_string($msg['name'] ?? null) || $msg['name'] !== $name) {
                    continue;
                }

                if ($argsCallback === null) {
                    return;
                }

                $callId = is_string($msg['tool_call_id'] ?? null) ? $msg['tool_call_id'] : '';
                $args = $this->findToolCallArgs($messages, $callId);
                if ($argsCallback($args)) {
                    return;
                }
            }
        }

        Assert::fail("Tool '{$name}' was not called".(
            $argsCallback !== null ? ' with the expected arguments' : ''
        ).'.');
    }

    public function assertToolNotCalled(string $name): void
    {
        $calledCount = 0;

        foreach ($this->recorded as $messages) {
            foreach ($messages as $msg) {
                if (is_string($msg['role'] ?? null) && $msg['role'] === 'tool'
                    && is_string($msg['name'] ?? null) && $msg['name'] === $name
                ) {
                    $calledCount++;
                }
            }
        }

        Assert::assertSame(0, $calledCount, "Tool '{$name}' was called {$calledCount} time(s) but was expected not to be.");
    }

    /**
     * @param  list<array<string, mixed>>  $messages
     * @return array<string, mixed>
     */
    private function findToolCallArgs(array $messages, string $callId): array
    {
        foreach ($messages as $msg) {
            if (! is_string($msg['role'] ?? null) || $msg['role'] !== 'assistant') {
                continue;
            }

            $toolCalls = is_array($msg['tool_calls'] ?? null) ? $msg['tool_calls'] : [];
            foreach ($toolCalls as $tc) {
                if (! is_array($tc)) {
                    continue;
                }

                if (is_string($tc['id'] ?? null) && $tc['id'] === $callId) {
                    $fnArgs = is_array($tc['function'] ?? null) ? $tc['function'] : [];
                    $raw = is_string($fnArgs['arguments'] ?? null) ? $fnArgs['arguments'] : '{}';
                    $decoded = json_decode($raw, true);

                    return is_array($decoded) ? $decoded : [];
                }
            }
        }

        return [];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function lastSentTools(): array
    {
        return $this->recordedTools !== [] ? $this->recordedTools[count($this->recordedTools) - 1] : [];
    }

    /**
     * @return iterable<StreamChunk>
     */
    public function stream(array $messages, array $tools = [], ?string $model = null): iterable
    {
        $this->recorded[] = $messages;
        $this->recordedModels[] = $model;
        $this->recordedTools[] = $tools;
        $this->streamAborted = false;

        $chunks = array_shift($this->streamQueue) ?? [];
        $exception = $this->streamException;
        $this->streamException = null;
        $exhausted = false;

        try {
            foreach ($chunks as $item) {
                yield $item instanceof StreamChunk ? $item : new StreamChunk($item);
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
