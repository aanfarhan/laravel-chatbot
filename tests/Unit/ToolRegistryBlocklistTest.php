<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Exceptions\ForbiddenToolArgumentException;
use Aanfarhan\Chatbot\Tests\Stubs\IdentityArgTool;
use Aanfarhan\Chatbot\Tests\Stubs\LookupOrderTool;
use Aanfarhan\Chatbot\Tools\ToolInvocation;
use Aanfarhan\Chatbot\Tools\ToolRegistry;
use Illuminate\Contracts\Auth\Authenticatable;

/**
 * Build a ChatbotTool with the given top-level property names.
 *
 * @param  list<string>  $propertyNames
 */
function makeBlocklistTool(string $toolName, array $propertyNames, ?array $rawParameters = null): ChatbotTool
{
    return new class($toolName, $propertyNames, $rawParameters) implements ChatbotTool
    {
        /** @param list<string> $propertyNames */
        public function __construct(
            private readonly string $toolName,
            private readonly array $propertyNames,
            private readonly ?array $rawParameters,
        ) {}

        public function name(): string
        {
            return $this->toolName;
        }

        public function description(): string
        {
            return 'stub';
        }

        public function parameters(): array
        {
            if ($this->rawParameters !== null) {
                return $this->rawParameters;
            }

            $props = [];
            foreach ($this->propertyNames as $p) {
                $props[$p] = ['type' => 'string'];
            }

            return ['type' => 'object', 'properties' => $props];
        }

        public function authorize(?Authenticatable $actor, ToolInvocation $invocation): bool
        {
            return true;
        }

        public function handle(?Authenticatable $actor, ToolInvocation $invocation): array
        {
            return [];
        }
    };
}

function registerBlocklistTool(ToolRegistry $registry, ChatbotTool $tool): void
{
    app()->instance(get_class($tool), $tool);
    $registry->register(get_class($tool));
}

// --- Slice 1: tracer ---

it('throws ForbiddenToolArgumentException when a tool declares user_id at the top level', function (): void {
    $registry = app(ToolRegistry::class);

    expect(fn () => $registry->register(IdentityArgTool::class))
        ->toThrow(ForbiddenToolArgumentException::class);
});

// --- Slice 2: message names tool, parameter, threaded-actor convention ---

it('exception message names the offending tool, the offending parameter, and points at threaded actor', function (): void {
    $registry = app(ToolRegistry::class);

    try {
        $registry->register(IdentityArgTool::class);
        $this->fail('Expected ForbiddenToolArgumentException');
    } catch (ForbiddenToolArgumentException $e) {
        expect($e->getMessage())
            ->toContain('identity_arg_tool')
            ->toContain('user_id')
            ->toContain('actor');
    }
});

// --- Slice 3: case-insensitive match ---

it('rejects case-variant spellings of a blocklisted name', function (string $variant): void {
    $registry = app(ToolRegistry::class);
    $tool = makeBlocklistTool('case_tool_'.md5($variant), [$variant]);

    expect(fn () => registerBlocklistTool($registry, $tool))
        ->toThrow(ForbiddenToolArgumentException::class);
})->with(['USER_ID', 'User_Id', 'uSeR_iD']);

// --- Slice 4: camelCase variants ---

it('rejects all camelCase identity-shaped names', function (string $name): void {
    $registry = app(ToolRegistry::class);
    $tool = makeBlocklistTool('camel_'.$name, [$name]);

    expect(fn () => registerBlocklistTool($registry, $tool))
        ->toThrow(ForbiddenToolArgumentException::class);
})->with(['userId', 'actorId', 'accountId', 'tenantId', 'viewerId', 'onBehalfOf']);

// --- Slice 5: snake_case variants ---

it('rejects all snake_case identity-shaped names', function (string $name): void {
    $registry = app(ToolRegistry::class);
    $tool = makeBlocklistTool('snake_'.$name, [$name]);

    expect(fn () => registerBlocklistTool($registry, $tool))
        ->toThrow(ForbiddenToolArgumentException::class);
})->with(['user_id', 'user', 'actor_id', 'account_id', 'tenant_id', 'viewer_id', 'on_behalf_of']);

// --- Slice 6: nested properties are not scanned ---

it('does not scan nested object properties for blocklisted names', function (): void {
    $registry = app(ToolRegistry::class);

    $tool = makeBlocklistTool('nested_ok', [], [
        'type' => 'object',
        'properties' => [
            'filter' => [
                'type' => 'object',
                'properties' => [
                    'user_id' => ['type' => 'integer'],
                ],
            ],
        ],
    ]);

    registerBlocklistTool($registry, $tool);

    expect($registry->resolve('nested_ok'))->toBeInstanceOf(ChatbotTool::class);
});

// --- Slice 7: clean schema registers without error ---

it('registers a tool with a clean schema without throwing', function (): void {
    $registry = app(ToolRegistry::class);

    $registry->register(LookupOrderTool::class);

    expect($registry->resolve('lookup_order'))->toBeInstanceOf(LookupOrderTool::class);
});

it('registers a tool with no properties key without throwing', function (): void {
    $registry = app(ToolRegistry::class);
    $tool = makeBlocklistTool('no_props', [], ['type' => 'object']);

    registerBlocklistTool($registry, $tool);

    expect($registry->resolve('no_props'))->toBeInstanceOf(ChatbotTool::class);
});
