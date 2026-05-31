<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Streaming;

final class SseStreamEmitter implements StreamEmitter
{
    public function token(string $content): void
    {
        $this->frame('token', ['content' => $content]);
    }

    public function contextSummary(string $summary): void
    {
        $this->frame('context_summary', ['summary' => $summary]);
    }

    public function toolStarted(string $name): void
    {
        $this->frame('tool_started', ['name' => $name, 'phase' => 'started']);
    }

    public function toolFinished(string $name): void
    {
        $this->frame('tool_finished', ['name' => $name, 'phase' => 'finished']);
    }

    public function toolFailed(string $name): void
    {
        $this->frame('tool_failed', ['name' => $name, 'phase' => 'failed']);
    }

    public function error(string $code, string $message, bool $retryable): void
    {
        $this->frame('error', ['code' => $code, 'message' => $message, 'retryable' => $retryable]);
    }

    public function done(string $conversationUuid, int $inputTokens, int $outputTokens): void
    {
        $this->frame('done', [
            'conversation_id' => $conversationUuid,
            'usage' => ['input_tokens' => $inputTokens, 'output_tokens' => $outputTokens],
        ]);
    }

    /** @param array<string, mixed> $data */
    private function frame(string $event, array $data): void
    {
        echo "event: {$event}\n";
        echo 'data: '.json_encode($data, JSON_THROW_ON_ERROR)."\n";
        echo "\n";
        flush();
    }
}
