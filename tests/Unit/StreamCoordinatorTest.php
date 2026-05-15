<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Clients\FakeClient;
use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Persistence\MessageRecord;
use Aanfarhan\Chatbot\Streaming\StreamCoordinator;
use Illuminate\Contracts\Config\Repository as ConfigRepository;

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

    $config = Mockery::mock(ConfigRepository::class);
    $config->shouldReceive('get')->with('chatbot.stream_duration', 60)->andReturn(0); // instant cap
    $config->shouldReceive('get')->with('chatbot.model', '')->andReturn('');

    $coordinator = new StreamCoordinator($client, $store, $config);

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

    $config = Mockery::mock(ConfigRepository::class);
    $config->shouldReceive('get')->with('chatbot.stream_duration', 60)->andReturn(60);
    $config->shouldReceive('get')->with('chatbot.model', '')->andReturn('');

    $cache = Mockery::mock(\Illuminate\Contracts\Cache\Repository::class);
    $cache->shouldReceive('increment')->once();
    $cache->shouldReceive('decrement')->once();

    $callCount = 0;
    $coordinator = new StreamCoordinator($client, $store, $config, $cache);

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

    $config = Mockery::mock(ConfigRepository::class);
    $config->shouldReceive('get')->with('chatbot.stream_duration', 60)->andReturn(60);
    $config->shouldReceive('get')->with('chatbot.model', '')->andReturn('');

    $cache = Mockery::mock(\Illuminate\Contracts\Cache\Repository::class);
    $cache->shouldReceive('increment')->with('chatbot.active_streams')->once();
    $cache->shouldReceive('decrement')->with('chatbot.active_streams')->once();

    $coordinator = new StreamCoordinator($client, $store, $config, $cache);

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

    $config = Mockery::mock(ConfigRepository::class);
    $config->shouldReceive('get')->with('chatbot.stream_duration', 60)->andReturn(60);
    $config->shouldReceive('get')->with('chatbot.model', '')->andReturn('');

    $coordinator = new StreamCoordinator($client, $store, $config);

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
