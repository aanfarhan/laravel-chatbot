<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tools;

use Aanfarhan\Chatbot\Contracts\ToolInvocationStore;
use Aanfarhan\Chatbot\Persistence\ToolInvocationRecord;

final class ToolInvocationReplay
{
    public function __construct(
        private readonly ToolInvocationStore $store,
        private readonly ToolRegistry $registry,
        private readonly ToolArgumentValidator $validator,
    ) {}

    /**
     * @return list<array<string, mixed>>
     */
    public function buildHistory(int $conversationId, int $windowSeconds): array
    {
        $messages = [];

        foreach ($this->buildTimedHistory($conversationId, $windowSeconds) as $entry) {
            $messages[] = $entry['messages'][0];
            $messages[] = $entry['messages'][1];
        }

        return $messages;
    }

    /**
     * Same filtering as buildHistory(), but each surviving pair is tagged with
     * the invocation's finished_at so callers can interleave tool replay with
     * plain conversational turns in chronological order.
     *
     * @return list<array{at: \DateTimeInterface, messages: array{0: array<string, mixed>, 1: array<string, mixed>}}>
     */
    public function buildTimedHistory(int $conversationId, int $windowSeconds): array
    {
        $entries = [];

        foreach ($this->store->freshFor($conversationId, $windowSeconds) as $record) {
            $pair = $this->toMessagePair($record);
            if ($pair === null) {
                continue;
            }

            $entries[] = ['at' => $record->finishedAt, 'messages' => $pair];
        }

        return $entries;
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
