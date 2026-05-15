<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Models\Conversation;
use Aanfarhan\Chatbot\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;

uses(RefreshDatabase::class);

// --- Slice 1: versioned JSON output ---

it('outputs a versioned JSON export for a user', function (): void {
    $conv = Conversation::create(['channel' => 'default', 'user_id' => 3]);
    Message::create([
        'conversation_id' => $conv->id,
        'role' => 'user',
        'content' => 'Hello',
        'route_name' => 'home',
        'context_hash' => 'abc',
        'created_at' => now(),
    ]);

    $exitCode = Artisan::call('chatbot:export-user', ['id' => 3]);
    expect($exitCode)->toBe(0);

    $json = json_decode(Artisan::output(), true);

    expect($json['format'])->toBe('chatbot-export@1')
        ->and($json['user_id'])->toBe(3)
        ->and($json)->toHaveKey('exported_at')
        ->and($json['conversations'])->toHaveCount(1)
        ->and($json['conversations'][0]['messages'][0]['content'])->toBe('Hello');
});

// --- Slice 2: CSV format ---

it('outputs CSV when --format=csv is passed', function (): void {
    $conv = Conversation::create(['channel' => 'default', 'user_id' => 4]);
    Message::create([
        'conversation_id' => $conv->id,
        'role' => 'assistant',
        'content' => 'Hi there',
        'route_name' => 'home',
        'context_hash' => 'def',
        'created_at' => now(),
    ]);

    $this->artisan('chatbot:export-user', ['id' => 4, '--format' => 'csv'])
        ->assertExitCode(0)
        ->expectsOutputToContain('conversation_id')
        ->expectsOutputToContain('Hi there');
});
