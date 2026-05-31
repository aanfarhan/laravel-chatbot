<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Chatbot;
use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Envelopes\ContextEnvelope;
use Aanfarhan\Chatbot\Envelopes\Envelope;
use Aanfarhan\Chatbot\Exceptions\TamperedEnvelopeException;
use Aanfarhan\Chatbot\Facades\Chatbot as ChatbotFacade;
use Aanfarhan\Chatbot\Persistence\MessageRecord;
use Aanfarhan\Chatbot\Streaming\StreamCoordinator;
use Aanfarhan\Chatbot\Tests\Stubs\FailingTool;
use Aanfarhan\Chatbot\Tests\Stubs\LookupOrderTool;
use Aanfarhan\Chatbot\Tools\ToolInvoker;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Pest\Expectation;

uses(RefreshDatabase::class);

function makeAllowlistMessageRecord(): MessageRecord
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

function sseAllowlistEventsFromOutput(string $raw): array
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
    ChatbotFacade::clearTools();
});

// --- Slice 1: Envelope round-trip ---

it('envelope mints with allowedTools and verify surfaces them', function (): void {
    $envelope = app(ContextEnvelope::class);
    $token = $envelope->mint(
        payload: ['x' => 1],
        userId: '42',
        route: 'r',
        channel: 'default',
        expiresAt: new DateTimeImmutable('+5 minutes'),
        allowedTools: ['lookup_order', 'get_inventory'],
    );

    $verified = $envelope->verify($token);

    expect($verified)->toBeInstanceOf(Envelope::class)
        ->and($verified->allowedTools)->toBe(['lookup_order', 'get_inventory']);
});

it('envelope with no allowedTools verifies to empty list', function (): void {
    $envelope = app(ContextEnvelope::class);
    $token = $envelope->mint(
        payload: [],
        userId: null,
        route: 'r',
        channel: 'default',
        expiresAt: new DateTimeImmutable('+1 minute'),
    );

    $verified = $envelope->verify($token);

    expect($verified->allowedTools)->toBe([]);
});

// --- Slice 2: Tamper protection for allowedTools ---

it('tampering with allowedTools in envelope body fails verification', function (): void {
    $envelope = app(ContextEnvelope::class);
    $token = $envelope->mint(
        payload: [],
        userId: '1',
        route: 'r',
        channel: 'default',
        expiresAt: new DateTimeImmutable('+1 minute'),
        allowedTools: ['lookup_order'],
    );

    // Decode body, change allowedTools, re-encode — keep original signature
    [$encoded, $sig] = explode('.', $token);
    $body = json_decode(base64_decode(strtr($encoded, '-_', '+/'), true), true);
    $body['t'] = ['lookup_order', 'escalate_privileges'];
    $tamperedEncoded = rtrim(strtr(base64_encode(json_encode($body, JSON_THROW_ON_ERROR)), '+/', '-_'), '=');

    expect(fn () => $envelope->verify($tamperedEncoded.'.'.$sig))
        ->toThrow(TamperedEnvelopeException::class);
});

// --- Slice 3: Chatbot::tools() / ChannelScope::tools() ---

it('Chatbot::tools() sets the allowlist that appears in the minted envelope token', function (): void {
    ChatbotFacade::tools(['lookup_order', 'get_inventory']);

    $chatbot = app(Chatbot::class);
    expect($chatbot->resolveChannelAllowlist('default'))->toBe(['lookup_order', 'get_inventory']);
});

it('ChannelScope::tools() sets per-channel allowlist', function (): void {
    ChatbotFacade::channel('orders')->tools(['lookup_order']);
    ChatbotFacade::channel('admin')->tools(['lookup_order', 'admin_action']);

    $chatbot = app(Chatbot::class);
    expect($chatbot->resolveChannelAllowlist('orders'))->toBe(['lookup_order']);
    expect($chatbot->resolveChannelAllowlist('admin'))->toBe(['lookup_order', 'admin_action']);
});

// --- Slice 4: Registry intersection ---

it('StreamCoordinator only sends registry ∩ allowlist tool definitions to the LLM', function (): void {
    ChatbotFacade::registerTool(LookupOrderTool::class);
    ChatbotFacade::registerTool(FailingTool::class);

    $fake = ChatbotFacade::fake();
    $fake->respondWithStream(['hello']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->andReturn(makeAllowlistMessageRecord());

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolInvoker: app(ToolInvoker::class),
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'hi']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
        allowedTools: ['lookup_order'],
    )->sendContent();
    ob_end_clean();

    // Only lookup_order should have been in the tools list sent to LLM
    $sentTools = $fake->lastSentTools();
    expect($sentTools)->toHaveCount(1)
        ->and($sentTools[0]['function']['name'])->toBe('lookup_order');
});

it('StreamCoordinator sends no tools when allowlist is empty', function (): void {
    ChatbotFacade::registerTool(LookupOrderTool::class);

    $fake = ChatbotFacade::fake();
    $fake->respondWithStream(['hello']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->andReturn(makeAllowlistMessageRecord());

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolInvoker: app(ToolInvoker::class),
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'hi']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
        allowedTools: [],
    )->sendContent();
    ob_end_clean();

    expect($fake->lastSentTools())->toBe([]);
});

// --- Slice 5: Out-of-allowlist call → error message fed back ---

it('tool call for name outside verified allowlist feeds back an error message', function (): void {
    ChatbotFacade::registerTool(LookupOrderTool::class);

    $fake = ChatbotFacade::fake();
    // LLM tries to call a tool that's registered but NOT in the allowlist
    $fake->respondWithToolCall('lookup_order', ['order_id' => 1], 'call_denied');
    $fake->respondWithStream(['Sorry, I cannot do that.']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->andReturn(makeAllowlistMessageRecord());

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolInvoker: app(ToolInvoker::class),
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'do it']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
        allowedTools: [],   // empty allowlist — lookup_order is not permitted
    )->sendContent();
    $output = (string) ob_get_clean();

    $events = sseAllowlistEventsFromOutput($output);
    expect($events)->toContainAllowlistEventType('done');

    $fake->assertSentPrompt(function (array $messages): bool {
        foreach ($messages as $msg) {
            if (($msg['role'] ?? '') === 'tool'
                && str_contains((string) ($msg['content'] ?? ''), 'not permitted')) {
                return true;
            }
        }

        return false;
    });
});

// --- Slice 6: Allowed name not in registry → error message fed back ---

it('tool call for allowed name absent from registry feeds back an error message', function (): void {
    // Nothing registered — registry is empty
    $fake = ChatbotFacade::fake();
    $fake->respondWithToolCall('lookup_order', ['order_id' => 1], 'call_missing');
    $fake->respondWithStream(['I could not find the tool.']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->andReturn(makeAllowlistMessageRecord());

    $coordinator = new StreamCoordinator(
        llm: $fake,
        store: $store,
        config: app(ConfigRepository::class),
        toolInvoker: app(ToolInvoker::class),
    );

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'look up order 1']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
        allowedTools: ['lookup_order'],  // allowlisted but not registered
    )->sendContent();
    $output = (string) ob_get_clean();

    $events = sseAllowlistEventsFromOutput($output);
    expect($events)->toContainAllowlistEventType('done');

    $fake->assertSentPrompt(function (array $messages): bool {
        foreach ($messages as $msg) {
            if (($msg['role'] ?? '') === 'tool'
                && str_contains((string) ($msg['content'] ?? ''), 'not found')) {
                return true;
            }
        }

        return false;
    });
});

// --- Slice 7: Two channels with different allowlists ---

it('two channels with different allowlists see disjoint tool definitions', function (): void {
    ChatbotFacade::registerTool(LookupOrderTool::class);
    ChatbotFacade::registerTool(FailingTool::class);

    $fakeA = ChatbotFacade::fake();
    $fakeA->respondWithStream(['order channel']);

    $storeA = Mockery::mock(ConversationStore::class);
    $storeA->shouldReceive('append')->andReturn(makeAllowlistMessageRecord());

    $coordinatorA = new StreamCoordinator(
        llm: $fakeA,
        store: $storeA,
        config: app(ConfigRepository::class),
        toolInvoker: app(ToolInvoker::class),
    );

    ob_start();
    $coordinatorA->handle(
        messages: [['role' => 'user', 'content' => 'hi']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
        allowedTools: ['lookup_order'],
    )->sendContent();
    ob_end_clean();

    $fakeB = ChatbotFacade::fake();
    $fakeB->respondWithStream(['failing channel']);

    $storeB = Mockery::mock(ConversationStore::class);
    $storeB->shouldReceive('append')->andReturn(makeAllowlistMessageRecord());

    $coordinatorB = new StreamCoordinator(
        llm: $fakeB,
        store: $storeB,
        config: app(ConfigRepository::class),
        toolInvoker: app(ToolInvoker::class),
    );

    ob_start();
    $coordinatorB->handle(
        messages: [['role' => 'user', 'content' => 'hi']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
        allowedTools: ['failing_op'],
    )->sendContent();
    ob_end_clean();

    $toolsA = $fakeA->lastSentTools();
    $toolsB = $fakeB->lastSentTools();

    expect(array_column(array_column($toolsA, 'function'), 'name'))->toBe(['lookup_order']);
    expect(array_column(array_column($toolsB, 'function'), 'name'))->toBe(['failing_op']);
});

// Custom expectation helper
expect()->extend('toContainAllowlistEventType', function (string $type): Expectation {
    $found = array_filter($this->value, fn ($e) => ($e['event'] ?? '') === $type);
    expect($found)->not->toBeEmpty("Expected SSE events to contain '{$type}' event.");

    return $this;
});
