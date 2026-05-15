<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Clients\FakeClient;
use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Events\ChatbotMessageFailed;
use Aanfarhan\Chatbot\Events\ChatbotMessageStarted;
use Aanfarhan\Chatbot\Exceptions\ChatbotProviderException;
use Aanfarhan\Chatbot\Persistence\MessageRecord;
use Aanfarhan\Chatbot\Streaming\StreamCoordinator;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Illuminate\Contracts\Events\Dispatcher;
use Psr\Log\LoggerInterface;

function lifecycleRecord(): MessageRecord
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

function lifecycleConfig(int $duration = 60): ConfigRepository
{
    $config = Mockery::mock(ConfigRepository::class);
    $config->shouldReceive('get')->with('chatbot.stream_duration', 60)->andReturn($duration);
    $config->shouldReceive('get')->with('chatbot.model', '')->andReturn('gpt-4o-mini');

    return $config;
}

it('dispatches ChatbotMessageStarted before preflight executes', function (): void {
    $order = [];

    $client = new FakeClient;
    $client->respondWithStream(['hi']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->once()->andReturn(lifecycleRecord());

    $events = Mockery::mock(Dispatcher::class);
    $events->shouldReceive('dispatch')->withArgs(function (mixed $event) use (&$order): bool {
        if ($event instanceof ChatbotMessageStarted) {
            $order[] = 'started';
        }

        return true;
    });

    $preflight = function () use (&$order): void {
        $order[] = 'preflight';
    };

    $coordinator = new StreamCoordinator($client, $store, lifecycleConfig(), events: $events);

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'hi']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
        channel: 'default',
        isAborted: fn () => false,
        preflight: $preflight,
    )->sendContent();
    ob_end_clean();

    expect($order[0])->toBe('started');
    expect($order[1])->toBe('preflight');
});

it('dispatches ChatbotMessageFailed carrying the typed exception on stream error', function (): void {
    $client = new FakeClient;
    $client->throwDuringStream(new ChatbotProviderException('upstream error'));

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->once()->andReturn(lifecycleRecord());

    $dispatched = [];
    $events = Mockery::mock(Dispatcher::class);
    $events->shouldReceive('dispatch')->withArgs(function (mixed $event) use (&$dispatched): bool {
        $dispatched[] = $event;

        return true;
    });

    $coordinator = new StreamCoordinator($client, $store, lifecycleConfig(), events: $events);

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'hi']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
        channel: 'default',
        isAborted: fn () => false,
    )->sendContent();
    ob_end_clean();

    $failed = collect($dispatched)->first(fn ($e) => $e instanceof ChatbotMessageFailed);
    expect($failed)->not->toBeNull();
    expect($failed->exception)->toBeInstanceOf(ChatbotProviderException::class);
});

it('writes a [chatbot] log line with all fields after a successful turn', function (): void {
    $client = new FakeClient;
    $client->respondWithStream(['hello']);

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->once()->andReturn(lifecycleRecord());

    $logger = Mockery::mock(LoggerInterface::class);
    $logger->shouldReceive('info')->once()->withArgs(function (string $message, array $context): bool {
        return str_starts_with($message, '[chatbot]')
            && isset($context['conversation_id'])
            && isset($context['channel'])
            && isset($context['model'])
            && isset($context['duration_ms'])
            && isset($context['input_tokens'])
            && isset($context['output_tokens'])
            && ! isset($context['error_code']);
    });

    $coordinator = new StreamCoordinator($client, $store, lifecycleConfig(), logger: $logger);

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'hi']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
        channel: 'support',
        isAborted: fn () => false,
    )->sendContent();
    ob_end_clean();
});

it('writes a [chatbot] log line with error_code on a failed turn', function (): void {
    $client = new FakeClient;
    $client->throwDuringStream(new ChatbotProviderException('bad gateway'));

    $store = Mockery::mock(ConversationStore::class);
    $store->shouldReceive('append')->once()->andReturn(lifecycleRecord());

    $events = Mockery::mock(Dispatcher::class);
    $events->shouldReceive('dispatch')->zeroOrMoreTimes();

    $logger = Mockery::mock(LoggerInterface::class);
    $logger->shouldReceive('info')->once()->withArgs(function (string $message, array $context): bool {
        return str_starts_with($message, '[chatbot]')
            && isset($context['error_code'])
            && $context['error_code'] === 'provider_error';
    });

    $coordinator = new StreamCoordinator($client, $store, lifecycleConfig(), events: $events, logger: $logger);

    ob_start();
    $coordinator->handle(
        messages: [['role' => 'user', 'content' => 'hi']],
        conversationId: 1,
        routeName: 'test',
        contextHash: 'abc',
        channel: 'default',
        isAborted: fn () => false,
    )->sendContent();
    ob_end_clean();
});
