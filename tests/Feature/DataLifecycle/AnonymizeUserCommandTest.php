<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Models\Conversation;
use Aanfarhan\Chatbot\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// --- Slice 1: clears user_id and message contents ---

it('clears user_id and message contents, preserves token aggregates', function (): void {
    $conv = Conversation::create([
        'channel' => 'default',
        'user_id' => 15,
        'input_tokens' => 100,
        'output_tokens' => 200,
        'cost_cents' => 50,
    ]);

    Message::create([
        'conversation_id' => $conv->id,
        'role' => 'user',
        'content' => 'My secret message',
        'route_name' => 'home',
        'context_hash' => 'abc',
        'created_at' => now(),
    ]);

    $this->artisan('chatbot:anonymize-user', ['id' => 15])->assertExitCode(0);

    $conv->refresh();
    expect($conv->user_id)->toBeNull()
        ->and($conv->input_tokens)->toBe(100)
        ->and($conv->output_tokens)->toBe(200)
        ->and($conv->cost_cents)->toBe(50);

    $message = Message::where('conversation_id', $conv->id)->first();
    expect($message->content)->toBe('[redacted]');
});
