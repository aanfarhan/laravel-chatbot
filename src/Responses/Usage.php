<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Responses;

final readonly class Usage
{
    public function __construct(
        public int $inputTokens,
        public int $outputTokens,
    ) {}
}
