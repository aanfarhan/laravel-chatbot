<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Streaming;

interface StreamEmitter
{
    public function token(string $content): void;

    public function contextSummary(string $summary): void;

    public function toolStarted(string $name): void;

    public function toolFinished(string $name): void;

    public function toolFailed(string $name): void;

    public function error(string $code, string $message, bool $retryable): void;

    public function done(string $conversationUuid, int $inputTokens, int $outputTokens): void;
}
