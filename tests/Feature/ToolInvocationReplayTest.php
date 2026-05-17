<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Contracts\ToolInvocationStore;
use Aanfarhan\Chatbot\Facades\Chatbot;
use Aanfarhan\Chatbot\Streaming\StreamCoordinator;
use Aanfarhan\Chatbot\Tests\Stubs\LookupOrderTool;
use Aanfarhan\Chatbot\Tools\ToolArgumentValidator;
use Aanfarhan\Chatbot\Tools\ToolInvocationReplay;
use Aanfarhan\Chatbot\Tools\ToolRegistry;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    config()->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
    Chatbot::clearTools();
});

function makeReplay(): ToolInvocationReplay
{
    return new ToolInvocationReplay(
        store: app(ToolInvocationStore::class),
        registry: app(ToolRegistry::class),
        validator: new ToolArgumentValidator(10240),
    );
}

// --- Tracer bullet: a single in-window record valid under the current schema replays as one assistant + one tool message ---

it('replays a valid stored invocation as an assistant tool_call plus matching tool result', function (): void {
    Chatbot::registerTool(LookupOrderTool::class);

    $store = app(ConversationStore::class);
    $invocationStore = app(ToolInvocationStore::class);
    $conversation = $store->start('default', null, null);

    $invocationStore->record(
        conversationId: $conversation->id,
        messageId: null,
        toolName: 'lookup_order',
        arguments: ['order_id' => 7],
        result: json_encode(['status' => 'confirmed', 'order_id' => 7], JSON_THROW_ON_ERROR),
        status: 'ok',
        error: null,
        startedAt: now()->subSeconds(60),
        finishedAt: now()->subSeconds(60),
    );

    $messages = makeReplay()->buildHistory($conversation->id, 300);

    expect($messages)->toHaveCount(2);
    expect($messages[0]['role'])->toBe('assistant');
    expect($messages[0]['tool_calls'][0]['function']['name'])->toBe('lookup_order');
    expect($messages[0]['tool_calls'][0]['function']['arguments'])->toBe(json_encode(['order_id' => 7]));
    expect($messages[1]['role'])->toBe('tool');
    expect($messages[1]['name'])->toBe('lookup_order');
    expect($messages[1]['tool_call_id'])->toBe($messages[0]['tool_calls'][0]['id']);
});

// --- Schema change: stored args no longer valid under the current schema → dropped silently ---

it('drops a stored invocation whose args no longer validate against the current schema', function (): void {
    Chatbot::registerTool(LookupOrderTool::class);

    $store = app(ConversationStore::class);
    $invocationStore = app(ToolInvocationStore::class);
    $conversation = $store->start('default', null, null);

    // Stored arg was previously valid but the tool's current schema requires order_id (integer).
    // Here we simulate a schema-change: stored arg uses the old field name 'order' which no longer exists.
    $invocationStore->record(
        conversationId: $conversation->id,
        messageId: null,
        toolName: 'lookup_order',
        arguments: ['order' => 7],
        result: json_encode(['status' => 'confirmed', 'order_id' => 7], JSON_THROW_ON_ERROR),
        status: 'ok',
        error: null,
        startedAt: now()->subSeconds(60),
        finishedAt: now()->subSeconds(60),
    );

    $messages = makeReplay()->buildHistory($conversation->id, 300);

    expect($messages)->toBe([]);
});

// --- Dropped record stays in storage for audit ---

it('retains the dropped invocation in the database (audit trail)', function (): void {
    Chatbot::registerTool(LookupOrderTool::class);

    $store = app(ConversationStore::class);
    $invocationStore = app(ToolInvocationStore::class);
    $conversation = $store->start('default', null, null);

    $invocationStore->record(
        conversationId: $conversation->id,
        messageId: null,
        toolName: 'lookup_order',
        arguments: ['order' => 7],
        result: '{}',
        status: 'ok',
        error: null,
        startedAt: now()->subSeconds(60),
        finishedAt: now()->subSeconds(60),
    );

    makeReplay()->buildHistory($conversation->id, 300);

    $count = DB::table('chatbot_tool_invocations')->where('conversation_id', $conversation->id)->count();
    expect($count)->toBe(1);
});

// --- Mix: valid records pass through, invalid records are silently filtered ---

it('replays only the records whose args validate, dropping the rest', function (): void {
    Chatbot::registerTool(LookupOrderTool::class);

    $store = app(ConversationStore::class);
    $invocationStore = app(ToolInvocationStore::class);
    $conversation = $store->start('default', null, null);

    $invocationStore->record(
        conversationId: $conversation->id,
        messageId: null,
        toolName: 'lookup_order',
        arguments: ['order' => 1], // stale shape
        result: '{}',
        status: 'ok',
        error: null,
        startedAt: now()->subSeconds(120),
        finishedAt: now()->subSeconds(120),
    );

    $invocationStore->record(
        conversationId: $conversation->id,
        messageId: null,
        toolName: 'lookup_order',
        arguments: ['order_id' => 2], // current shape
        result: json_encode(['status' => 'confirmed', 'order_id' => 2], JSON_THROW_ON_ERROR),
        status: 'ok',
        error: null,
        startedAt: now()->subSeconds(60),
        finishedAt: now()->subSeconds(60),
    );

    $messages = makeReplay()->buildHistory($conversation->id, 300);

    expect($messages)->toHaveCount(2);
    expect($messages[0]['tool_calls'][0]['function']['arguments'])->toBe(json_encode(['order_id' => 2]));
});

// --- Tool removed from registry between turns → record cannot be validated, drop silently ---

it('drops a stored invocation whose tool is no longer registered', function (): void {
    // Note: lookup_order is NOT registered for this test.
    $store = app(ConversationStore::class);
    $invocationStore = app(ToolInvocationStore::class);
    $conversation = $store->start('default', null, null);

    $invocationStore->record(
        conversationId: $conversation->id,
        messageId: null,
        toolName: 'lookup_order',
        arguments: ['order_id' => 7],
        result: '{}',
        status: 'ok',
        error: null,
        startedAt: now()->subSeconds(60),
        finishedAt: now()->subSeconds(60),
    );

    $messages = makeReplay()->buildHistory($conversation->id, 300);

    expect($messages)->toBe([]);
});

// --- Filter purity: replay does not emit SSE, increment any counter, or call the registry's resolve as if invoking ---

it('produces only a messages array (no SSE, no budget side-effects)', function (): void {
    Chatbot::registerTool(LookupOrderTool::class);

    $store = app(ConversationStore::class);
    $invocationStore = app(ToolInvocationStore::class);
    $conversation = $store->start('default', null, null);

    $invocationStore->record(
        conversationId: $conversation->id,
        messageId: null,
        toolName: 'lookup_order',
        arguments: ['order' => 7], // invalid → drop
        result: '{}',
        status: 'ok',
        error: null,
        startedAt: now()->subSeconds(60),
        finishedAt: now()->subSeconds(60),
    );

    ob_start();
    $messages = makeReplay()->buildHistory($conversation->id, 300);
    $sideEffects = ob_get_clean();

    expect($sideEffects)->toBe(''); // no SSE/output
    expect($messages)->toBe([]);    // no synthetic rejection message produced

    // Also: no new invocation record was written by the replay (no rejected_schema row added).
    $count = DB::table('chatbot_tool_invocations')->where('conversation_id', $conversation->id)->count();
    expect($count)->toBe(1); // only the original seed record
});

// --- Integration: schema-change mid-conversation; replay drops stale records, model re-calls under new schema without hitting the budget cap ---

it('after a schema change, replay drops stale records and the model re-calls the tool successfully without hitting the budget cap', function (): void {
    Chatbot::registerTool(LookupOrderTool::class);

    $store = app(ConversationStore::class);
    $invocationStore = app(ToolInvocationStore::class);
    $conversation = $store->start('default', null, null);

    // Seed many stale records whose args do not validate under the current schema.
    // If these were ever fed back as fresh tool calls, they would each be rejected and
    // consume budget — exhausting max_calls_per_turn (default 5) before the model's
    // fresh call is processed. The replay filter must drop them silently.
    for ($i = 0; $i < 8; $i++) {
        $invocationStore->record(
            conversationId: $conversation->id,
            messageId: null,
            toolName: 'lookup_order',
            arguments: ['order' => $i], // stale field name; invalid under current schema
            result: '{}',
            status: 'ok',
            error: null,
            startedAt: now()->subSeconds(120),
            finishedAt: now()->subSeconds(120),
        );
    }

    $replayMessages = makeReplay()->buildHistory($conversation->id, 300);
    expect($replayMessages)->toBe([]); // all stale records were silently dropped

    // Turn 2: model calls lookup_order under the new schema, then responds.
    $fake = Chatbot::fake();
    $fake->respondWithToolCall('lookup_order', ['order_id' => 42], 'call_fresh');
    $fake->respondWithStream(['Order 42 confirmed.']);

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolRegistry: app(ToolRegistry::class),
        toolInvocationStore: $invocationStore,
    );

    ob_start();
    $coordinator->handle(
        messages: array_merge(
            [['role' => 'system', 'content' => 'You are helpful.']],
            $replayMessages,
            [['role' => 'user', 'content' => 'What is order 42?']],
        ),
        conversationId: $conversation->id,
        routeName: 'test',
        contextHash: 'abc',
        channel: 'default',
    )->sendContent();
    ob_end_clean();

    // Model called the tool successfully under the new schema.
    $fake->assertToolCalled('lookup_order', fn (array $args) => $args['order_id'] === 42);

    // Exactly one new ok record was written (the fresh call); the 8 stale rows are still there,
    // and no rejected_schema rows were added by the replay path.
    $total = DB::table('chatbot_tool_invocations')->where('conversation_id', $conversation->id)->count();
    expect($total)->toBe(9);

    $rejected = DB::table('chatbot_tool_invocations')
        ->where('conversation_id', $conversation->id)
        ->where('status', 'rejected_schema')
        ->count();
    expect($rejected)->toBe(0);
});
