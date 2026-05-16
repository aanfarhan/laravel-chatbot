<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Models\Conversation;
use Aanfarhan\Chatbot\Models\Message;
use Aanfarhan\Chatbot\Tests\Stubs\FakeUser;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    Schema::create('users', function ($table): void {
        $table->id();
        $table->string('name')->default('Test');
    });
});

afterEach(function (): void {
    Schema::dropIfExists('users');
});

// --- Slice 1: chatbotConversations relation ---

it('returns conversations via chatbotConversations()', function (): void {
    $user = FakeUser::create([]);
    Conversation::create(['channel' => 'default', 'user_id' => $user->id]);

    expect($user->chatbotConversations()->count())->toBe(1);
});

// --- Slice 2: deleteChatbotData soft-delete ---

it('soft-deletes conversations via deleteChatbotData()', function (): void {
    $user = FakeUser::create([]);
    $conv = Conversation::create(['channel' => 'default', 'user_id' => $user->id]);

    $user->deleteChatbotData();

    expect(Conversation::find($conv->id))->toBeNull();
    expect(Conversation::withTrashed()->find($conv->id))->not->toBeNull();
});

// --- Slice 3: deleteChatbotData hard-delete ---

it('hard-deletes conversations via deleteChatbotData(hard: true)', function (): void {
    $user = FakeUser::create([]);
    $conv = Conversation::create(['channel' => 'default', 'user_id' => $user->id]);

    $user->deleteChatbotData(hard: true);

    expect(Conversation::withTrashed()->find($conv->id))->toBeNull();
});

// --- Slice 4: exportChatbotData versioned array ---

it('returns versioned export array via exportChatbotData()', function (): void {
    $user = FakeUser::create([]);
    $conv = Conversation::create(['channel' => 'default', 'user_id' => $user->id]);
    Message::create([
        'conversation_id' => $conv->id,
        'role' => 'user',
        'content' => 'Export me',
        'route_name' => 'home',
        'context_hash' => 'xyz',
        'created_at' => now(),
    ]);

    $export = $user->exportChatbotData();

    expect($export['format'])->toBe('chatbot-export@1')
        ->and($export['user_id'])->toBe($user->id)
        ->and($export)->toHaveKey('exported_at')
        ->and($export['conversations'])->toHaveCount(1)
        ->and($export['conversations'][0]['messages'][0]['content'])->toBe('Export me');
});
