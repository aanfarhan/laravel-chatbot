<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Contracts;

use Aanfarhan\Chatbot\Tools\ToolInvocation;

interface ChatbotTool
{
    public function name(): string;

    public function description(): string;

    /**
     * Hand-written JSON-schema array in OpenAI's `parameters` shape, passed through to the provider verbatim.
     *
     * @return array<string, mixed>
     */
    public function parameters(): array;

    public function authorize(ToolInvocation $invocation): bool;

    /** @return array<string, mixed>|string */
    public function handle(ToolInvocation $invocation): array|string;
}
