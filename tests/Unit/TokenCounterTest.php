<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Exceptions\ChatbotTokenCapExceededException;
use Aanfarhan\Chatbot\TokenCounter;

/**
 * Asserts every `tool` message in the pruned prompt is preceded by an assistant
 * `tool_call` carrying its `tool_call_id` — i.e. no orphaned tool results.
 *
 * @param  list<array<string, mixed>>  $messages
 */
function assertNoOrphanToolMessages(array $messages): void
{
    $seenCallIds = [];

    foreach ($messages as $m) {
        if (($m['role'] ?? null) === 'assistant') {
            foreach ($m['tool_calls'] ?? [] as $tc) {
                $seenCallIds[$tc['id']] = true;
            }
        }

        if (($m['role'] ?? null) === 'tool') {
            expect($seenCallIds)->toHaveKey($m['tool_call_id']);
        }
    }
}

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

it('prune() drops a batched tool turn as a whole, never orphaning a tool result', function (): void {
    $counter = new TokenCounter;

    $ten = str_repeat('a', 40); // 40 chars → 10 tokens

    // One assistant call fanning out to two tool results.
    // Total 40 tokens; cap 30. Pair-unaware pruning would stop after dropping the
    // call + first result, leaving the second result orphaned.
    $messages = [
        ['role' => 'system', 'content' => $ten],
        ['role' => 'assistant', 'content' => null, 'tool_calls' => [
            ['id' => 'c1', 'type' => 'function', 'function' => ['name' => 'lookup', 'arguments' => '{}']],
        ]],
        ['role' => 'tool', 'tool_call_id' => 'c1', 'name' => 'lookup', 'content' => $ten],
        ['role' => 'tool', 'tool_call_id' => 'c1', 'name' => 'lookup', 'content' => $ten],
        ['role' => 'user', 'content' => $ten], // current
    ];

    $pruned = $counter->prune($messages, cap: 30);

    assertNoOrphanToolMessages($pruned);
    expect($counter->count($pruned))->toBeLessThanOrEqual(30);
});

it('prune() drops the oldest tool block whole, leaving the newer block intact and in order', function (): void {
    $counter = new TokenCounter;

    $ten = str_repeat('a', 40); // 10 tokens

    // system + two tool blocks + current = 40 tokens; cap 30 drops only the oldest block.
    $messages = [
        ['role' => 'system', 'content' => $ten],
        ['role' => 'assistant', 'content' => null, 'tool_calls' => [
            ['id' => 'old', 'type' => 'function', 'function' => ['name' => 'lookup', 'arguments' => '{}']],
        ]],
        ['role' => 'tool', 'tool_call_id' => 'old', 'name' => 'lookup', 'content' => $ten],
        ['role' => 'assistant', 'content' => null, 'tool_calls' => [
            ['id' => 'new', 'type' => 'function', 'function' => ['name' => 'lookup', 'arguments' => '{}']],
        ]],
        ['role' => 'tool', 'tool_call_id' => 'new', 'name' => 'lookup', 'content' => $ten],
        ['role' => 'user', 'content' => $ten], // current
    ];

    $pruned = $counter->prune($messages, cap: 30);

    assertNoOrphanToolMessages($pruned);
    expect($pruned)->toHaveCount(4) // system + newer block (call+result) + current
        ->and($pruned[0]['role'])->toBe('system')
        ->and($pruned[1]['tool_calls'][0]['id'])->toBe('new') // oldest block gone
        ->and($pruned[2]['tool_call_id'])->toBe('new')        // result still paired & ordered
        ->and($pruned[3]['role'])->toBe('user');
});

it('prune() drops a single tool pair whole rather than orphaning its result', function (): void {
    $counter = new TokenCounter;

    $ten = str_repeat('a', 40); // 10 tokens

    $messages = [
        ['role' => 'system', 'content' => $ten],
        ['role' => 'assistant', 'content' => null, 'tool_calls' => [
            ['id' => 'c1', 'type' => 'function', 'function' => ['name' => 'lookup', 'arguments' => '{}']],
        ]],
        ['role' => 'tool', 'tool_call_id' => 'c1', 'name' => 'lookup', 'content' => $ten],
        ['role' => 'user', 'content' => $ten], // current
    ];

    $pruned = $counter->prune($messages, cap: 20);

    assertNoOrphanToolMessages($pruned);
    expect($pruned)->toHaveCount(2)
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
