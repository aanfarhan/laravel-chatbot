<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Exceptions;

final class ForbiddenToolArgumentException extends ChatbotException
{
    public function code(): string
    {
        return 'forbidden_tool_argument';
    }

    public function isRetryable(): bool
    {
        return false;
    }
}
