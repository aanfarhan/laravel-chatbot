<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Contracts\PersistableTool;
use Aanfarhan\Chatbot\Contracts\ToolInvocationStore;
use Aanfarhan\Chatbot\Contracts\ToolResolver;
use Aanfarhan\Chatbot\Persistence\ToolInvocationRecord;
use Aanfarhan\Chatbot\Streaming\RecordingStreamEmitter;
use Aanfarhan\Chatbot\Tools\InvocationStatus;
use Aanfarhan\Chatbot\Tools\ToolInvocation;
use Aanfarhan\Chatbot\Tools\ToolInvoker;
use Illuminate\Contracts\Auth\Authenticatable;

// ---------------------------------------------------------------------------
// Test infrastructure
// ---------------------------------------------------------------------------

final class RecordingToolInvocationStore implements ToolInvocationStore
{
    /** @var list<array<string, mixed>> */
    public array $recorded = [];

    public function record(
        int $conversationId,
        ?int $messageId,
        string $toolName,
        array $arguments,
        string $result,
        string $status,
        ?string $error,
        DateTimeInterface $startedAt,
        DateTimeInterface $finishedAt,
        bool $overran = false,
    ): ToolInvocationRecord {
        $this->recorded[] = [
            'conversationId' => $conversationId,
            'toolName' => $toolName,
            'arguments' => $arguments,
            'result' => $result,
            'status' => $status,
            'error' => $error,
            'overran' => $overran,
        ];

        return new ToolInvocationRecord(
            id: count($this->recorded),
            conversationId: $conversationId,
            messageId: $messageId,
            toolName: $toolName,
            arguments: $arguments,
            result: $result,
            status: $status,
            overran: $overran,
            error: $error,
            startedAt: $startedAt,
            finishedAt: $finishedAt,
        );
    }

    public function freshFor(int $conversationId, int $windowSeconds): array
    {
        return [];
    }
}

function makeResolver(?ChatbotTool $tool): ToolResolver
{
    return new class($tool) implements ToolResolver
    {
        public function __construct(private ?ChatbotTool $tool) {}

        public function resolve(string $name): ?ChatbotTool
        {
            return $this->tool;
        }
    };
}

function makeOkTool(string $name = 'test_tool', string $result = 'ok result'): ChatbotTool
{
    return new class($name, $result) implements ChatbotTool
    {
        public function __construct(private string $n, private string $r) {}

        public function name(): string
        {
            return $this->n;
        }

        public function description(): string
        {
            return 'test';
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
            return $this->r;
        }
    };
}

function makeInvoker(
    ?ToolResolver $resolver = null,
    ?RecordingToolInvocationStore $store = null,
    ?RecordingStreamEmitter $emitter = null,
    int $defaultTimeout = 10,
    int $resultSizeCap = 4096,
    int $maxArgLength = 10240,
): ToolInvoker {
    return new ToolInvoker(
        resolver: $resolver ?? makeResolver(makeOkTool()),
        invocationStore: $store ?? new RecordingToolInvocationStore,
        emitter: $emitter ?? new RecordingStreamEmitter,
        defaultTimeout: $defaultTimeout,
        resultSizeCap: $resultSizeCap,
        maxArgLength: $maxArgLength,
    );
}

// ---------------------------------------------------------------------------
// Tracer bullet: ok path
// ---------------------------------------------------------------------------

it('returns a ToolInvocationResult with status ok for a successful invocation', function (): void {
    $invoker = makeInvoker(resolver: makeResolver(makeOkTool('test_tool', 'ok result')));

    $result = $invoker->invoke(
        name: 'test_tool',
        argumentsJson: '{}',
        callId: 'call_1',
        channel: 'default',
        conversationId: 42,
    );

    expect($result->status)->toBe(InvocationStatus::Ok);
    expect($result->message['role'])->toBe('tool');
    expect($result->message['tool_call_id'])->toBe('call_1');
    expect($result->message['name'])->toBe('test_tool');
    expect($result->message['content'])->toBe('ok result');
    expect($result->elapsedSeconds)->toBeGreaterThanOrEqual(0.0);
});

// ---------------------------------------------------------------------------
// ok path: persistence
// ---------------------------------------------------------------------------

it('persists a record with status=ok for a successful invocation', function (): void {
    $store = new RecordingToolInvocationStore;

    $invoker = makeInvoker(
        resolver: makeResolver(makeOkTool('order_tool', 'result data')),
        store: $store,
    );

    $invoker->invoke(
        name: 'order_tool',
        argumentsJson: '{}',
        callId: 'call_2',
        channel: 'default',
        conversationId: 7,
    );

    expect($store->recorded)->toHaveCount(1);
    expect($store->recorded[0]['toolName'])->toBe('order_tool');
    expect($store->recorded[0]['status'])->toBe('ok');
    expect($store->recorded[0]['error'])->toBeNull();
    expect($store->recorded[0]['conversationId'])->toBe(7);
});

// ---------------------------------------------------------------------------
// ok path: emitter events
// ---------------------------------------------------------------------------

it('emits toolStarted then toolFinished for a successful invocation', function (): void {
    $emitter = new RecordingStreamEmitter;

    $invoker = makeInvoker(
        resolver: makeResolver(makeOkTool()),
        emitter: $emitter,
    );

    $invoker->invoke('test_tool', '{}', 'c', 'default', 1);

    expect(array_column($emitter->events(), 'event'))->toBe(['tool_started', 'tool_finished']);
});

// ---------------------------------------------------------------------------
// rejected_allowlist
// ---------------------------------------------------------------------------

it('returns rejected_allowlist result and persists record when tool not in allowlist', function (): void {
    $store = new RecordingToolInvocationStore;
    $emitter = new RecordingStreamEmitter;

    $invoker = makeInvoker(
        resolver: makeResolver(makeOkTool()),
        store: $store,
        emitter: $emitter,
    );

    $result = $invoker->invoke(
        name: 'blocked_tool',
        argumentsJson: '{}',
        callId: 'c1',
        channel: 'restricted',
        conversationId: 5,
        allowedTools: ['other_tool'],
    );

    expect($result->status)->toBe(InvocationStatus::RejectedAllowlist);
    expect($result->message['content'])->toContain('not permitted');
    expect($store->recorded)->toHaveCount(1);
    expect($store->recorded[0]['status'])->toBe('rejected_allowlist');
    expect(array_column($emitter->events(), 'event'))->toBe([]);
});

// ---------------------------------------------------------------------------
// rejected_not_found
// ---------------------------------------------------------------------------

it('returns rejected_not_found result and persists record when tool not in registry', function (): void {
    $store = new RecordingToolInvocationStore;

    $invoker = makeInvoker(
        resolver: makeResolver(null),
        store: $store,
    );

    $result = $invoker->invoke(
        name: 'ghost_tool',
        argumentsJson: '{}',
        callId: 'c2',
        channel: 'default',
        conversationId: 5,
    );

    expect($result->status)->toBe(InvocationStatus::RejectedNotFound);
    expect($result->message['content'])->toContain('not found');
    expect($store->recorded)->toHaveCount(1);
    expect($store->recorded[0]['status'])->toBe('rejected_not_found');
});

// ---------------------------------------------------------------------------
// rejected_schema
// ---------------------------------------------------------------------------

it('returns rejected_schema and persists record when args fail schema validation', function (): void {
    $tool = new class implements ChatbotTool
    {
        public function name(): string
        {
            return 'strict_tool';
        }

        public function description(): string
        {
            return 'requires order_id';
        }

        /** @return array<string, mixed> */
        public function parameters(): array
        {
            return [
                'type' => 'object',
                'properties' => ['order_id' => ['type' => 'integer']],
                'required' => ['order_id'],
            ];
        }

        public function authorize(?Authenticatable $actor, ToolInvocation $invocation): bool
        {
            return true;
        }

        public function handle(?Authenticatable $actor, ToolInvocation $invocation): string
        {
            return 'ok';
        }
    };

    $store = new RecordingToolInvocationStore;
    $emitter = new RecordingStreamEmitter;

    $invoker = makeInvoker(
        resolver: makeResolver($tool),
        store: $store,
        emitter: $emitter,
    );

    $result = $invoker->invoke(
        name: 'strict_tool',
        argumentsJson: '{}',
        callId: 'c3',
        channel: 'default',
        conversationId: 5,
    );

    expect($result->status)->toBe(InvocationStatus::RejectedSchema);
    expect($result->message['content'])->toContain('schema');
    expect($store->recorded)->toHaveCount(1);
    expect($store->recorded[0]['status'])->toBe('rejected_schema');
    expect(array_column($emitter->events(), 'event'))->toBe(['tool_failed']);
});

// ---------------------------------------------------------------------------
// rejected_unauthorized
// ---------------------------------------------------------------------------

it('returns rejected_unauthorized and persists record when authorize returns false', function (): void {
    $tool = new class implements ChatbotTool
    {
        public function name(): string
        {
            return 'locked_tool';
        }

        public function description(): string
        {
            return 'always denied';
        }

        /** @return array<string, mixed> */
        public function parameters(): array
        {
            return ['type' => 'object', 'properties' => []];
        }

        public function authorize(?Authenticatable $actor, ToolInvocation $invocation): bool
        {
            return false;
        }

        public function handle(?Authenticatable $actor, ToolInvocation $invocation): string
        {
            return 'nope';
        }
    };

    $store = new RecordingToolInvocationStore;
    $emitter = new RecordingStreamEmitter;

    $invoker = makeInvoker(
        resolver: makeResolver($tool),
        store: $store,
        emitter: $emitter,
    );

    $result = $invoker->invoke(
        name: 'locked_tool',
        argumentsJson: '{}',
        callId: 'c4',
        channel: 'default',
        conversationId: 5,
    );

    expect($result->status)->toBe(InvocationStatus::RejectedUnauthorized);
    expect($result->message['content'])->toContain('not authorized');
    expect($store->recorded)->toHaveCount(1);
    expect($store->recorded[0]['status'])->toBe('rejected_unauthorized');
    expect(array_column($emitter->events(), 'event'))->toContain('tool_failed');
});

// ---------------------------------------------------------------------------
// handler_error
// ---------------------------------------------------------------------------

it('returns handler_error and persists record when the tool throws', function (): void {
    $tool = new class implements ChatbotTool
    {
        public function name(): string
        {
            return 'bomb_tool';
        }

        public function description(): string
        {
            return 'always throws';
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
            throw new RuntimeException('boom');
        }
    };

    $store = new RecordingToolInvocationStore;
    $emitter = new RecordingStreamEmitter;

    $invoker = makeInvoker(
        resolver: makeResolver($tool),
        store: $store,
        emitter: $emitter,
    );

    $result = $invoker->invoke(
        name: 'bomb_tool',
        argumentsJson: '{}',
        callId: 'c5',
        channel: 'default',
        conversationId: 5,
    );

    expect($result->status)->toBe(InvocationStatus::HandlerError);
    expect($result->message['content'])->toContain('boom');
    expect($store->recorded)->toHaveCount(1);
    expect($store->recorded[0]['status'])->toBe('handler_error');
    expect($store->recorded[0]['error'])->toBe('boom');
    expect(array_column($emitter->events(), 'event'))->toContain('tool_failed');
});

// ---------------------------------------------------------------------------
// Overrun flag
// ---------------------------------------------------------------------------

it('sets overran=true on the record when the handler exceeds the advisory budget', function (): void {
    $store = new RecordingToolInvocationStore;

    $invoker = makeInvoker(
        resolver: makeResolver(makeOkTool()),
        store: $store,
        defaultTimeout: -1,
    );

    $invoker->invoke('test_tool', '{}', 'c', 'default', 1);

    expect($store->recorded[0]['overran'])->toBeTrue();
});

it('sets overran=false on the record when the handler completes within budget', function (): void {
    $store = new RecordingToolInvocationStore;

    $invoker = makeInvoker(
        resolver: makeResolver(makeOkTool()),
        store: $store,
        defaultTimeout: 3600,
    );

    $invoker->invoke('test_tool', '{}', 'c', 'default', 1);

    expect($store->recorded[0]['overran'])->toBeFalse();
});

// ---------------------------------------------------------------------------
// PersistableTool: null skips write
// ---------------------------------------------------------------------------

it('writes no record when PersistableTool::persist returns null', function (): void {
    $tool = new class implements ChatbotTool, PersistableTool
    {
        public function name(): string
        {
            return 'skip_tool';
        }

        public function description(): string
        {
            return 'skip persist';
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
            return 'data';
        }

        /** @return array<string, mixed>|null */
        public function persist(ToolInvocation $invocation, mixed $result): ?array
        {
            return null;
        }
    };

    $store = new RecordingToolInvocationStore;

    $invoker = makeInvoker(
        resolver: makeResolver($tool),
        store: $store,
    );

    $invoker->invoke('skip_tool', '{}', 'c', 'default', 1);

    expect($store->recorded)->toHaveCount(0);
});

// ---------------------------------------------------------------------------
// PersistableTool: sanitized payload
// ---------------------------------------------------------------------------

it('stores the sanitized payload from PersistableTool::persist instead of the raw result', function (): void {
    $tool = new class implements ChatbotTool, PersistableTool
    {
        public function name(): string
        {
            return 'redacting_tool';
        }

        public function description(): string
        {
            return 'redacts secrets';
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
            return ['id' => 99, 'secret' => 'topsecret'];
        }

        /** @return array<string, mixed>|null */
        public function persist(ToolInvocation $invocation, mixed $result): ?array
        {
            return ['id' => $result['id']];
        }
    };

    $store = new RecordingToolInvocationStore;

    $invoker = makeInvoker(
        resolver: makeResolver($tool),
        store: $store,
    );

    $invoker->invoke('redacting_tool', '{}', 'c', 'default', 1);

    expect($store->recorded)->toHaveCount(1);
    $stored = json_decode($store->recorded[0]['result'], true);
    expect($stored)->toBe(['id' => 99]);
    expect($stored)->not->toHaveKey('secret');
});

// ---------------------------------------------------------------------------
// Result truncation
// ---------------------------------------------------------------------------

it('truncates the result content to the resultSizeCap', function (): void {
    $invoker = makeInvoker(
        resolver: makeResolver(makeOkTool('big_tool', str_repeat('x', 200))),
        resultSizeCap: 100,
    );

    $result = $invoker->invoke('big_tool', '{}', 'c', 'default', 1);

    expect(strlen($result->message['content']))->toBeLessThanOrEqual(100);
});
