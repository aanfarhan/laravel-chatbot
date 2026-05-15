<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Models\Conversation;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// --- Slice 1: soft-delete by default ---

it('soft-deletes conversations for a guest token by default', function (): void {
    $conv = Conversation::create(['channel' => 'default', 'guest_token' => 'tok-abc']);

    $this->artisan('chatbot:delete-guest', ['token' => 'tok-abc'])->assertExitCode(0);

    expect(Conversation::find($conv->id))->toBeNull();
    expect(Conversation::withTrashed()->find($conv->id))->not->toBeNull();
});

// --- Slice 2: hard-delete with --hard ---

it('hard-deletes conversations for a guest token with --hard', function (): void {
    $conv = Conversation::create(['channel' => 'default', 'guest_token' => 'tok-xyz']);

    $this->artisan('chatbot:delete-guest', ['token' => 'tok-xyz', '--hard' => true])->assertExitCode(0);

    expect(Conversation::withTrashed()->find($conv->id))->toBeNull();
});

it('does not affect conversations for other guest tokens', function (): void {
    $target = Conversation::create(['channel' => 'default', 'guest_token' => 'tok-target']);
    $other = Conversation::create(['channel' => 'default', 'guest_token' => 'tok-other']);

    $this->artisan('chatbot:delete-guest', ['token' => 'tok-target'])->assertExitCode(0);

    expect(Conversation::find($target->id))->toBeNull();
    expect(Conversation::find($other->id))->not->toBeNull();
});
