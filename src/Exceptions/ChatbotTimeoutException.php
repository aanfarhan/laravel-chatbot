<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Exceptions;

final class ChatbotTimeoutException extends ChatbotException
{
    public function code(): string
    {
        return 'timeout';
    }

    public function isRetryable(): bool
    {
        return true;
    }
}
