<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Facades\Chatbot;
use Aanfarhan\Chatbot\Testing\InteractsWithChatbot;
use Aanfarhan\Chatbot\Tests\Stubs\FakeUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
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

function historyUsersTable(): void
{
    config()->set('auth.providers.users.model', FakeUser::class);
    Schema::create('users', function ($table): void {
        $table->id();
        $table->string('name')->default('Test');
    });
}

it('lets an authenticated user fetch their own history, scoped by the envelope identity', function (): void {
    historyUsersTable();
    $owner = FakeUser::create(['name' => 'Owner']);

    $store = app(ConversationStore::class);
    $conv = $store->start('default', userId: (int) $owner->getKey(), guestToken: null);
    $store->append($conv->id, 'user', 'mine', 'orders.show', 'hash');

    $this->actingAs($owner);
    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->getJson("/chatbot/conversations/{$conv->uuid}/messages?signed_context=".urlencode($envelope));

    $response->assertOk()
        ->assertJsonPath('messages.0.role', 'user')
        ->assertJsonPath('messages.0.content', 'mine');
});

it('rejects an authenticated owner with a missing envelope (identity comes from the token, not the session)', function (): void {
    historyUsersTable();
    $owner = FakeUser::create(['name' => 'Owner']);

    $store = app(ConversationStore::class);
    $conv = $store->start('default', userId: (int) $owner->getKey(), guestToken: null);
    $store->append($conv->id, 'user', 'mine', 'orders.show', 'hash');

    $this->actingAs($owner);

    $this->getJson("/chatbot/conversations/{$conv->uuid}/messages")
        ->assertStatus(403);
});

it('rejects an authenticated requester whose envelope identity differs from the conversation owner', function (): void {
    historyUsersTable();
    $attacker = FakeUser::create(['name' => 'Attacker']);

    $store = app(ConversationStore::class);
    $conv = $store->start('default', userId: 99, guestToken: null);
    $store->append($conv->id, 'user', 'secret', 'orders.show', 'hash');

    $this->actingAs($attacker);
    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $this->getJson("/chatbot/conversations/{$conv->uuid}/messages?signed_context=".urlencode($envelope))
        ->assertStatus(403);
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

it('rehydrate returns messages for a guest owner whose envelope is guest and cookie matches', function (): void {
    $store = app(ConversationStore::class);
    $conv = $store->start('default', null, 'guest-abc');
    $store->append($conv->id, 'user', 'Hello', 'orders.show', 'hash1');
    $store->append($conv->id, 'assistant', 'Hi there', 'orders.show', 'hash1');

    // Guest render → envelope carries a null userId; the guest cookie still
    // cross-checks ownership. Sent via withCookie so EncryptCookies (web) can
    // decrypt it — withUnencryptedCookie would be dropped.
    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->withCredentials()
        ->withCookie('chatbot_guest_id', 'guest-abc')
        ->getJson("/chatbot/conversations/{$conv->uuid}/messages?signed_context=".urlencode($envelope));

    $response->assertOk()
        ->assertJsonCount(2, 'messages')
        ->assertJsonPath('messages.0.role', 'user')
        ->assertJsonPath('messages.1.role', 'assistant');
});

it('rehydrate denies a guest whose cookie does not match the conversation token', function (): void {
    $store = app(ConversationStore::class);
    $conv = $store->start('default', null, 'guest-abc');

    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->withCredentials()
        ->withCookie('chatbot_guest_id', 'guest-DIFFERENT')
        ->getJson("/chatbot/conversations/{$conv->uuid}/messages?signed_context=".urlencode($envelope));

    $response->assertStatus(403);
});

it('rehydrate denies a guest envelope against a user-owned conversation', function (): void {
    $store = app(ConversationStore::class);
    $conv = $store->start('default', userId: 99, guestToken: null);
    $store->append($conv->id, 'user', 'secret', 'route', 'hash');

    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->withCredentials()
        ->withCookie('chatbot_guest_id', 'some-guest')
        ->getJson("/chatbot/conversations/{$conv->uuid}/messages?signed_context=".urlencode($envelope));

    $response->assertStatus(403);
});
