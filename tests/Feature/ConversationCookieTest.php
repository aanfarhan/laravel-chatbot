<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Facades\Chatbot;
use Aanfarhan\Chatbot\Testing\InteractsWithChatbot;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\View;
use Illuminate\Testing\TestResponse;

uses(RefreshDatabase::class);
uses(InteractsWithChatbot::class);

beforeEach(function (): void {
    config()->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
    View::addLocation(__DIR__.'/fixtures');

    Route::middleware('web')->get('/orders/{order}', function ($order) {
        Chatbot::context(['order' => ['id' => (int) $order]]);

        return view('order-page', ['order' => (int) $order]);
    })->name('orders.show');
});

function postAndStream(TestResponse $response): void
{
    ob_start();
    $response->baseResponse->sendContent();
    ob_end_clean();
}

it('starts a new conversation after the idle window expires', function (): void {
    config()->set('chatbot.conversation_ttl', 10);
    Chatbot::fake()->respondWithStream(['r1'])->respondWithStream(['r2']);
    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $r1 = $this->postJson('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'first',
    ])->assertOk();
    postAndStream($r1);

    $convId = DB::table('chatbot_conversations')->value('id');

    DB::table('chatbot_conversations')->update(['last_message_at' => now()->subSeconds(20)]);

    $r2 = $this->withCredentials()
        ->withUnencryptedCookie('chatbot_conversation_default', (string) $convId)
        ->postJson('/chatbot/messages', [
            'signed_context' => $envelope,
            'message' => 'after idle',
        ])->assertOk();
    postAndStream($r2);

    expect(DB::table('chatbot_conversations')->count())->toBe(2);
});

it('reuses the same conversation on the second POST when cookie is carried', function (): void {
    Chatbot::fake()->respondWithStream(['reply1'])->respondWithStream(['reply2']);
    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $r1 = $this->postJson('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'first',
    ])->assertOk();
    postAndStream($r1);

    $conversationId = DB::table('chatbot_conversations')->value('id');

    $r2 = $this->withCredentials()
        ->withUnencryptedCookie('chatbot_conversation_default', (string) $conversationId)
        ->postJson('/chatbot/messages', [
            'signed_context' => $envelope,
            'message' => 'second',
        ])->assertOk();
    postAndStream($r2);

    expect(DB::table('chatbot_conversations')->count())->toBe(1)
        ->and(DB::table('chatbot_messages')->count())->toBe(4);
});

it('sets the conversation cookie on the first POST', function (): void {
    Chatbot::fake()->respondWithStream(['hello']);
    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->withMiddleware()->postJson('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'hi',
    ]);

    $response->assertOk();
    $response->assertCookie('chatbot_conversation_default');
});
