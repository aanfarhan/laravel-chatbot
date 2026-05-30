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

function drainOwnership(TestResponse $response): void
{
    ob_start();
    $response->baseResponse->sendContent();
    ob_end_clean();
}

function createUsersTable(): void
{
    config()->set('auth.providers.users.model', FakeUser::class);
    Schema::create('users', function ($table): void {
        $table->id();
        $table->string('name')->default('Test');
    });
}

it('starts a fresh conversation when the cookie names a conversation owned by a different guest token', function (): void {
    $store = app(ConversationStore::class);
    $victim = $store->start('default', userId: null, guestToken: 'guest-A');
    $store->append($victim->id, 'user', 'victim turn', 'orders.show', 'hash');

    Chatbot::fake()->respondWithStream(['reply']);
    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->withCredentials()
        ->withUnencryptedCookie('chatbot_conversation_default', $victim->uuid)
        ->withUnencryptedCookie('chatbot_guest_id', 'guest-B')
        ->postJson('/chatbot/messages', [
            'signed_context' => $envelope,
            'message' => 'attacker turn',
        ])->assertOk();
    drainOwnership($response);

    // A second conversation is created; the victim's is untouched.
    expect(DB::table('chatbot_conversations')->count())->toBe(2);
    expect(DB::table('chatbot_messages')->where('conversation_id', $victim->id)->count())->toBe(1);
});

it('does not let an authenticated requester resume a guest-owned conversation via a stale guest token', function (): void {
    createUsersTable();
    $requester = FakeUser::create(['name' => 'Member']);

    $store = app(ConversationStore::class);
    $victim = $store->start('default', userId: null, guestToken: 'guest-A');
    $store->append($victim->id, 'user', 'guest turn', 'orders.show', 'hash');

    Chatbot::fake()->respondWithStream(['reply']);
    $this->actingAs($requester);
    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->withCredentials()
        ->withUnencryptedCookie('chatbot_conversation_default', $victim->uuid)
        ->withUnencryptedCookie('chatbot_guest_id', 'guest-A')
        ->postJson('/chatbot/messages', [
            'signed_context' => $envelope,
            'message' => 'authed turn',
        ])->assertOk();
    drainOwnership($response);

    expect(DB::table('chatbot_conversations')->count())->toBe(2);
    expect(DB::table('chatbot_messages')->where('conversation_id', $victim->id)->count())->toBe(1);
});

it('starts a fresh conversation when the cookie names a conversation owned by a different authenticated user', function (): void {
    createUsersTable();
    $requester = FakeUser::create(['name' => 'Attacker']);

    $store = app(ConversationStore::class);
    $victim = $store->start('default', userId: 99, guestToken: null);
    $store->append($victim->id, 'user', 'victim turn', 'orders.show', 'hash');

    Chatbot::fake()->respondWithStream(['reply']);
    $this->actingAs($requester);
    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->withCredentials()
        ->withUnencryptedCookie('chatbot_conversation_default', $victim->uuid)
        ->postJson('/chatbot/messages', [
            'signed_context' => $envelope,
            'message' => 'attacker turn',
        ])->assertOk();
    drainOwnership($response);

    expect(DB::table('chatbot_conversations')->count())->toBe(2);
    expect(DB::table('chatbot_messages')->where('conversation_id', $victim->id)->count())->toBe(1);
});

it('never reuses an anonymized conversation owned by neither party', function (): void {
    $store = app(ConversationStore::class);
    $orphan = $store->start('default', userId: null, guestToken: null);
    $store->append($orphan->id, 'user', 'orphan turn', 'orders.show', 'hash');

    Chatbot::fake()->respondWithStream(['reply']);
    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->withCredentials()
        ->withUnencryptedCookie('chatbot_conversation_default', $orphan->uuid)
        ->withUnencryptedCookie('chatbot_guest_id', 'guest-Z')
        ->postJson('/chatbot/messages', [
            'signed_context' => $envelope,
            'message' => 'scavenger turn',
        ])->assertOk();
    drainOwnership($response);

    expect(DB::table('chatbot_conversations')->count())->toBe(2);
    expect(DB::table('chatbot_messages')->where('conversation_id', $orphan->id)->count())->toBe(1);
});

it('resumes the same conversation for the legitimate guest owner', function (): void {
    $store = app(ConversationStore::class);
    $owned = $store->start('default', userId: null, guestToken: 'guest-X');
    $store->append($owned->id, 'user', 'first turn', 'orders.show', 'hash');

    Chatbot::fake()->respondWithStream(['reply']);
    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->withCredentials()
        ->withUnencryptedCookie('chatbot_conversation_default', $owned->uuid)
        ->withUnencryptedCookie('chatbot_guest_id', 'guest-X')
        ->postJson('/chatbot/messages', [
            'signed_context' => $envelope,
            'message' => 'second turn',
        ])->assertOk();
    drainOwnership($response);

    expect(DB::table('chatbot_conversations')->count())->toBe(1);
    expect(DB::table('chatbot_messages')->where('conversation_id', $owned->id)->where('role', 'user')->count())->toBe(2);
});
