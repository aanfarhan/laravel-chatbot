<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Models\Conversation;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// --- Slice 1: soft-delete by default ---

it('soft-deletes all conversations for a user by default', function (): void {
    $conv = Conversation::create(['channel' => 'default', 'user_id' => 5]);

    $this->artisan('chatbot:delete-user', ['id' => 5])->assertExitCode(0);

    expect(Conversation::find($conv->id))->toBeNull();
    expect(Conversation::withTrashed()->find($conv->id))->not->toBeNull();
});

// --- Slice 2: hard-delete with --hard ---

it('hard-deletes all conversations with --hard flag', function (): void {
    $conv = Conversation::create(['channel' => 'default', 'user_id' => 7]);

    $this->artisan('chatbot:delete-user', ['id' => 7, '--hard' => true])->assertExitCode(0);

    expect(Conversation::withTrashed()->find($conv->id))->toBeNull();
});

// --- Slice 3: --channel scoping ---

it('only deletes conversations in the specified channel', function (): void {
    $support = Conversation::create(['channel' => 'support', 'user_id' => 9]);
    $admin = Conversation::create(['channel' => 'admin',   'user_id' => 9]);

    $this->artisan('chatbot:delete-user', ['id' => 9, '--channel' => 'support'])->assertExitCode(0);

    expect(Conversation::find($support->id))->toBeNull();
    expect(Conversation::find($admin->id))->not->toBeNull();
});

it('deletes across all channels when --channel is omitted', function (): void {
    $a = Conversation::create(['channel' => 'support', 'user_id' => 11]);
    $b = Conversation::create(['channel' => 'admin',   'user_id' => 11]);

    $this->artisan('chatbot:delete-user', ['id' => 11])->assertExitCode(0);

    expect(Conversation::find($a->id))->toBeNull();
    expect(Conversation::find($b->id))->toBeNull();
});
