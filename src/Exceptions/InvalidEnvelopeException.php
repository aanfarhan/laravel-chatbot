<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Exceptions;

abstract class InvalidEnvelopeException extends ChatbotException
{
    public function code(): string
    {
        return 'invalid_envelope';
    }

    public function isRetryable(): bool
    {
        return false;
    }
}
