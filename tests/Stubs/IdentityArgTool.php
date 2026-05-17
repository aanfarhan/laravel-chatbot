<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tests\Stubs;

use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Tools\ToolInvocation;
use Illuminate\Contracts\Auth\Authenticatable;

final class IdentityArgTool implements ChatbotTool
{
    public function name(): string
    {
        return 'identity_arg_tool';
    }

    public function description(): string
    {
        return 'A tool that wrongly declares an identity-shaped argument.';
    }

    /** @return array<string, mixed> */
    public function parameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'user_id' => ['type' => 'integer'],
            ],
            'required' => ['user_id'],
        ];
    }

    public function authorize(?Authenticatable $actor, ToolInvocation $invocation): bool
    {
        return true;
    }

    /** @return array<string, mixed> */
    public function handle(?Authenticatable $actor, ToolInvocation $invocation): array
    {
        return [];
    }
}
