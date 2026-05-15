<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Events;

final class ChatbotMessageCompleted
{
    public function __construct(
        public readonly int $inputTokens,
        public readonly int $outputTokens,
        public readonly string $model,
    ) {}
}
