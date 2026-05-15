<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\DailyUsageTracker;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns zeros when there are no messages today', function (): void {
    $tracker = new DailyUsageTracker;

    $totals = $tracker->totalsToday(userId: 1, channel: 'default');

    expect($totals['input'])->toBe(0)
        ->and($totals['output'])->toBe(0);
});

it('sums input and output tokens from today\'s messages for the matching user+channel', function (): void {
    $convId = \DB::table('chatbot_conversations')->insertGetId([
        'channel' => 'default',
        'user_id' => 42,
        'guest_token' => null,
        'input_tokens' => 0,
        'output_tokens' => 0,
        'cost_cents' => 0,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    \DB::table('chatbot_messages')->insert([
        ['conversation_id' => $convId, 'role' => 'user',      'content' => 'hi',    'route_name' => '', 'context_hash' => '', 'input_tokens' => 1000, 'output_tokens' => 0,   'cost_cents' => 0, 'error' => null, 'created_at' => now()],
        ['conversation_id' => $convId, 'role' => 'assistant', 'content' => 'hello', 'route_name' => '', 'context_hash' => '', 'input_tokens' => 1000, 'output_tokens' => 300, 'cost_cents' => 0, 'error' => null, 'created_at' => now()],
    ]);

    $tracker = new DailyUsageTracker;
    $totals = $tracker->totalsToday(userId: 42, channel: 'default');

    expect($totals['input'])->toBe(2000)
        ->and($totals['output'])->toBe(300);
});

it('excludes messages from a different channel', function (): void {
    $convId = \DB::table('chatbot_conversations')->insertGetId([
        'channel' => 'admin',
        'user_id' => 42,
        'guest_token' => null,
        'input_tokens' => 0,
        'output_tokens' => 0,
        'cost_cents' => 0,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    \DB::table('chatbot_messages')->insert([
        ['conversation_id' => $convId, 'role' => 'assistant', 'content' => 'x', 'route_name' => '', 'context_hash' => '', 'input_tokens' => 5000, 'output_tokens' => 1000, 'cost_cents' => 0, 'error' => null, 'created_at' => now()],
    ]);

    $tracker = new DailyUsageTracker;
    $totals = $tracker->totalsToday(userId: 42, channel: 'default');

    expect($totals['input'])->toBe(0);
});

it('excludes messages from yesterday (UTC midnight boundary)', function (): void {
    $convId = \DB::table('chatbot_conversations')->insertGetId([
        'channel' => 'default',
        'user_id' => 7,
        'guest_token' => null,
        'input_tokens' => 0,
        'output_tokens' => 0,
        'cost_cents' => 0,
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    \DB::table('chatbot_messages')->insert([
        ['conversation_id' => $convId, 'role' => 'assistant', 'content' => 'x', 'route_name' => '', 'context_hash' => '', 'input_tokens' => 9999, 'output_tokens' => 9999, 'cost_cents' => 0, 'error' => null, 'created_at' => now()->utc()->subDay()],
    ]);

    $tracker = new DailyUsageTracker;
    $totals = $tracker->totalsToday(userId: 7, channel: 'default');

    expect($totals['input'])->toBe(0)
        ->and($totals['output'])->toBe(0);
});
