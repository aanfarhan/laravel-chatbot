<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot;

use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Persistence\ConversationRecord;
use Aanfarhan\Chatbot\Tools\ToolInvocationReplay;

/**
 * Reconstructs the prompt history for a resolved conversation: prior
 * user/assistant turns loaded from the store, interleaved chronologically with
 * the tool call/result pairs that are still within the freshness window, ready
 * to be inserted between the system prompt and the current user message.
 */
final class ConversationReplay
{
    public function __construct(
        private readonly ConversationStore $conversations,
        private readonly ToolInvocationReplay $toolReplay,
    ) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function historyFor(ConversationRecord $conversation, int $freshnessWindow): array
    {
        $loaded = $this->conversations->findByUuidWithMessages($conversation->uuid);

        if ($loaded === null) {
            return [];
        }

        /** @var list<array{at: \DateTimeInterface, messages: list<array<string, mixed>>}> $entries */
        $entries = [];

        foreach ($loaded->messages as $message) {
            // A tool-only assistant turn persists with empty prose; its tool
            // call/result pair carries it instead, so drop it here to avoid a
            // duplicate, content-free turn in the transcript.
            if ($message->role === 'assistant' && $message->content === '') {
                continue;
            }

            $entries[] = [
                'at' => $message->createdAt,
                'messages' => [['role' => $message->role, 'content' => $message->content]],
            ];
        }

        foreach ($this->toolReplay->buildTimedHistory($conversation->id, $freshnessWindow) as $pair) {
            $entries[] = [
                'at' => $pair['at'],
                'messages' => [$pair['messages'][0], $pair['messages'][1]],
            ];
        }

        // Stable sort keeps the call/result pair adjacent and, on a timestamp
        // tie, preserves the order the two sources were appended above.
        usort($entries, fn (array $a, array $b): int => $a['at'] <=> $b['at']);

        $history = [];
        foreach ($entries as $entry) {
            foreach ($entry['messages'] as $message) {
                $history[] = $message;
            }
        }

        return $history;
    }
}
