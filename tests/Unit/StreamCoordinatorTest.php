<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Clients\FakeClient;
use Aanfarhan\Chatbot\Contracts\ChatbotTool;
use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Contracts\ToolResolver;
use Aanfarhan\Chatbot\Persistence\MessageRecord;
use Aanfarhan\Chatbot\Streaming\RecordingStreamEmitter;
use Aanfarhan\Chatbot\Streaming\StreamCoordinator;
use Aanfarhan\Chatbot\Tools\ToolInvocation;
use Aanfarhan\Chatbot\Tools\ToolInvoker;
use Illuminate\Config\Repository as ConfigRepository;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Cache\Repository;

function makeCoordinatorConfig(int $duration = 60, string $model = '', bool $supportsTools = true, int $maxCalls = 5): ConfigRepository
{
    return new ConfigRepository(['chatbot' => [
        'stream_duration' => $duration,
        'model' => $model,
        'provider' => ['supports_tools' => $supportsTools],
        'tools' => ['max_calls_per_turn' => $maxCalls],
    ]]);
}

function parseSseEvents(string $raw): array
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
            $current['data'] = trim(substr($line, 5));
        }
    }

    return $events;
}

function makeMessageRecord(): MessageRecord
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

it('emits error event and stops when stream-duration cap is exceeded', function (): void {
    $client = new FakeClient;
    $client->respondWithStream(['A', 'B', 'C']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->once()->andReturn(makeMessageRecord());

    $coordinator = new StreamCoordinator($client, $store, makeCoordinatorConfig(duration: 0)); // instant cap

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'hi']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
        isAborted: fn () => false,
    )->sendContent();
    $output = (string) ob_get_clean();

    $events = parseSseEvents($output);

    $lastEvent = end($events);
    expect($lastEvent['event'])->toBe('error');
    expect(json_decode($lastEvent['data'], true)['code'])->toBe('timeout');
});

it('tears down the upstream stream and decrements counter on client abort', function (): void {
    $client = new FakeClient;
    $client->respondWithStream(['A', 'B', 'C']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->never();

    $cache = Mockery::mock(Repository::class);
    $cache->shouldReceive('increment')->once();
    $cache->shouldReceive('decrement')->once();

    $callCount = 0;
    $coordinator = new StreamCoordinator($client, $store, makeCoordinatorConfig(), $cache);

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'hi']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
        isAborted: function () use (&$callCount): bool {
            return ++$callCount > 1; // abort after first chunk
        },
    )->sendContent();
    ob_end_clean();

    expect($client->wasStreamAborted())->toBeTrue();
});

it('increments the active-stream counter on start and decrements on success', function (): void {
    $client = new FakeClient;
    $client->respondWithStream(['Hi']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->once()->andReturn(makeMessageRecord());

    $cache = Mockery::mock(Repository::class);
    $cache->shouldReceive('increment')->with('chatbot.active_streams')->once();
    $cache->shouldReceive('decrement')->with('chatbot.active_streams')->once();

    $coordinator = new StreamCoordinator($client, $store, makeCoordinatorConfig(), $cache);

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'hi']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
        isAborted: fn () => false,
    )->sendContent();
    ob_end_clean();
});

it('emits token events then done for a three-chunk stream', function (): void {
    $client = new FakeClient;
    $client->respondWithStream(['Hel', 'lo', '!']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->once()->andReturn(makeMessageRecord());

    $coordinator = new StreamCoordinator($client, $store, makeCoordinatorConfig());

    $response = $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'hi']],
        conversationId: 1,
        routeName: 'orders.show',
        contextHash: 'abc',
        isAborted: fn () => false,
    );

    ob_start();
    $response->sendContent();
    $output = (string) ob_get_clean();

    $events = parseSseEvents($output);

    expect($events)->toHaveCount(4);

    expect($events[0]['event'])->toBe('token');
    expect(json_decode($events[0]['data'], true)['content'])->toBe('Hel');

    expect($events[1]['event'])->toBe('token');
    expect(json_decode($events[1]['data'], true)['content'])->toBe('lo');

    expect($events[2]['event'])->toBe('token');
    expect(json_decode($events[2]['data'], true)['content'])->toBe('!');

    expect($events[3]['event'])->toBe('done');
});

it('emits token and done via recording emitter without ob_start', function (): void {
    $client = new FakeClient;
    $client->respondWithStream(['Hel', 'lo']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->once()->andReturn(makeMessageRecord());

    $emitter = new RecordingStreamEmitter;
    $coordinator = new StreamCoordinator($client, $store, makeCoordinatorConfig(), emitter: $emitter);

    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'hi']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
        isAborted: fn () => false,
    )->sendContent();

    $events = $emitter->events();

    expect(array_column($events, 'event'))->toBe(['token', 'token', 'done']);
    expect($events[0]['content'])->toBe('Hel');
    expect($events[1]['content'])->toBe('lo');
    expect($events[2]['conversation_id'])->toBe('');
});

it('persists the assistant message but omits its id from the done event', function (): void {
    $client = new FakeClient;
    $client->respondWithStream(['Hi']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->once()->andReturn(makeMessageRecord());

    $coordinator = new StreamCoordinator($client, $store, makeCoordinatorConfig());

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'hi']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
        isAborted: fn () => false,
    )->sendContent();
    $output = (string) ob_get_clean();

    $events = parseSseEvents($output);
    $done = end($events);

    expect($done['event'])->toBe('done');
    expect(json_decode($done['data'], true))->not->toHaveKey('message_id');
});

it('uses the injected ToolInvoker emitter events when a tool call arrives', function (): void {
    $emitter = new RecordingStreamEmitter;

    $resolvedTool = new class implements ChatbotTool
    {
        public function name(): string
        {
            return 'ping';
        }

        public function description(): string
        {
            return 'ping';
        }

        /** @return array<string, mixed> */
        public function parameters(): array
        {
            return ['type' => 'object', 'properties' => []];
        }

        public function authorize(?Authenticatable $actor, ToolInvocation $inv): bool
        {
            return true;
        }

        public function handle(?Authenticatable $actor, ToolInvocation $inv): string
        {
            return 'pong';
        }
    };

    $resolver = new class($resolvedTool) implements ToolResolver
    {
        public function __construct(private ChatbotTool $tool) {}

        public function resolve(string $name): ?ChatbotTool
        {
            return $this->tool;
        }

        public function definitions(?array $allowedTools): array
        {
            return [['type' => 'function', 'function' => ['name' => 'ping', 'description' => 'ping', 'parameters' => ['type' => 'object', 'properties' => []]]]];
        }
    };

    $invoker = new ToolInvoker(
        resolver: $resolver,
        invocationStore: null,
        emitter: $emitter,
        defaultTimeout: 10,
        resultSizeCap: 4096,
        maxArgLength: 10240,
    );

    $client = new FakeClient;
    $client->respondWithToolCall('ping', [], 'call_1');
    $client->respondWithStream(['ok']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->andReturn(makeMessageRecord());

    $coordinator = new StreamCoordinator(
        llm: $client,
        store: $store,
        config: makeCoordinatorConfig(),
        emitter: $emitter,
        toolInvoker: $invoker,
    );

    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'ping']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
        isAborted: fn () => false,
    )->sendContent();

    $eventTypes = array_column($emitter->events(), 'event');
    expect($eventTypes)->toContain('tool_started');
    expect($eventTypes)->toContain('tool_finished');
    expect($eventTypes)->toContain('done');
});
