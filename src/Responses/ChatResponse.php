<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Responses;

final readonly class ChatResponse
{
    public function __construct(
        public string $content,
        public ?Usage $usage = null,
    ) {}
}
