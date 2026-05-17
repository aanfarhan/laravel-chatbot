<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tests\Stubs;

use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Tools\ToolInvocation;
use Illuminate\Contracts\Auth\Authenticatable;

final class FailingTool implements ChatbotTool
{
    public function name(): string
    {
        return 'failing_op';
    }

    public function description(): string
    {
        return 'Always throws.';
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

    /** @return array<string, mixed>|string */
    public function handle(?Authenticatable $actor, ToolInvocation $invocation): array|string
    {
        throw new \RuntimeException('simulated tool failure');
    }
}
