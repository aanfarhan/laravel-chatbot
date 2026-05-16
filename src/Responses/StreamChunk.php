<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Responses;

final readonly class StreamChunk
{
    /**
     * @param  list<array{id: string, name: string, arguments: string}>  $toolCalls  Assembled tool calls; non-empty only on the final chunk of a tool-calling response
     */
    public function __construct(
        public string $content,
        public ?Usage $usage = null,
        public array $toolCalls = [],
    ) {}
}
