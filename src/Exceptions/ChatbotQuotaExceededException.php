<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Exceptions;

final class ChatbotQuotaExceededException extends ChatbotException
{
    public function code(): string
    {
        return 'quota_exceeded';
    }

    public function isRetryable(): bool
    {
        return false;
    }
}
