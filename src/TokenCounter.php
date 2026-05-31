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
            array_shift($history); // remove oldest turn
        }

        $candidate = [...array_values($system), ...$history, $current];

        if ($this->count($candidate) > $cap) {
            throw new ChatbotTokenCapExceededException(
                'Prompt exceeds token cap even after pruning all history.',
            );
        }

        return $candidate;
    }
}
