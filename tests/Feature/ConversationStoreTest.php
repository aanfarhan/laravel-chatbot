<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Models\Conversation;
use Aanfarhan\Chatbot\Persistence\ConversationRecord;
use Aanfarhan\Chatbot\Persistence\MessageRecord;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

it('mints a UUIDv4 handle on start', function (): void {
    $store = app(ConversationStore::class);

    $conv = $store->start(channel: 'default', userId: 5, guestToken: null);

    expect($conv->uuid)->toBeString()
        ->and(Str::isUuid($conv->uuid))->toBeTrue();
});

it('does not let the uuid be mass-assigned', function (): void {
    $injected = (string) Str::uuid();

    $conversation = Conversation::create([
        'channel' => 'default',
        'uuid' => $injected,
    ]);

    expect($conversation->uuid)->not->toBe($injected)
        ->and(Str::isUuid($conversation->uuid))->toBeTrue();
});

it('findByUuidWithMessages returns the conversation, owner and messages in order', function (): void {
    $store = app(ConversationStore::class);
    $conv = $store->start(channel: 'default', userId: null, guestToken: 'guest-abc');
    $store->append($conv->id, 'user', 'Hello', 'orders.show', 'h1');
    $store->append($conv->id, 'assistant', 'Hi there', 'orders.show', 'h1');

    $found = $store->findByUuidWithMessages($conv->uuid);

    expect($found)->not->toBeNull()
        ->and($found->uuid)->toBe($conv->uuid)
        ->and($found->guestToken)->toBe('guest-abc')
        ->and($found->userId)->toBeNull()
        ->and($found->messages)->toHaveCount(2)
        ->and($found->messages[0]->role)->toBe('user')
        ->and($found->messages[0]->content)->toBe('Hello')
        ->and($found->messages[1]->role)->toBe('assistant');
});

it('findByUuidWithMessages returns null for an unknown handle', function (): void {
    $store = app(ConversationStore::class);

    expect($store->findByUuidWithMessages((string) Str::uuid()))->toBeNull();
});

it('append stores a message with route_name and context_hash', function (): void {
    $store = app(ConversationStore::class);
    $conv = $store->start(channel: 'default', userId: 1, guestToken: null);

    $msg = $store->append(
        conversationId: $conv->id,
        role: 'user',
        content: 'Hello',
        routeName: 'orders.show',
        contextHash: 'abc123',
        inputTokens: 10,
        outputTokens: 0,
        costCents: 0,
    );

    expect($msg)->toBeInstanceOf(MessageRecord::class)
        ->and($msg->role)->toBe('user')
        ->and($msg->content)->toBe('Hello')
        ->and($msg->routeName)->toBe('orders.show')
        ->and($msg->contextHash)->toBe('abc123')
        ->and($msg->inputTokens)->toBe(10)
        ->and($msg->conversationId)->toBe($conv->id);
});

it('findByUuid returns null for a soft-deleted conversation', function (): void {
    $store = app(ConversationStore::class);
    $conv = $store->start(channel: 'default', userId: 5, guestToken: null);

    $store->delete($conv->id);

    expect($store->findByUuid($conv->uuid))->toBeNull();
});

it('findByUuid returns null for an unknown handle', function (): void {
    $store = app(ConversationStore::class);

    expect($store->findByUuid((string) Str::uuid()))->toBeNull();
});

it('starts and finds a conversation by uuid for a guest', function (): void {
    $store = app(ConversationStore::class);

    $conv = $store->start(channel: 'support', userId: null, guestToken: 'guest-abc');

    expect($conv->userId)->toBeNull()
        ->and($conv->guestToken)->toBe('guest-abc')
        ->and($conv->channel)->toBe('support');

    $found = $store->findByUuid($conv->uuid);

    expect($found)->not->toBeNull()
        ->and($found->guestToken)->toBe('guest-abc')
        ->and($found->userId)->toBeNull();
});

it('starts and finds a conversation by uuid for an authenticated user', function (): void {
    $store = app(ConversationStore::class);

    $conv = $store->start(channel: 'default', userId: 42, guestToken: null);

    expect($conv)->toBeInstanceOf(ConversationRecord::class)
        ->and($conv->channel)->toBe('default')
        ->and($conv->userId)->toBe(42)
        ->and($conv->guestToken)->toBeNull();

    $found = $store->findByUuid($conv->uuid);

    expect($found)->not->toBeNull()
        ->and($found->id)->toBe($conv->id)
        ->and($found->userId)->toBe(42);
});

it('forUser returns all conversations belonging to a user', function (): void {
    $store = app(ConversationStore::class);

    $a = $store->start(channel: 'default', userId: 7, guestToken: null);
    $b = $store->start(channel: 'support', userId: 7, guestToken: null);
    $store->start(channel: 'default', userId: 99, guestToken: null); // another user

    $results = $store->forUser(7);

    expect($results)->toHaveCount(2)
        ->and(array_column($results, 'id'))->toContain($a->id)
        ->and(array_column($results, 'id'))->toContain($b->id);
});

it('forUser returns an empty array when the user has no conversations', function (): void {
    $store = app(ConversationStore::class);

    expect($store->forUser(999))->toBe([]);
});

it('forUser does not return soft-deleted conversations', function (): void {
    $store = app(ConversationStore::class);

    $conv = $store->start(channel: 'default', userId: 7, guestToken: null);
    $store->delete($conv->id);

    expect($store->forUser(7))->toBe([]);
});

it('anonymize strips user_id and guest_token from a conversation', function (): void {
    $store = app(ConversationStore::class);

    $conv = $store->start(channel: 'default', userId: 5, guestToken: 'tok-abc');
    $store->anonymize($conv->id);

    $found = $store->findByUuid($conv->uuid);

    expect($found)->not->toBeNull()
        ->and($found->userId)->toBeNull()
        ->and($found->guestToken)->toBeNull();
});

it('export returns conversation metadata and messages as an array', function (): void {
    $store = app(ConversationStore::class);

    $conv = $store->start(channel: 'orders', userId: 3, guestToken: null);
    $store->append($conv->id, 'user', 'Hello', 'orders.show', 'h1');
    $store->append($conv->id, 'assistant', 'Hi there', 'orders.show', 'h1');

    $data = $store->export($conv->id);

    expect($data['id'])->toBe($conv->id)
        ->and($data['channel'])->toBe('orders')
        ->and($data['messages'])->toHaveCount(2)
        ->and($data['messages'][0]['role'])->toBe('user')
        ->and($data['messages'][0]['content'])->toBe('Hello')
        ->and($data['messages'][1]['role'])->toBe('assistant')
        ->and($data['messages'][0])->toHaveKey('created_at');
});
