<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Streaming;

final class RecordingStreamEmitter implements StreamEmitter
{
    /** @var list<array<string, mixed>> */
    private array $recorded = [];

    public function token(string $content): void
    {
        $this->recorded[] = ['event' => 'token', 'content' => $content];
    }

    public function contextSummary(string $summary): void
    {
        $this->recorded[] = ['event' => 'context_summary', 'summary' => $summary];
    }

    public function toolStarted(string $name): void
    {
        $this->recorded[] = ['event' => 'tool_started', 'name' => $name];
    }

    public function toolFinished(string $name): void
    {
        $this->recorded[] = ['event' => 'tool_finished', 'name' => $name];
    }

    public function toolFailed(string $name): void
    {
        $this->recorded[] = ['event' => 'tool_failed', 'name' => $name];
    }

    public function error(string $code, string $message, bool $retryable): void
    {
        $this->recorded[] = ['event' => 'error', 'code' => $code, 'message' => $message, 'retryable' => $retryable];
    }

    public function done(string $conversationUuid, int $inputTokens, int $outputTokens): void
    {
        $this->recorded[] = ['event' => 'done', 'conversation_id' => $conversationUuid, 'input_tokens' => $inputTokens, 'output_tokens' => $outputTokens];
    }

    /** @return list<array<string, mixed>> */
    public function events(): array
    {
        return $this->recorded;
    }
}
