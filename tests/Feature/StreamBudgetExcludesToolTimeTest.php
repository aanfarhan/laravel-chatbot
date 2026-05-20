<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Facades\Chatbot;
use Aanfarhan\Chatbot\Persistence\MessageRecord;
use Aanfarhan\Chatbot\Streaming\StreamCoordinator;
use Aanfarhan\Chatbot\Tests\Stubs\SlowTool;
use Aanfarhan\Chatbot\Tools\ToolRegistry;
use Illuminate\Contracts\Config\Repository as ConfigRepository;

function streamBudgetMessageRecord(): MessageRecord
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

beforeEach(function (): void {
    config()->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
    Chatbot::clearTools();
    SlowTool::reset();
});

// --- Slice 02: tool execution time is excluded from the stream budget ---

it('excludes tool execution time from the stream budget so a slow tool still yields an answer', function (): void {
    Chatbot::registerTool(SlowTool::class);

    // Test-controlled monotonic clock. The slow tool advances it by 100s — far past
    // the 10s stream budget — yet the budget must not trip on that excluded time.
    $now = 1000.0;
    $clock = function () use (&$now): float {
        return $now;
    };
    SlowTool::$onHandle = function () use (&$now): void {
        $now += 100.0;
    };

    config()->set('chatbot.stream_duration', 10);

    $fake = Chatbot::fake();
    $fake->respondWithToolCall('slow_op', [], 'call_slow');
    $fake->respondWithStream(['Here is your answer.']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->andReturn(streamBudgetMessageRecord());

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolRegistry: app(ToolRegistry::class),
        clock: $clock,
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'do the slow thing']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
        isAborted: fn () => false,
    )->sendContent();
    $output = (string) ob_get_clean();

    expect($output)->not->toContain('"code":"timeout"');
    expect($output)->toContain('Here is your answer.');
    expect($output)->toContain('event: done');
});

it('still cuts a runaway loop whose accumulated model-stream time exceeds the budget', function (): void {
    Chatbot::registerTool(SlowTool::class);
    // Instant tool: it consumes no clock of its own, so only model/loop time accrues.

    // Clock advances on every read, so each round of model streaming spends budget.
    $now = 0.0;
    $clock = function () use (&$now): float {
        $value = $now;
        $now += 3.0;

        return $value;
    };

    config()->set('chatbot.stream_duration', 10);

    $fake = Chatbot::fake();
    // Model keeps round-tripping with tool calls and never reaches its closing prose.
    for ($i = 0; $i < 6; $i++) {
        $fake->respondWithToolCall('slow_op', [], "call_{$i}");
    }
    $fake->respondWithStream(['All done with everything.']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->andReturn(streamBudgetMessageRecord());

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolRegistry: app(ToolRegistry::class),
        clock: $clock,
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'loop forever']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
        isAborted: fn () => false,
    )->sendContent();
    $output = (string) ob_get_clean();

    // The loop is bounded by the budget: a timeout is emitted and the model never
    // reaches its closing prose.
    expect($output)->toContain('"code":"timeout"');
    expect($output)->not->toContain('All done with everything.');
});
