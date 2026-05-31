<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tests\Stubs;

use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Tools\ToolInvocation;
use Illuminate\Contracts\Auth\Authenticatable;

final class MultibyteResultTool implements ChatbotTool
{
    public function name(): string
    {
        return 'multibyte_result';
    }

    public function description(): string
    {
        return 'Returns a large multi-byte payload.';
    }

    /** @return array<string, mixed> */
    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => []];
    }

    public function authorize(?Authenticatable $actor, ToolInvocation $invocation): bool
    {
        return true;
    }

    public function handle(?Authenticatable $actor, ToolInvocation $invocation): string
    {
        // Odd-byte prefix shifts the cap boundary to land mid-way through a 2-byte é.
        return 'ab'.str_repeat('é', 500);
    }
}
