<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tests\Stubs;

use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Tools\ToolInvocation;
use Illuminate\Contracts\Auth\Authenticatable;

final class ActorCaptureTool implements ChatbotTool
{
    public static ?Authenticatable $capturedHandleActor = null;

    public static bool $handleActorWasSet = false;

    public static ?Authenticatable $capturedAuthorizeActor = null;

    public static bool $authorizeActorWasSet = false;

    /** @var callable(?Authenticatable):bool|null */
    public static $authorizeUsing = null;

    public static function reset(): void
    {
        self::$capturedHandleActor = null;
        self::$handleActorWasSet = false;
        self::$capturedAuthorizeActor = null;
        self::$authorizeActorWasSet = false;
        self::$authorizeUsing = null;
    }

    public function name(): string
    {
        return 'actor_capture';
    }

    public function description(): string
    {
        return 'Captures the threaded actor for tests.';
    }

    /** @return array<string, mixed> */
    public function parameters(): array
    {
        return ['type' => 'object', 'properties' => new \stdClass];
    }

    public function authorize(?Authenticatable $actor, ToolInvocation $invocation): bool
    {
        self::$capturedAuthorizeActor = $actor;
        self::$authorizeActorWasSet = true;
        $cb = self::$authorizeUsing;
        if ($cb === null) {
            return true;
        }

        return ($cb)($actor);
    }

    /** @return array<string, mixed> */
    public function handle(?Authenticatable $actor, ToolInvocation $invocation): array
    {
        self::$capturedHandleActor = $actor;
        self::$handleActorWasSet = true;

        return ['ok' => true];
    }
}
