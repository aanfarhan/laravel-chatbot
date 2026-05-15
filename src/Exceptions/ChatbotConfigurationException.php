<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Exceptions;

final class ChatbotConfigurationException extends ChatbotException
{
    public function code(): string
    {
        return 'configuration_error';
    }

    public function isRetryable(): bool
    {
        return false;
    }
}
