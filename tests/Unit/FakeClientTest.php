<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Clients\FakeClient;
use Aanfarhan\Chatbot\Responses\ChatResponse;
use Illuminate\Support\Facades\Log;

it('returns the queued reply from respondWith()', function (): void {
    $client = new FakeClient;
    $client->respondWith('hi');

    $response = $client->chat([['role' => 'user', 'content' => 'hello']]);

    expect($response)->toBeInstanceOf(ChatResponse::class);
    expect($response->content)->toBe('hi');
});

it('returns a benign canned reply and warns when nothing is queued', function (): void {
    Log::spy();

    $client = new FakeClient;

    $response = $client->chat([['role' => 'user', 'content' => 'hello']]);

    expect($response->content)->toBe(FakeClient::CANNED_REPLY);
    Log::shouldHaveReceived('warning')
        ->withArgs(fn (string $message): bool => str_contains($message, 'FakeClient'))
        ->once();
});

it('records sent messages and exposes them via recordedPrompts()', function (): void {
    $client = new FakeClient;
    $client->respondWith('reply');

    $messages = [
        ['role' => 'system', 'content' => 'You are a helper.'],
        ['role' => 'user', 'content' => 'hello'],
    ];
    $client->chat($messages);

    expect($client->recordedPrompts())->toHaveCount(1)
        ->and($client->recordedPrompts()[0])->toBe($messages);
});

it('assertSentPrompt passes when the callable returns true for a recorded prompt', function (): void {
    $client = new FakeClient;
    $client->respondWith('reply');

    $client->chat([['role' => 'user', 'content' => 'hello']]);

    expect(fn () => $client->assertSentPrompt(fn (array $messages) => $messages[0]['content'] === 'hello'))
        ->not->toThrow(\Throwable::class);
});

it('assertSentPrompt fails when no recorded prompt matches', function (): void {
    $client = new FakeClient;
    $client->respondWith('reply');

    $client->chat([['role' => 'user', 'content' => 'hello']]);

    expect(fn () => $client->assertSentPrompt(fn (array $messages) => $messages[0]['content'] === 'NEVER'))
        ->toThrow(\PHPUnit\Framework\AssertionFailedError::class);
});
