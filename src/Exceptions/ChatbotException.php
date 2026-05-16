<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Exceptions;

use RuntimeException;

abstract class ChatbotException extends RuntimeException
{
    abstract public function code(): string;

    abstract public function isRetryable(): bool;
}
