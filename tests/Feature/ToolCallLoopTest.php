<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Facades\Chatbot;
use Aanfarhan\Chatbot\Persistence\MessageRecord;
use Aanfarhan\Chatbot\Streaming\StreamCoordinator;
use Aanfarhan\Chatbot\Tests\Stubs\BigResultTool;
use Aanfarhan\Chatbot\Tests\Stubs\FailingTool;
use Aanfarhan\Chatbot\Tests\Stubs\LookupOrderTool;
use Aanfarhan\Chatbot\Tests\Stubs\MultibyteResultTool;
use Aanfarhan\Chatbot\Tests\Stubs\UnauthorizedTool;
use Aanfarhan\Chatbot\Tools\ToolRegistry;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Pest\Expectation;

uses(RefreshDatabase::class);

function makeToolMessageRecord(): MessageRecord
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

function sseEventsFromOutput(string $raw): array
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
});

// --- Tracer bullet: full end-to-end path ---

it('runs the tool-call loop: tool called, result fed back, model emits prose', function (): void {
    Chatbot::registerTool(LookupOrderTool::class);

    $fake = Chatbot::fake();
    $fake->respondWithToolCall('lookup_order', ['order_id' => 42], 'call_1');
    $fake->respondWithStream(['Order 42 is confirmed.']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->andReturn(makeToolMessageRecord());

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolRegistry: app(ToolRegistry::class),
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'What is order 42?']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
        channel: 'default',
    )->sendContent();
    $output = (string) ob_get_clean();

    $events = sseEventsFromOutput($output);

    $tokenEvents = array_filter($events, fn ($e) => ($e['event'] ?? '') === 'token');
    $text = implode('', array_map(fn ($e) => $e['data']['content'] ?? '', $tokenEvents));

    expect($text)->toBe('Order 42 is confirmed.');
    expect($events)->toContainEventType('done');

    $fake->assertToolCalled('lookup_order', fn ($args) => $args['order_id'] === 42);
});

// --- Registration ---

it('registerTool adds to the registry; duplicate name throws', function (): void {
    Chatbot::registerTool(LookupOrderTool::class);

    expect(fn () => Chatbot::registerTool(LookupOrderTool::class))
        ->toThrow(RuntimeException::class, "Tool 'lookup_order' is already registered");
});

// --- assertToolNotCalled ---

it('assertToolNotCalled passes when the tool was never invoked', function (): void {
    $fake = Chatbot::fake();
    $fake->respondWithStream(['hello']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->andReturn(makeToolMessageRecord());

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolRegistry: app(ToolRegistry::class),
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'hi']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
    )->sendContent();
    ob_end_clean();

    $fake->assertToolNotCalled('lookup_order');
});

// --- Error: authorize returns false ---

it('feeds back an error tool message when authorize returns false, stream completes normally', function (): void {
    Chatbot::registerTool(UnauthorizedTool::class);

    $fake = Chatbot::fake();
    $fake->respondWithToolCall('unauthorized_op', [], 'call_auth');
    $fake->respondWithStream(['Understood, I cannot do that.']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->andReturn(makeToolMessageRecord());

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolRegistry: app(ToolRegistry::class),
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'do the thing']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
    )->sendContent();
    $output = (string) ob_get_clean();

    $events = sseEventsFromOutput($output);
    expect($events)->toContainEventType('done');

    // The re-invoked messages must contain a tool error result
    $fake->assertSentPrompt(function (array $messages): bool {
        foreach ($messages as $msg) {
            if (($msg['role'] ?? '') === 'tool' && str_contains((string) ($msg['content'] ?? ''), 'not authorized')) {
                return true;
            }
        }

        return false;
    });
});

// --- Error: handler throws ---

it('feeds back an error tool message when the handler throws, stream completes normally', function (): void {
    Chatbot::registerTool(FailingTool::class);

    $fake = Chatbot::fake();
    $fake->respondWithToolCall('failing_op', [], 'call_fail');
    $fake->respondWithStream(['I encountered an error.']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->andReturn(makeToolMessageRecord());

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolRegistry: app(ToolRegistry::class),
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'do it']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
    )->sendContent();
    $output = (string) ob_get_clean();

    $events = sseEventsFromOutput($output);
    expect($events)->toContainEventType('done');

    $fake->assertSentPrompt(function (array $messages): bool {
        foreach ($messages as $msg) {
            if (($msg['role'] ?? '') === 'tool' && str_contains((string) ($msg['content'] ?? ''), 'error')) {
                return true;
            }
        }

        return false;
    });
});

// --- Oversized result truncation ---

it('truncates tool results over 4096 bytes with [truncated] suffix', function (): void {
    Chatbot::registerTool(BigResultTool::class);

    $fake = Chatbot::fake();
    $fake->respondWithToolCall('big_result', [], 'call_big');
    $fake->respondWithStream(['Got it.']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->andReturn(makeToolMessageRecord());

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolRegistry: app(ToolRegistry::class),
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'get big data']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
    )->sendContent();
    ob_end_clean();

    $matched = false;
    foreach ($fake->recordedPrompts() as $messages) {
        foreach ($messages as $msg) {
            if (($msg['role'] ?? '') === 'tool' && str_ends_with((string) ($msg['content'] ?? ''), '[truncated]')) {
                $matched = true;
                break 2;
            }
        }
    }

    expect($matched)->toBeTrue('expected a truncated tool result in recorded prompts');
});

function recordedToolContent(string $name, object $fake): ?string
{
    foreach ($fake->recordedPrompts() as $messages) {
        foreach ($messages as $msg) {
            if (($msg['role'] ?? '') === 'tool' && ($msg['name'] ?? '') === $name) {
                return (string) ($msg['content'] ?? '');
            }
        }
    }

    return null;
}

it('keeps a truncated tool result within the configured result_size_cap', function (): void {
    config()->set('chatbot.tools.result_size_cap', 100);
    Chatbot::registerTool(BigResultTool::class);

    $fake = Chatbot::fake();
    $fake->respondWithToolCall('big_result', [], 'call_big');
    $fake->respondWithStream(['Got it.']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->andReturn(makeToolMessageRecord());

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolRegistry: app(ToolRegistry::class),
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'get big data']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
    )->sendContent();
    ob_end_clean();

    $content = recordedToolContent('big_result', $fake);

    expect($content)->not->toBeNull()
        ->and(strlen((string) $content))->toBeLessThanOrEqual(100);
});

it('never splits a multi-byte character when truncating a tool result', function (): void {
    config()->set('chatbot.tools.result_size_cap', 100);
    Chatbot::registerTool(MultibyteResultTool::class);

    $fake = Chatbot::fake();
    $fake->respondWithToolCall('multibyte_result', [], 'call_mb');
    $fake->respondWithStream(['Got it.']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->andReturn(makeToolMessageRecord());

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolRegistry: app(ToolRegistry::class),
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'get big data']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
    )->sendContent();
    ob_end_clean();

    $content = (string) recordedToolContent('multibyte_result', $fake);
    $body = substr($content, 0, -strlen('[truncated]'));

    expect(str_ends_with($content, '[truncated]'))->toBeTrue()
        ->and(strlen($content))->toBeLessThanOrEqual(100)
        ->and(mb_check_encoding($body, 'UTF-8'))->toBeTrue()
        ->and($body)->not->toContain("\u{FFFD}");
});

// --- Max calls cap: budget exhausted ---

it('emits a budget-exhausted tool message and allows model to produce final prose when cap is hit', function (): void {
    Chatbot::registerTool(LookupOrderTool::class);

    config()->set('chatbot.tools.max_calls_per_turn', 1);

    $fake = Chatbot::fake();
    // First response: two tool calls (exceeds cap of 1)
    $fake->respondWithToolCalls([
        ['name' => 'lookup_order', 'arguments' => ['order_id' => 1], 'id' => 'call_a'],
        ['name' => 'lookup_order', 'arguments' => ['order_id' => 2], 'id' => 'call_b'],
    ]);
    // After budget exhausted message, model produces prose
    $fake->respondWithStream(['I can only look up one order at a time.']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->andReturn(makeToolMessageRecord());

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolRegistry: app(ToolRegistry::class),
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'look up orders 1 and 2']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
    )->sendContent();
    $output = (string) ob_get_clean();

    $events = sseEventsFromOutput($output);
    expect($events)->toContainEventType('done');

    // Budget-exhausted synthetic message must appear in messages fed to LLM
    $fake->assertSentPrompt(function (array $messages): bool {
        foreach ($messages as $msg) {
            if (($msg['role'] ?? '') === 'tool' && str_contains((string) ($msg['content'] ?? ''), 'budget exhausted')) {
                return true;
            }
        }

        return false;
    });
});

// --- Tool status SSE events ---

it('emits tool_started and tool_finished events in order around a successful tool call', function (): void {
    Chatbot::registerTool(LookupOrderTool::class);

    $fake = Chatbot::fake();
    $fake->respondWithToolCall('lookup_order', ['order_id' => 1], 'call_status');
    $fake->respondWithStream(['Done.']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->andReturn(makeToolMessageRecord());

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolRegistry: app(ToolRegistry::class),
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'look up order 1']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
        channel: 'default',
    )->sendContent();
    $output = (string) ob_get_clean();

    $events = sseEventsFromOutput($output);

    $started = array_values(array_filter($events, fn ($e) => ($e['event'] ?? '') === 'tool_started'));
    $finished = array_values(array_filter($events, fn ($e) => ($e['event'] ?? '') === 'tool_finished'));

    expect($started)->toHaveCount(1);
    expect($started[0]['data'])->toBe(['name' => 'lookup_order', 'phase' => 'started']);
    expect($finished)->toHaveCount(1);
    expect($finished[0]['data'])->toBe(['name' => 'lookup_order', 'phase' => 'finished']);

    // started must precede finished in the stream
    $allEventNames = array_column($events, 'event');
    $startIdx = array_search('tool_started', $allEventNames, true);
    $finishIdx = array_search('tool_finished', $allEventNames, true);
    expect($startIdx)->toBeLessThan($finishIdx);
});

it('emits tool_started and tool_failed when the handler throws', function (): void {
    Chatbot::registerTool(FailingTool::class);

    $fake = Chatbot::fake();
    $fake->respondWithToolCall('failing_op', [], 'call_fail_status');
    $fake->respondWithStream(['Error occurred.']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->andReturn(makeToolMessageRecord());

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolRegistry: app(ToolRegistry::class),
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'do it']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
    )->sendContent();
    $output = (string) ob_get_clean();

    $events = sseEventsFromOutput($output);

    $started = array_values(array_filter($events, fn ($e) => ($e['event'] ?? '') === 'tool_started'));
    $failed = array_values(array_filter($events, fn ($e) => ($e['event'] ?? '') === 'tool_failed'));

    expect($started)->toHaveCount(1);
    expect($started[0]['data'])->toBe(['name' => 'failing_op', 'phase' => 'started']);
    expect($failed)->toHaveCount(1);
    expect($failed[0]['data'])->toBe(['name' => 'failing_op', 'phase' => 'failed']);
});

// Custom expectation helper
expect()->extend('toContainEventType', function (string $type): Expectation {
    $found = array_filter($this->value, fn ($e) => ($e['event'] ?? '') === $type);
    expect($found)->not->toBeEmpty("Expected SSE events to contain '{$type}' event.");

    return $this;
});
