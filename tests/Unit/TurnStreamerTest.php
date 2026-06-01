<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Clients\FakeClient;
use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Contracts\ToolResolver;
use Aanfarhan\Chatbot\Streaming\RecordingStreamEmitter;
use Aanfarhan\Chatbot\Streaming\TurnOutcome;
use Aanfarhan\Chatbot\Streaming\TurnStreamer;
use Aanfarhan\Chatbot\Support\Clock;
use Aanfarhan\Chatbot\Tests\Stubs\SlowTool;
use Aanfarhan\Chatbot\Tools\ToolInvoker;

// ──────────────────────────────────────────────────────────────────────────────
// Slice 1 – clean completion
// ──────────────────────────────────────────────────────────────────────────────

it('returns Completed with assembled text on a clean stream', function (): void {
    $client = new FakeClient;
    $client->respondWithStream(['Hel', 'lo']);

    $now = 0.0;
    $clock = new Clock(fn () => $now);

    $emitter = new RecordingStreamEmitter;
    $streamer = new TurnStreamer($client, $emitter, null, $clock);

    $result = $streamer->run(
        messages: [['role' => 'user', 'content' => 'hi']],
        toolDefs: [],
        maxCalls: 5,
        streamDuration: 60,
        startedAt: 0.0,
        isAborted: fn () => false,
        model: null,
        channel: 'default',
        conversationId: 1,
        actor: null,
        allowedTools: null,
    );

    expect($result->outcome)->toBe(TurnOutcome::Completed);
    expect($result->assembled)->toBe('Hello');
    expect($result->failure)->toBeNull();
    expect(array_column($emitter->events(), 'event'))->toBe(['token', 'token']);
});

// ──────────────────────────────────────────────────────────────────────────────
// Slice 2 – abort mid-stream
// ──────────────────────────────────────────────────────────────────────────────

it('returns Aborted when connection is aborted mid-stream', function (): void {
    $client = new FakeClient;
    $client->respondWithStream(['A', 'B', 'C']);

    $now = 0.0;
    $emitter = new RecordingStreamEmitter;
    $streamer = new TurnStreamer($client, $emitter, null, new Clock(fn () => $now));

    $calls = 0;
    $result = $streamer->run(
        messages: [['role' => 'user', 'content' => 'hi']],
        toolDefs: [],
        maxCalls: 5,
        streamDuration: 60,
        startedAt: 0.0,
        isAborted: function () use (&$calls): bool {
            return ++$calls > 1; // abort after first chunk processed
        },
        model: null,
        channel: 'default',
        conversationId: 1,
        actor: null,
        allowedTools: null,
    );

    expect($result->outcome)->toBe(TurnOutcome::Aborted);
    expect($result->failure)->toBeNull();
    expect($result->assembled)->toBe('A'); // first chunk arrived before abort
});

// ──────────────────────────────────────────────────────────────────────────────
// Slice 3 – budget exhaustion: pre-round check
// ──────────────────────────────────────────────────────────────────────────────

it('returns Failed(timeout) when stream duration is already exceeded before the first round', function (): void {
    $client = new FakeClient;
    $client->respondWithStream(['never seen']);

    // clock starts past the budget
    $now = 100.0;
    $emitter = new RecordingStreamEmitter;
    $streamer = new TurnStreamer($client, $emitter, null, new Clock(fn () => $now));

    $result = $streamer->run(
        messages: [['role' => 'user', 'content' => 'hi']],
        toolDefs: [],
        maxCalls: 5,
        streamDuration: 10,   // budget: 10s
        startedAt: 0.0,       // now() - startedAt = 100 >= 10 → fires immediately
        isAborted: fn () => false,
        model: null,
        channel: 'default',
        conversationId: 1,
        actor: null,
        allowedTools: null,
    );

    expect($result->outcome)->toBe(TurnOutcome::Failed);
    expect($result->failure)->not->toBeNull();
    expect($result->failure->code())->toBe('timeout');
    expect($result->assembled)->toBe(''); // nothing streamed before the check fired
});

// ──────────────────────────────────────────────────────────────────────────────
// Slice 4 – budget exhaustion: mid-chunk check, partial assembled preserved
// ──────────────────────────────────────────────────────────────────────────────

it('returns Failed(timeout) mid-stream and preserves partial assembled text', function (): void {
    $client = new FakeClient;
    $client->respondWithStream(['Part', 'ial']);

    // now() is called: (1) pre-round, (2) mid-chunk for 'Part', (3) mid-chunk for 'ial'.
    // Budget fires on call 3 — timeout thrown before 'ial' is appended → assembled = 'Part'.
    $calls = 0;
    $clock = new Clock(function () use (&$calls): float {
        return ++$calls === 3 ? 100.0 : 0.0;
    });

    $emitter = new RecordingStreamEmitter;
    $streamer = new TurnStreamer($client, $emitter, null, $clock);

    $result = $streamer->run(
        messages: [['role' => 'user', 'content' => 'hi']],
        toolDefs: [],
        maxCalls: 5,
        streamDuration: 10,
        startedAt: 0.0,
        isAborted: fn () => false,
        model: null,
        channel: 'default',
        conversationId: 1,
        actor: null,
        allowedTools: null,
    );

    expect($result->outcome)->toBe(TurnOutcome::Failed);
    expect($result->failure->code())->toBe('timeout');
    expect($result->assembled)->toBe('Part');
});

// ──────────────────────────────────────────────────────────────────────────────
// Slice 5 – max_calls cutoff: budget-exhausted message + toolDefs zeroed
// ──────────────────────────────────────────────────────────────────────────────

it('sends budget-exhausted message for all calls when maxCalls=0 then zeroes toolDefs and completes', function (): void {
    $client = new FakeClient;
    $client->respondWithToolCalls([
        ['name' => 'ping', 'arguments' => '{}', 'id' => 'c1'],
        ['name' => 'ping', 'arguments' => '{}', 'id' => 'c2'],
    ]);
    $client->respondWithStream(['done']);

    $now = 0.0;
    $emitter = new RecordingStreamEmitter;
    // maxCalls=0: callsThisTurn(0) >= maxCalls(0) fires for every tool call → budget-exhausted
    $streamer = new TurnStreamer($client, $emitter, null, new Clock(fn () => $now));

    $result = $streamer->run(
        messages: [['role' => 'user', 'content' => 'ping']],
        toolDefs: [['type' => 'function', 'function' => ['name' => 'ping']]],
        maxCalls: 0,
        streamDuration: 60,
        startedAt: 0.0,
        isAborted: fn () => false,
        model: null,
        channel: 'default',
        conversationId: 1,
        actor: null,
        allowedTools: null,
    );

    expect($result->outcome)->toBe(TurnOutcome::Completed);
    expect($result->assembled)->toBe('done');

    // Second round must have received the budget-exhausted tool messages
    $secondRound = $client->recordedPrompts()[1] ?? [];
    $budgetMessages = array_filter($secondRound, fn ($m) => ($m['role'] ?? '') === 'tool'
        && str_contains((string) ($m['content'] ?? ''), 'budget exhausted'));
    expect(count($budgetMessages))->toBe(2);

    // toolDefs must have been zeroed for the second (prose) round
    expect($client->lastSentTools())->toBe([]);
});

// ──────────────────────────────────────────────────────────────────────────────
// Slice 6 – tool-time exclusion (ADR-0006)
// ──────────────────────────────────────────────────────────────────────────────

it('excludes tool handler time from the stream budget so a slow tool still completes', function (): void {
    SlowTool::reset();

    $now = 0.0;
    $clock = new Clock(function () use (&$now): float {
        return $now;
    });

    // SlowTool advances the shared clock by 100s, far past the 10s budget
    SlowTool::$onHandle = function () use (&$now): void {
        $now += 100.0;
    };

    $slowTool = new SlowTool;

    $resolver = new class($slowTool) implements ToolResolver
    {
        public function __construct(private ChatbotTool $tool) {}

        public function resolve(string $name): ?ChatbotTool
        {
            return $this->tool;
        }

        /** @return list<array<string, mixed>> */
        public function definitions(?array $allowedTools): array
        {
            return [['type' => 'function', 'function' => ['name' => 'slow_op', 'description' => 'slow', 'parameters' => ['type' => 'object', 'properties' => []]]]];
        }
    };

    $client = new FakeClient;
    $client->respondWithToolCall('slow_op', [], 'call_slow');
    $client->respondWithStream(['Done.']);

    $emitter = new RecordingStreamEmitter;
    $invoker = new ToolInvoker(
        resolver: $resolver,
        invocationStore: null,
        emitter: $emitter,
        defaultTimeout: 999,
        resultSizeCap: 4096,
        maxArgLength: 10240,
        clock: $clock,
    );

    $streamer = new TurnStreamer($client, $emitter, $invoker, $clock);

    $result = $streamer->run(
        messages: [['role' => 'user', 'content' => 'do it']],
        toolDefs: $resolver->definitions(null),
        maxCalls: 5,
        streamDuration: 10,   // 10s budget
        startedAt: 0.0,
        isAborted: fn () => false,
        model: null,
        channel: 'default',
        conversationId: 1,
        actor: null,
        allowedTools: null,
    );

    // slow tool advanced clock by 100s but that time is excluded → no timeout
    expect($result->outcome)->toBe(TurnOutcome::Completed);
    expect($result->assembled)->toBe('Done.');
});

// ──────────────────────────────────────────────────────────────────────────────
// Slice 7 – null ToolInvoker: '[error: no tool handler configured]'
// ──────────────────────────────────────────────────────────────────────────────

it('feeds back [error: no tool handler configured] when toolInvoker is null', function (): void {
    $client = new FakeClient;
    $client->respondWithToolCall('ping', [], 'c1');
    $client->respondWithStream(['ok']);

    $now = 0.0;
    $emitter = new RecordingStreamEmitter;
    $streamer = new TurnStreamer($client, $emitter, null, new Clock(fn () => $now));

    $result = $streamer->run(
        messages: [['role' => 'user', 'content' => 'ping']],
        toolDefs: [['type' => 'function', 'function' => ['name' => 'ping']]],
        maxCalls: 5,
        streamDuration: 60,
        startedAt: 0.0,
        isAborted: fn () => false,
        model: null,
        channel: 'default',
        conversationId: 1,
        actor: null,
        allowedTools: null,
    );

    expect($result->outcome)->toBe(TurnOutcome::Completed);

    $secondRound = $client->recordedPrompts()[1] ?? [];
    $noHandlerMessages = array_filter($secondRound, fn ($m) => ($m['role'] ?? '') === 'tool'
        && str_contains((string) ($m['content'] ?? ''), 'no tool handler configured'));
    expect(count($noHandlerMessages))->toBe(1);
});

// ──────────────────────────────────────────────────────────────────────────────
// Slice 8 – assistant message shape when tool calls present
// ──────────────────────────────────────────────────────────────────────────────

it('assembles assistant message with correct tool_calls shape and null content when no text', function (): void {
    $client = new FakeClient;
    $client->respondWithToolCall('my_tool', ['x' => 1], 'call_abc');
    $client->respondWithStream(['ok']);

    $now = 0.0;
    $emitter = new RecordingStreamEmitter;
    $streamer = new TurnStreamer($client, $emitter, null, new Clock(fn () => $now));

    $streamer->run(
        messages: [['role' => 'user', 'content' => 'go']],
        toolDefs: [['type' => 'function', 'function' => ['name' => 'my_tool']]],
        maxCalls: 5,
        streamDuration: 60,
        startedAt: 0.0,
        isAborted: fn () => false,
        model: null,
        channel: 'default',
        conversationId: 1,
        actor: null,
        allowedTools: null,
    );

    $secondRound = $client->recordedPrompts()[1] ?? [];
    $assistantMsg = array_values(array_filter($secondRound, fn ($m) => ($m['role'] ?? '') === 'assistant'))[0] ?? null;

    expect($assistantMsg)->not->toBeNull();
    expect($assistantMsg['content'])->toBeNull();
    expect($assistantMsg['tool_calls'])->toHaveCount(1);
    expect($assistantMsg['tool_calls'][0]['id'])->toBe('call_abc');
    expect($assistantMsg['tool_calls'][0]['type'])->toBe('function');
    expect($assistantMsg['tool_calls'][0]['function']['name'])->toBe('my_tool');
});

it('assembles assistant message with text content when LLM emits text before tool calls', function (): void {
    $client = new FakeClient;
    $client->respondWithToolCallAndText('my_tool', [], 'call_xyz', 'thinking...');
    $client->respondWithStream(['done']);

    $now = 0.0;
    $emitter = new RecordingStreamEmitter;
    $streamer = new TurnStreamer($client, $emitter, null, new Clock(fn () => $now));

    $streamer->run(
        messages: [['role' => 'user', 'content' => 'go']],
        toolDefs: [['type' => 'function', 'function' => ['name' => 'my_tool']]],
        maxCalls: 5,
        streamDuration: 60,
        startedAt: 0.0,
        isAborted: fn () => false,
        model: null,
        channel: 'default',
        conversationId: 1,
        actor: null,
        allowedTools: null,
    );

    $secondRound = $client->recordedPrompts()[1] ?? [];
    $assistantMsg = array_values(array_filter($secondRound, fn ($m) => ($m['role'] ?? '') === 'assistant'))[0] ?? null;

    expect($assistantMsg)->not->toBeNull();
    expect($assistantMsg['content'])->toBe('thinking...');
});
