<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tests\Stubs;

use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Tools\ToolInvocation;
use Illuminate\Contracts\Auth\Authenticatable;

final class SpyLookupTool implements ChatbotTool
{
    public static int $authorizeCalls = 0;

    public static int $handleCalls = 0;

    public static function reset(): void
    {
        self::$authorizeCalls = 0;
        self::$handleCalls = 0;
    }

    public function name(): string
    {
        return 'spy_lookup';
    }

    public function description(): string
    {
        return 'Spy that records authorize/handle invocations.';
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

    public function authorize(?Authenticatable $actor, ToolInvocation $invocation): bool
    {
        self::$authorizeCalls++;

        return true;
    }

    /** @return array<string, mixed> */
    public function handle(?Authenticatable $actor, ToolInvocation $invocation): array
    {
        self::$handleCalls++;

        return ['ok' => true];
    }
}
