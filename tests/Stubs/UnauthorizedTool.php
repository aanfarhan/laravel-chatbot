<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tests\Stubs;

use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Tools\ToolInvocation;

final class UnauthorizedTool implements ChatbotTool
{
    public function name(): string
    {
        return 'unauthorized_op';
    }

    public function description(): string
    {
        return 'Always denied.';
    }

    /** @return array<string, mixed> */
    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => []];
    }

    public function authorize(ToolInvocation $invocation): bool
    {
        return false;
    }

    public function handle(ToolInvocation $invocation): string
    {
        return 'should never run';
    }
}
