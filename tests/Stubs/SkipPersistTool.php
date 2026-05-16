<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tests\Stubs;

use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Contracts\PersistableTool;
use Aanfarhan\Chatbot\Tools\ToolInvocation;

final class SkipPersistTool implements ChatbotTool, PersistableTool
{
    public function name(): string
    {
        return 'skip_persist';
    }

    public function description(): string
    {
        return 'A tool that opts out of persistence entirely.';
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
        return 'done';
    }

    /** @return array<string, mixed>|null */
    public function persist(ToolInvocation $invocation, mixed $result): ?array
    {
        return null;
    }
}
