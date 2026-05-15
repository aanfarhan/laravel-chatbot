<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Models\Conversation;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// --- Slice 1: hard-deletes past retention window ---

it('hard-deletes conversations past the retention window', function (): void {
    config(['chatbot.retention_days' => 30]);

    $old = Conversation::create([
        'channel' => 'default',
        'user_id' => 1,
        'last_message_at' => now()->subDays(31),
    ]);

    $recent = Conversation::create([
        'channel' => 'default',
        'user_id' => 2,
        'last_message_at' => now()->subDays(29),
    ]);

    $this->artisan('chatbot:prune')->assertExitCode(0);

    expect(Conversation::withTrashed()->find($old->id))->toBeNull();
    expect(Conversation::withTrashed()->find($recent->id))->not->toBeNull();
});

// --- Slice 2: null = keep forever, 0 = TTL-based ---

it('skips channels with retention_days null (keep forever)', function (): void {
    config([
        'chatbot.retention_days' => null,
    ]);

    $conv = Conversation::create([
        'channel' => 'default',
        'user_id' => 1,
        'last_message_at' => now()->subDays(365),
    ]);

    $this->artisan('chatbot:prune')->assertExitCode(0);

    expect(Conversation::withTrashed()->find($conv->id))->not->toBeNull();
});

it('deletes TTL-expired conversations when retention_days is 0', function (): void {
    config([
        'chatbot.retention_days' => 0,
        'chatbot.conversation_ttl' => 3600,
    ]);

    $expired = Conversation::create([
        'channel' => 'default',
        'user_id' => 1,
        'last_message_at' => now()->subSeconds(7200),
    ]);

    $active = Conversation::create([
        'channel' => 'default',
        'user_id' => 2,
        'last_message_at' => now()->subSeconds(1800),
    ]);

    $this->artisan('chatbot:prune')->assertExitCode(0);

    expect(Conversation::withTrashed()->find($expired->id))->toBeNull();
    expect(Conversation::withTrashed()->find($active->id))->not->toBeNull();
});

it('respects per-channel retention_days override', function (): void {
    config([
        'chatbot.retention_days' => 30,
        'chatbot.channels' => [
            'premium' => ['retention_days' => null],
            'temp'    => ['retention_days' => 7],
        ],
    ]);

    $premiumOld = Conversation::create([
        'channel' => 'premium',
        'user_id' => 1,
        'last_message_at' => now()->subDays(60),
    ]);

    $tempOld = Conversation::create([
        'channel' => 'temp',
        'user_id' => 2,
        'last_message_at' => now()->subDays(8),
    ]);

    $this->artisan('chatbot:prune')->assertExitCode(0);

    expect(Conversation::withTrashed()->find($premiumOld->id))->not->toBeNull();
    expect(Conversation::withTrashed()->find($tempOld->id))->toBeNull();
});
