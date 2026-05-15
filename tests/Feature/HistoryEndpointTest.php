<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Facades\Chatbot;
use Aanfarhan\Chatbot\Testing\InteractsWithChatbot;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\View;

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

it('sets a signed HTTP-only chatbot_guest_id cookie on first POST for a guest', function (): void {
    Chatbot::fake()->respondWith('hi');
    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->postJson('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'hello',
    ]);

    $response->assertOk();
    $response->assertCookie('chatbot_guest_id');
    $cookie = $response->getCookie('chatbot_guest_id', decrypt: false);
    expect($cookie)->not->toBeNull()
        ->and($cookie->isHttpOnly())->toBeTrue();
});

it('rehydrate returns messages for valid guest owner', function (): void {
    $store = app(ConversationStore::class);
    $conv = $store->start('default', null, 'guest-abc');
    $store->append($conv->id, 'user', 'Hello', 'orders.show', 'hash1');
    $store->append($conv->id, 'assistant', 'Hi there', 'orders.show', 'hash1');

    $response = $this->withCredentials()
        ->withUnencryptedCookie('chatbot_guest_id', 'guest-abc')
        ->getJson("/chatbot/conversations/{$conv->id}/messages");

    $response->assertOk()
        ->assertJsonCount(2, 'messages')
        ->assertJsonPath('messages.0.role', 'user')
        ->assertJsonPath('messages.1.role', 'assistant');
});

it('rehydrate denies access with a different guest token', function (): void {
    $store = app(ConversationStore::class);
    $conv = $store->start('default', null, 'guest-abc');

    $response = $this->withCredentials()
        ->withUnencryptedCookie('chatbot_guest_id', 'guest-DIFFERENT')
        ->getJson("/chatbot/conversations/{$conv->id}/messages");

    $response->assertStatus(403);
});

it('rehydrate denies cross-user access', function (): void {
    $store = app(ConversationStore::class);
    $conv = $store->start('default', userId: 99, guestToken: null);
    $store->append($conv->id, 'user', 'secret', 'route', 'hash');

    $response = $this->withCredentials()
        ->withUnencryptedCookie('chatbot_guest_id', 'some-guest')
        ->getJson("/chatbot/conversations/{$conv->id}/messages");

    $response->assertStatus(403);
});
