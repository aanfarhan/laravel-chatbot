<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Events;

final class ChatbotMessageStarted
{
    public function __construct(
        public readonly int $conversationId,
        public readonly string $channel,
        public readonly string $model,
    ) {}
}
