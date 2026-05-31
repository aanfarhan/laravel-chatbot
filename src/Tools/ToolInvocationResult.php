<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tools;

final readonly class ToolInvocationResult
{
    /**
     * @param  array{role: string, tool_call_id: string, name: string, content: string}  $message
     */
    public function __construct(
        public array $message,
        public float $elapsedSeconds,
        public InvocationStatus $status,
    ) {}
}
