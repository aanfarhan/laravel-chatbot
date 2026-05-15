<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Exceptions;

final class ChatbotProviderException extends ChatbotException
{
    public function __construct(
        string $message = '',
        private readonly bool $retryable = false,
        ?\Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }

    public function code(): string
    {
        return 'provider_error';
    }

    public function isRetryable(): bool
    {
        return $this->retryable;
    }
}
