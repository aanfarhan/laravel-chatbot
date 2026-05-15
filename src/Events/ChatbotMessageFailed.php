<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Events;

use Aanfarhan\Chatbot\Exceptions\ChatbotException;

final class ChatbotMessageFailed
{
    public function __construct(
        public readonly int $conversationId,
        public readonly string $channel,
        public readonly ChatbotException $exception,
    ) {}
}
