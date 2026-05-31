<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Clients\FakeClient;
use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Exceptions\ChatbotConfigurationException;
use Aanfarhan\Chatbot\Exceptions\ChatbotContentBlockedException;
use Aanfarhan\Chatbot\Exceptions\ChatbotProviderException;
use Aanfarhan\Chatbot\Exceptions\ChatbotTimeoutException;
use Aanfarhan\Chatbot\Persistence\MessageRecord;
use Aanfarhan\Chatbot\Streaming\StreamCoordinator;
use Illuminate\Config\Repository as ConfigRepository;

function makeConfig(int $duration = 60): ConfigRepository
{
    return new ConfigRepository(['chatbot' => [
        'stream_duration' => $duration,
        'model' => 'gpt-4o-mini',
        'provider' => ['supports_tools' => true],
    ]]);
}

function makeStore(?callable $appendCallback = null): ConversationStore
{
    $store = Mockery::mock(ConversationStore::class);
    if ($appendCallback) {
        $store->shouldReceive('append')->andReturnUsing($appendCallback);
    } else {
        $store->shouldReceive('append')->andReturn(makeErrorMessageRecord());
    }

    return $store;
}

function makeErrorMessageRecord(): MessageRecord
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

function runCoordinator(StreamCoordinator $coordinator, FakeClient $client): string
{
    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'hi']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
        isAborted: fn () => false,
    )->sendContent();

    return (string) ob_get_clean();
}

function parseSseToEvents(string $raw): array
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
            $current['data'] = json_decode(trim(substr($line, 5)), true);
        }
    }

    return $events;
}

// --- Tracer bullet ---

it('emits SSE error event with code and retryable when ChatbotProviderException is thrown', function (): void {
    $client = new FakeClient;
    $client->throwDuringStream(new ChatbotProviderException('upstream failed', retryable: true));

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->once()->andReturn(makeErrorMessageRecord());

    $coordinator = new StreamCoordinator($client, $store, makeConfig());

    $events = parseSseToEvents(runCoordinator($coordinator, $client));

    $errorEvent = collect($events)->firstWhere('event', 'error');

    expect($errorEvent)->not->toBeNull();
    expect($errorEvent['data']['code'])->toBe('provider_error');
    expect($errorEvent['data']['retryable'])->toBeTrue();
});

// --- Partial persistence ---

it('persists partial chunks and error JSON when exception is thrown mid-stream', function (): void {
    $client = new FakeClient;
    $client->throwDuringStream(
        new ChatbotProviderException('upstream failed'),
        chunksBefore: ['Hello', ' world'],
    );

    $capturedArgs = null;
    $store = makeStore(function () use (&$capturedArgs): MessageRecord {
        $capturedArgs = func_get_args();

        return makeErrorMessageRecord();
    });

    $coordinator = new StreamCoordinator($client, $store, makeConfig());
    runCoordinator($coordinator, $client);

    expect($capturedArgs)->not->toBeNull();
    expect($capturedArgs[2])->toBe('Hello world'); // content = partial chunks
    expect($capturedArgs[8])->toMatchArray(['code' => 'provider_error']); // error param
});

// --- Exception code mapping ---

it('emits code=timeout for ChatbotTimeoutException', function (): void {
    $client = new FakeClient;
    $client->throwDuringStream(new ChatbotTimeoutException('timed out'));

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->once()->andReturn(makeErrorMessageRecord());

    $coordinator = new StreamCoordinator($client, $store, makeConfig());
    $events = parseSseToEvents(runCoordinator($coordinator, $client));

    $errorEvent = collect($events)->firstWhere('event', 'error');

    expect($errorEvent['data']['code'])->toBe('timeout');
    expect($errorEvent['data']['retryable'])->toBeTrue();
});

it('emits code=content_blocked with retryable=false for ChatbotContentBlockedException', function (): void {
    $client = new FakeClient;
    $client->throwDuringStream(new ChatbotContentBlockedException('blocked'));

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->once()->andReturn(makeErrorMessageRecord());

    $coordinator = new StreamCoordinator($client, $store, makeConfig());
    $events = parseSseToEvents(runCoordinator($coordinator, $client));

    $errorEvent = collect($events)->firstWhere('event', 'error');

    expect($errorEvent['data']['code'])->toBe('content_blocked');
    expect($errorEvent['data']['retryable'])->toBeFalse();
});

it('emits code=configuration_error for ChatbotConfigurationException', function (): void {
    $client = new FakeClient;
    $client->throwDuringStream(new ChatbotConfigurationException('missing api key'));

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->once()->andReturn(makeErrorMessageRecord());

    $coordinator = new StreamCoordinator($client, $store, makeConfig());
    $events = parseSseToEvents(runCoordinator($coordinator, $client));

    $errorEvent = collect($events)->firstWhere('event', 'error');

    expect($errorEvent['data']['code'])->toBe('configuration_error');
    expect($errorEvent['data']['retryable'])->toBeFalse();
});
