<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tests\Stubs;

use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Contracts\PersistableTool;
use Aanfarhan\Chatbot\Tools\ToolInvocation;

final class RedactingOrderTool implements ChatbotTool, PersistableTool
{
    public function name(): string
    {
        return 'redacting_order';
    }

    public function description(): string
    {
        return 'Look up an order, but redact sensitive fields before persistence.';
    }

    /** @return array<string, mixed> */
    public function parameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'order_id' => ['type' => 'integer'],
            ],
            'required' => ['order_id'],
        ];
    }

    public function authorize(ToolInvocation $invocation): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function handle(ToolInvocation $invocation): array
    {
        return [
            'order_id' => $invocation->args['order_id'],
            'secret_token' => 'tok_super_secret',
        ];
    }

    /** @return array<string, mixed> */
    public function persist(ToolInvocation $invocation, mixed $result): array
    {
        return ['order_id' => $invocation->args['order_id']];
    }
}
