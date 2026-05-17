<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tools;

final readonly class ToolInvocation
{
    /**
     * The threaded actor is NOT carried here; it is passed as the first parameter to
     * ChatbotTool::authorize() and ChatbotTool::handle(). See ADR-0003.
     *
     * @param  array<string, mixed>  $args  LLM-supplied arguments (decoded from JSON)
     * @param  array<string, mixed>  $context  Verified static context payload from the envelope
     */
    public function __construct(
        public array $args,
        public string $channel,
        public array $context,
    ) {}
}
