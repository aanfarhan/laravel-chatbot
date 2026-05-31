<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot;

use Aanfarhan\Chatbot\Exceptions\ChatbotTokenCapExceededException;

final class TokenCounter
{
    /**
     * @param  list<array<string, mixed>>  $messages
     */
    public function count(array $messages): int
    {
        return array_sum(array_map(
            // A tool-call assistant turn carries null content (the call rides in
            // tool_calls); treat any non-string content as contributing nothing.
            fn (array $m): int => (int) ceil(mb_strlen(is_string($m['content'] ?? null) ? $m['content'] : '') / 4),
            $messages,
        ));
    }

    /**
     * Prunes oldest non-system history turns until the assembled messages fit
     * within $cap tokens. Raises ChatbotTokenCapExceededException if even a
     * single user+assistant turn pair alone exceeds the cap.
     *
     * @param  list<array<string, mixed>>  $messages
     * @return list<array<string, mixed>>
     */
    public function prune(array $messages, int $cap): array
    {
        if ($this->count($messages) <= $cap) {
            return $messages;
        }

        // Separate system prompt, history turns, and the final user message.
        $system = array_filter($messages, fn (array $m): bool => $m['role'] === 'system');
        $rest = array_values(array_filter($messages, fn (array $m): bool => $m['role'] !== 'system'));

        // Last element is always the current user message; everything before is history.
        $current = array_pop($rest);

        if ($current === null) {
            return array_values($system);
        }

        $history = $rest; // alternating assistant/user pairs

        while ($history !== [] && $this->count([...$system, ...$history, $current]) > $cap) {
            $this->shiftOldestBlock($history); // remove oldest turn (whole tool block if any)
        }

        $candidate = [...array_values($system), ...$history, $current];

        if ($this->count($candidate) > $cap) {
            throw new ChatbotTokenCapExceededException(
                'Prompt exceeds token cap even after pruning all history.',
            );
        }

        return $candidate;
    }

    /**
     * Removes the oldest history block in place. A plain user/assistant turn is a
     * single-message block. An assistant tool-call message forms one indivisible
     * block with all of the `tool` result messages that immediately follow it, so
     * trimming never orphans a tool result from its originating call.
     *
     * @param  list<array<string, mixed>>  $history
     */
    private function shiftOldestBlock(array &$history): void
    {
        $first = array_shift($history);

        if ($first === null) {
            return;
        }

        $isToolCall = ($first['role'] ?? null) === 'assistant' && isset($first['tool_calls']);

        if (! $isToolCall) {
            return;
        }

        while ($history !== [] && ($history[0]['role'] ?? null) === 'tool') {
            array_shift($history);
        }
    }
}
