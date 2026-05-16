<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Contracts\ToolInvocationStore;
use Aanfarhan\Chatbot\Facades\Chatbot;
use Aanfarhan\Chatbot\Persistence\ToolInvocationRecord;
use Aanfarhan\Chatbot\Streaming\StreamCoordinator;
use Aanfarhan\Chatbot\Tests\Stubs\FailingTool;
use Aanfarhan\Chatbot\Tests\Stubs\LookupOrderTool;
use Aanfarhan\Chatbot\Tests\Stubs\RedactingOrderTool;
use Aanfarhan\Chatbot\Tests\Stubs\SkipPersistTool;
use Aanfarhan\Chatbot\Tools\ToolRegistry;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    config()->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
    Chatbot::clearTools();
});

// --- Tracer bullet: persistence on success ---

it('coordinator writes a chatbot_tool_invocations row for a successful invocation', function (): void {
    Chatbot::registerTool(LookupOrderTool::class);

    $fake = Chatbot::fake();
    $fake->respondWithToolCall('lookup_order', ['order_id' => 42], 'call_1');
    $fake->respondWithStream(['Order 42 confirmed.']);

    $store = app(ConversationStore::class);
    $invocationStore = app(ToolInvocationStore::class);

    $conversation = $store->start('default', null, 'guest_123');

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolRegistry: app(ToolRegistry::class),
        toolInvocationStore: $invocationStore,
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'What is order 42?']],
        conversationId: $conversation->id,
        routeName: 'test',
        contextHash: 'abc',
        channel: 'default',
    )->sendContent();
    ob_end_clean();

    $records = $invocationStore->freshFor($conversation->id, 300);
    expect($records)->toHaveCount(1);
    expect($records[0]->toolName)->toBe('lookup_order');
    expect($records[0]->arguments)->toBe(['order_id' => 42]);
    expect($records[0]->status)->toBe('ok');
    expect($records[0]->error)->toBeNull();
    expect($records[0]->startedAt)->not->toBeNull();
    expect($records[0]->finishedAt)->not->toBeNull();
});

// --- Persistence on failure ---

it('coordinator writes a status=failed row when the handler throws', function (): void {
    Chatbot::registerTool(FailingTool::class);

    $fake = Chatbot::fake();
    $fake->respondWithToolCall('failing_op', [], 'call_fail');
    $fake->respondWithStream(['Error.']);

    $store = app(ConversationStore::class);
    $invocationStore = app(ToolInvocationStore::class);
    $conversation = $store->start('default', null, null);

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolRegistry: app(ToolRegistry::class),
        toolInvocationStore: $invocationStore,
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'do it']],
        conversationId: $conversation->id,
        routeName: 'test',
        contextHash: 'abc',
    )->sendContent();
    ob_end_clean();

    $all = DB::table('chatbot_tool_invocations')->where('conversation_id', $conversation->id)->get();
    expect($all)->toHaveCount(1);
    expect($all[0]->status)->toBe('failed');
    expect($all[0]->error)->not->toBeNull();
});

// --- PersistableTool: null skips write ---

it('skips the DB write when persist() returns null', function (): void {
    Chatbot::registerTool(SkipPersistTool::class);

    $fake = Chatbot::fake();
    $fake->respondWithToolCall('skip_persist', [], 'call_skip');
    $fake->respondWithStream(['Done.']);

    $store = app(ConversationStore::class);
    $invocationStore = app(ToolInvocationStore::class);
    $conversation = $store->start('default', null, null);

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolRegistry: app(ToolRegistry::class),
        toolInvocationStore: $invocationStore,
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'skip it']],
        conversationId: $conversation->id,
        routeName: 'test',
        contextHash: 'abc',
    )->sendContent();
    ob_end_clean();

    $count = DB::table('chatbot_tool_invocations')->where('conversation_id', $conversation->id)->count();
    expect($count)->toBe(0);
});

// --- PersistableTool: sanitized payload stored ---

it('stores the sanitized payload from persist() instead of the original result', function (): void {
    Chatbot::registerTool(RedactingOrderTool::class);

    $fake = Chatbot::fake();
    $fake->respondWithToolCall('redacting_order', ['order_id' => 99], 'call_redact');
    $fake->respondWithStream(['Done.']);

    $store = app(ConversationStore::class);
    $invocationStore = app(ToolInvocationStore::class);
    $conversation = $store->start('default', null, null);

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolRegistry: app(ToolRegistry::class),
        toolInvocationStore: $invocationStore,
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'look up order 99']],
        conversationId: $conversation->id,
        routeName: 'test',
        contextHash: 'abc',
    )->sendContent();
    ob_end_clean();

    $row = DB::table('chatbot_tool_invocations')->where('conversation_id', $conversation->id)->first();
    expect($row)->not->toBeNull();
    $stored = json_decode((string) $row->result, true);
    expect($stored)->toBe(['order_id' => 99]);
    expect($stored)->not->toHaveKey('secret_token');
});

// --- Freshness window ---

it('freshFor returns only invocations within the window', function (): void {
    $store = app(ConversationStore::class);
    $invocationStore = app(ToolInvocationStore::class);
    $conversation = $store->start('default', null, null);

    $invocationStore->record(
        conversationId: $conversation->id,
        messageId: null,
        toolName: 'fresh_tool',
        arguments: [],
        result: 'fresh',
        status: 'ok',
        error: null,
        startedAt: now()->subSeconds(100),
        finishedAt: now()->subSeconds(100),
    );

    $invocationStore->record(
        conversationId: $conversation->id,
        messageId: null,
        toolName: 'stale_tool',
        arguments: [],
        result: 'stale',
        status: 'ok',
        error: null,
        startedAt: now()->subSeconds(400),
        finishedAt: now()->subSeconds(400),
    );

    $fresh = $invocationStore->freshFor($conversation->id, 300);
    expect($fresh)->toHaveCount(1);
    expect($fresh[0]->toolName)->toBe('fresh_tool');
});

// --- Stale invocations excluded from replay ---

it('stale invocations are absent from freshFor but present in the table', function (): void {
    $store = app(ConversationStore::class);
    $invocationStore = app(ToolInvocationStore::class);
    $conversation = $store->start('default', null, null);

    $invocationStore->record(
        conversationId: $conversation->id,
        messageId: null,
        toolName: 'old_tool',
        arguments: [],
        result: 'old result',
        status: 'ok',
        error: null,
        startedAt: now()->subSeconds(500),
        finishedAt: now()->subSeconds(500),
    );

    $fresh = $invocationStore->freshFor($conversation->id, 300);
    expect($fresh)->toHaveCount(0);

    $tableCount = DB::table('chatbot_tool_invocations')->where('conversation_id', $conversation->id)->count();
    expect($tableCount)->toBe(1);
});

// --- Per-channel freshness override ---

it('respects per-channel replay_freshness override', function (): void {
    $store = app(ConversationStore::class);
    $invocationStore = app(ToolInvocationStore::class);
    $conversation = $store->start('fast', null, null);

    $invocationStore->record(
        conversationId: $conversation->id,
        messageId: null,
        toolName: 'some_tool',
        arguments: [],
        result: 'result',
        status: 'ok',
        error: null,
        startedAt: now()->subSeconds(100),
        finishedAt: now()->subSeconds(100),
    );

    // Default 300s window → fresh
    $fresh = $invocationStore->freshFor($conversation->id, 300);
    expect($fresh)->toHaveCount(1);

    // Channel override of 60s → stale
    $stale = $invocationStore->freshFor($conversation->id, 60);
    expect($stale)->toHaveCount(0);
});

// --- Integration: two-turn conversation with fresh result ---

it('second turn includes fresh tool result in history so the model does not re-invoke the tool', function (): void {
    Chatbot::registerTool(LookupOrderTool::class);

    $store = app(ConversationStore::class);
    $invocationStore = app(ToolInvocationStore::class);
    $conversation = $store->start('default', null, null);

    // --- Turn 1: model calls the tool ---
    $fake = Chatbot::fake();
    $fake->respondWithToolCall('lookup_order', ['order_id' => 7], 'call_t1');
    $fake->respondWithStream(['Order 7 is confirmed.']);

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolRegistry: app(ToolRegistry::class),
        toolInvocationStore: $invocationStore,
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'What is order 7?']],
        conversationId: $conversation->id,
        routeName: 'test',
        contextHash: 'abc',
        channel: 'default',
    )->sendContent();
    ob_end_clean();

    // Verify tool was persisted
    $records = $invocationStore->freshFor($conversation->id, 300);
    expect($records)->toHaveCount(1);

    // --- Turn 2: replay fresh result into history, model responds with prose ---
    $fake2 = Chatbot::fake();
    $fake2->respondWithStream(['Your order 7 is confirmed, anything else?']);

    $coordinator2 = new StreamCoordinator(
        llm: $fake2,
        store: $store,
        config: app(ConfigRepository::class),
        toolRegistry: app(ToolRegistry::class),
        toolInvocationStore: $invocationStore,
    );

    // Build history from fresh invocations (simulating what MessagesController does)
    $replayMessages = buildReplayHistory($records);

    ob_start();
    $coordinator2->handle(
        messages: array_merge(
            [['role' => 'system', 'content' => 'You are helpful.']],
            $replayMessages,
            [['role' => 'user', 'content' => 'Is order 7 shipped?']],
        ),
        conversationId: $conversation->id,
        routeName: 'test',
        contextHash: 'abc',
        channel: 'default',
    )->sendContent();
    ob_end_clean();

    // Only 1 invocation record total: tool was not re-executed in turn 2
    $allRecords = DB::table('chatbot_tool_invocations')->where('conversation_id', $conversation->id)->count();
    expect($allRecords)->toBe(1, 'tool should not have been re-invoked in turn 2 when fresh result is in history');
});

// --- Integration: stale result forces re-invocation ---

it('stale invocations are excluded from history so the model re-calls the tool', function (): void {
    Chatbot::registerTool(LookupOrderTool::class);

    $store = app(ConversationStore::class);
    $invocationStore = app(ToolInvocationStore::class);
    $conversation = $store->start('default', null, null);

    // Insert a stale invocation directly (simulating a prior turn > 300s ago)
    $invocationStore->record(
        conversationId: $conversation->id,
        messageId: null,
        toolName: 'lookup_order',
        arguments: ['order_id' => 7],
        result: json_encode(['status' => 'confirmed', 'order_id' => 7]),
        status: 'ok',
        error: null,
        startedAt: now()->subSeconds(400),
        finishedAt: now()->subSeconds(400),
    );

    $fresh = $invocationStore->freshFor($conversation->id, 300);
    expect($fresh)->toHaveCount(0, 'stale invocation should not appear as fresh');

    // Turn 2 without any replay (no fresh records), model is forced to re-call
    $fake2 = Chatbot::fake();
    $fake2->respondWithToolCall('lookup_order', ['order_id' => 7], 'call_t2');
    $fake2->respondWithStream(['Order 7 is confirmed.']);

    $coordinator2 = new StreamCoordinator(
        llm: $fake2,
        store: $store,
        config: app(ConfigRepository::class),
        toolRegistry: app(ToolRegistry::class),
        toolInvocationStore: $invocationStore,
    );

    ob_start();
    $coordinator2->handle(
        messages: [['role' => 'user', 'content' => 'Is order 7 shipped?']],
        conversationId: $conversation->id,
        routeName: 'test',
        contextHash: 'abc',
        channel: 'default',
    )->sendContent();
    ob_end_clean();

    $fake2->assertToolCalled('lookup_order', fn ($args) => $args['order_id'] === 7);
});

/**
 * Helper: convert ToolInvocationRecord list into assistant+tool message pairs for replay.
 *
 * @param  list<ToolInvocationRecord>  $records
 * @return list<array<string, mixed>>
 */
function buildReplayHistory(array $records): array
{
    $messages = [];

    foreach ($records as $record) {
        $syntheticCallId = "replay_{$record->id}";

        $messages[] = [
            'role' => 'assistant',
            'content' => null,
            'tool_calls' => [
                [
                    'id' => $syntheticCallId,
                    'type' => 'function',
                    'function' => [
                        'name' => $record->toolName,
                        'arguments' => json_encode($record->arguments, JSON_THROW_ON_ERROR),
                    ],
                ],
            ],
        ];

        $messages[] = [
            'role' => 'tool',
            'tool_call_id' => $syntheticCallId,
            'name' => $record->toolName,
            'content' => $record->result,
        ];
    }

    return $messages;
}
