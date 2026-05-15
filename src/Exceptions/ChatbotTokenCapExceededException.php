<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Exceptions;

final class ChatbotTokenCapExceededException extends ChatbotException
{
    public function code(): string
    {
        return 'token_cap_exceeded';
    }

    public function isRetryable(): bool
    {
        return false;
    }
}
