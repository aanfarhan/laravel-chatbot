<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Exceptions;

final class ChatbotContentBlockedException extends ChatbotException
{
    public function code(): string
    {
        return 'content_blocked';
    }

    public function isRetryable(): bool
    {
        return false;
    }
}
