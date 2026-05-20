<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tests\Stubs;

use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Tools\ToolInvocation;
use Closure;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * A tool whose handler can advance a test-controlled clock, simulating wall-clock
 * spent blocked inside a synchronous handler without sleeping for real.
 */
final class SlowTool implements ChatbotTool
{
    /** @var Closure():void|null */
    public static ?Closure $onHandle = null;

    public static function reset(): void
    {
        self::$onHandle = null;
    }

    public function name(): string
    {
        return 'slow_op';
    }

    public function description(): string
    {
        return 'A deliberately slow operation.';
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

    /** @return array<string, mixed> */
    public function handle(?Authenticatable $actor, ToolInvocation $invocation): array
    {
        if (self::$onHandle !== null) {
            (self::$onHandle)();
        }

        return ['done' => true];
    }
}
