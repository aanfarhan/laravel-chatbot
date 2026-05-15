<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Persistence\ConversationRecord;
use Aanfarhan\Chatbot\Persistence\MessageRecord;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('find returns null for a soft-deleted conversation', function (): void {
    $store = app(ConversationStore::class);
    $conv = $store->start(channel: 'default', userId: 5, guestToken: null);

    $store->delete($conv->id);

    expect($store->find($conv->id))->toBeNull();
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

it('starts and finds a conversation for a guest', function (): void {
    $store = app(ConversationStore::class);

    $conv = $store->start(channel: 'support', userId: null, guestToken: 'guest-abc');

    expect($conv->userId)->toBeNull()
        ->and($conv->guestToken)->toBe('guest-abc')
        ->and($conv->channel)->toBe('support');

    $found = $store->find($conv->id);

    expect($found)->not->toBeNull()
        ->and($found->guestToken)->toBe('guest-abc')
        ->and($found->userId)->toBeNull();
});

it('starts and finds a conversation for an authenticated user', function (): void {
    $store = app(ConversationStore::class);

    $conv = $store->start(channel: 'default', userId: 42, guestToken: null);

    expect($conv)->toBeInstanceOf(ConversationRecord::class)
        ->and($conv->channel)->toBe('default')
        ->and($conv->userId)->toBe(42)
        ->and($conv->guestToken)->toBeNull();

    $found = $store->find($conv->id);

    expect($found)->not->toBeNull()
        ->and($found->id)->toBe($conv->id)
        ->and($found->userId)->toBe(42);
});
