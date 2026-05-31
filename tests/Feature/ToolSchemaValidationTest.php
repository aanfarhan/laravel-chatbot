<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Contracts\ToolInvocationStore;
use Aanfarhan\Chatbot\Facades\Chatbot;
use Aanfarhan\Chatbot\Persistence\MessageRecord;
use Aanfarhan\Chatbot\Streaming\StreamCoordinator;
use Aanfarhan\Chatbot\Tests\Stubs\SpyLookupTool;
use Aanfarhan\Chatbot\Tools\ToolInvoker;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeSchemaMessageRecord(): MessageRecord
{
    return new MessageRecord(
        id: 1,
        conversationId: 1,
        role: 'assistant',
        content: '',
        routeName: 'test',
        contextHash: 'abc',
        inputTokens: 0,
        outputTokens: 0,
        costCents: 0,
        error: null,
        createdAt: now(),
    );
}

function schemaSseEventsFrom(string $raw): array
{
    $events = [];
    $current = [];
    foreach (explode("\n", $raw) as $line) {
        if ($line === '') {
            if ($current !== []) {
                $events[] = $current;
                $current = [];
            }

            continue;
        }
        if (str_starts_with($line, 'event:')) {
            $current['event'] = trim(substr($line, 6));
        } elseif (str_starts_with($line, 'data:')) {
            $current['data'] = json_decode(trim(substr($line, 5)), true) ?? [];
        }
    }

    return $events;
}

beforeEach(function (): void {
    config()->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
    Chatbot::clearTools();
    SpyLookupTool::reset();
});

it('short-circuits authorize and handle, feeds back synthetic schema-rejection message, and emits tool_failed', function (): void {
    Chatbot::registerTool(SpyLookupTool::class);

    $fake = Chatbot::fake();
    // order_id should be integer; LLM sends a string
    $fake->respondWithToolCall('spy_lookup', ['order_id' => 'not-an-int'], 'call_bad');
    $fake->respondWithStream(['Sorry, my bad.']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->andReturn(makeSchemaMessageRecord());

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolInvoker: app(ToolInvoker::class),
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'look up']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
    )->sendContent();
    $output = (string) ob_get_clean();

    $events = schemaSseEventsFrom($output);

    expect(SpyLookupTool::$authorizeCalls)->toBe(0);
    expect(SpyLookupTool::$handleCalls)->toBe(0);

    $failed = array_values(array_filter($events, fn ($e) => ($e['event'] ?? '') === 'tool_failed'));
    expect($failed)->toHaveCount(1);
    expect($failed[0]['data'])->toBe(['name' => 'spy_lookup', 'phase' => 'failed']);

    $fake->assertSentPrompt(function (array $messages): bool {
        foreach ($messages as $msg) {
            if (($msg['role'] ?? '') === 'tool' && ($msg['content'] ?? '') === 'arguments did not match schema') {
                return true;
            }
        }

        return false;
    });
});

it('persists a rejected_schema row with the raw args and an empty result', function (): void {
    Chatbot::registerTool(SpyLookupTool::class);

    $fake = Chatbot::fake();
    $fake->respondWithToolCall('spy_lookup', ['order_id' => 'nope'], 'call_bad2');
    $fake->respondWithStream(['ack']);

    $store = app(ConversationStore::class);
    $invocationStore = app(ToolInvocationStore::class);
    $conversation = $store->start('default', null, null);

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolInvoker: app(ToolInvoker::class),
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'go']],
        conversationId: $conversation->id,
        routeName: 'test',
        contextHash: 'abc',
    )->sendContent();
    ob_end_clean();

    $records = $invocationStore->freshFor($conversation->id, 300);
    expect($records)->toHaveCount(1);
    expect($records[0]->toolName)->toBe('spy_lookup');
    expect($records[0]->status)->toBe('rejected_schema');
    expect($records[0]->arguments)->toBe(['order_id' => 'nope']);
    expect($records[0]->result)->toBe('');
});

it('rejections count against max_calls_per_turn and trigger the budget-exhausted message', function (): void {
    Chatbot::registerTool(SpyLookupTool::class);
    config()->set('chatbot.tools.max_calls_per_turn', 2);

    $fake = Chatbot::fake();
    $fake->respondWithToolCalls([
        ['name' => 'spy_lookup', 'arguments' => ['order_id' => 'a'], 'id' => 'c1'],
        ['name' => 'spy_lookup', 'arguments' => ['order_id' => 'b'], 'id' => 'c2'],
        ['name' => 'spy_lookup', 'arguments' => ['order_id' => 'c'], 'id' => 'c3'],
    ]);
    $fake->respondWithStream(['giving up']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->andReturn(makeSchemaMessageRecord());

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolInvoker: app(ToolInvoker::class),
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'loop']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
    )->sendContent();
    ob_end_clean();

    $fake->assertSentPrompt(function (array $messages): bool {
        foreach ($messages as $msg) {
            if (($msg['role'] ?? '') === 'tool' && str_contains((string) ($msg['content'] ?? ''), 'budget exhausted')) {
                return true;
            }
        }

        return false;
    });

    // None of the three calls should have reached authorize/handle — all schema-rejected (within budget) or budget-skipped.
    expect(SpyLookupTool::$authorizeCalls)->toBe(0);
    expect(SpyLookupTool::$handleCalls)->toBe(0);
});
