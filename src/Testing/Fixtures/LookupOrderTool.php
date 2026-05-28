<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Testing\Fixtures;

use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Tools\ToolInvocation;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Deterministic fixture tool used by the Playwright e2e suite.
 *
 * Registered only when `chatbot.playwright_fixture.enabled` is true; never
 * surfaced to downstream apps in normal installs. See ADR/issue 03.
 */
final class LookupOrderTool implements ChatbotTool
{
    public function name(): string
    {
        return 'lookup_order';
    }

    public function description(): string
    {
        return 'Look up the status of an order by ID.';
    }

    /** @return array<string, mixed> */
    public function parameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'order_id' => ['type' => 'string', 'description' => 'The order ID'],
            ],
            'required' => ['order_id'],
        ];
    }

    public function authorize(?Authenticatable $actor, ToolInvocation $invocation): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function handle(?Authenticatable $actor, ToolInvocation $invocation): array
    {
        $orderId = $invocation->args['order_id'] ?? 'ORD-1042';

        return [
            'order_id' => is_string($orderId) ? $orderId : 'ORD-1042',
            'status' => 'shipped',
            'eta_days' => 2,
        ];
    }
}
