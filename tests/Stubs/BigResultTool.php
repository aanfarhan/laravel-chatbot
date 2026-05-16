<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tests\Stubs;

use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Tools\ToolInvocation;

final class BigResultTool implements ChatbotTool
{
    public function name(): string
    {
        return 'big_result';
    }

    public function description(): string
    {
        return 'Returns a large payload.';
    }

    /** @return array<string, mixed> */
    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => []];
    }

    public function authorize(ToolInvocation $invocation): bool
    {
        return true;
    }

    public function handle(ToolInvocation $invocation): string
    {
        return str_repeat('x', 5000);
    }
}
