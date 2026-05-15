<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Events;

final class ChatbotSuspiciousContextDetected
{
    /**
     * @param  list<string>  $keyPaths  Dot-notation paths of rewritten keys
     * @param  array<string, mixed>  $payload  The sanitized context array
     */
    public function __construct(
        public readonly array $keyPaths,
        public readonly array $payload,
    ) {}
}
