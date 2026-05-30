<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Testing\Fixtures;

use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Tools\ToolInvocation;
use Illuminate\Contracts\Auth\Authenticatable;
use RuntimeException;

/**
 * Deterministic fixture tool whose handler always throws, so the tool-call loop
 * emits `tool_started` → `tool_failed`. Used by the Playwright e2e suite to
 * cover the failure branch; never surfaced to downstream apps. See issue 09.
 */
final class FailingTool implements ChatbotTool
{
    public function name(): string
    {
        return 'failing_tool';
    }

    public function description(): string
    {
        return 'Always fails — used to exercise the tool_failed event in e2e.';
    }

    /** @return array<string, mixed> */
    public function parameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [],
        ];
    }

    public function authorize(?Authenticatable $actor, ToolInvocation $invocation): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function handle(?Authenticatable $actor, ToolInvocation $invocation): array
    {
        throw new RuntimeException('failing_tool always fails');
    }
}
