<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Exceptions\ChatbotTokenCapExceededException;
use Aanfarhan\Chatbot\TokenCounter;

it('counts tokens across all messages using character estimate', function (): void {
    $counter = new TokenCounter;

    $messages = [
        ['role' => 'system', 'content' => 'You are helpful.'],   // ~4 tokens (16 chars)
        ['role' => 'user', 'content' => 'Hello there!'],          // ~3 tokens (12 chars)
    ];

    expect($counter->count($messages))->toBeGreaterThan(0);
});

it('prune() removes oldest history turns until the messages fit within the cap', function (): void {
    $counter = new TokenCounter;

    // Each message content is 40 chars → 10 tokens each.
    // system=10, old-user=10, old-assistant=10, new-user=10 → total 40.
    // Cap at 25 → must drop old-user + old-assistant to get to 20 tokens.
    $fortyCh = str_repeat('a', 40);
    $messages = [
        ['role' => 'system',    'content' => $fortyCh],
        ['role' => 'user',      'content' => $fortyCh], // oldest history turn
        ['role' => 'assistant', 'content' => $fortyCh], // oldest history turn
        ['role' => 'user',      'content' => $fortyCh], // current message
    ];

    $pruned = $counter->prune($messages, cap: 25);

    expect($pruned)->toHaveCount(2) // system + current user
        ->and($pruned[0]['role'])->toBe('system')
        ->and($pruned[1]['role'])->toBe('user');
});

it('prune() throws ChatbotTokenCapExceededException when the current user message alone exceeds the cap', function (): void {
    $counter = new TokenCounter;

    // Current user message = 200 chars → 50 tokens. Cap = 10.
    $messages = [
        ['role' => 'user', 'content' => str_repeat('a', 200)],
    ];

    expect(fn () => $counter->prune($messages, cap: 10))
        ->toThrow(ChatbotTokenCapExceededException::class);
});
