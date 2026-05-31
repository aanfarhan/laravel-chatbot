<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot;

use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Contracts\ToolInvocationStore;
use Aanfarhan\Chatbot\Persistence\ConversationRecord;
use Aanfarhan\Chatbot\Persistence\ToolInvocationRecord;
use Aanfarhan\Chatbot\Tools\ToolArgumentValidator;
use Aanfarhan\Chatbot\Tools\ToolRegistry;

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
        private readonly ToolInvocationStore $invocations,
        private readonly ToolRegistry $registry,
        private readonly ToolArgumentValidator $validator,
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

        foreach ($this->invocations->freshFor($conversation->id, $freshnessWindow) as $record) {
            $pair = $this->toMessagePair($record);
            if ($pair === null) {
                continue;
            }

            $entries[] = ['at' => $record->finishedAt, 'messages' => $pair];
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

    /**
     * @return array{0: array<string, mixed>, 1: array<string, mixed>}|null
     */
    private function toMessagePair(ToolInvocationRecord $record): ?array
    {
        $tool = $this->registry->resolve($record->toolName);
        if ($tool === null) {
            return null;
        }

        if (! $this->validator->validate($tool->parameters(), $record->arguments)) {
            return null;
        }

        $callId = "replay_{$record->id}";

        $assistant = [
            'role' => 'assistant',
            'content' => null,
            'tool_calls' => [
                [
                    'id' => $callId,
                    'type' => 'function',
                    'function' => [
                        'name' => $record->toolName,
                        'arguments' => json_encode($record->arguments, JSON_THROW_ON_ERROR),
                    ],
                ],
            ],
        ];

        $toolResult = [
            'role' => 'tool',
            'tool_call_id' => $callId,
            'name' => $record->toolName,
            'content' => $record->result,
        ];

        return [$assistant, $toolResult];
    }
}
