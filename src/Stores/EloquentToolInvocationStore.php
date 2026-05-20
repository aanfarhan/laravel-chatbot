<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Stores;

use Aanfarhan\Chatbot\Contracts\ToolInvocationStore;
use Aanfarhan\Chatbot\Models\ToolInvocationLog;
use Aanfarhan\Chatbot\Persistence\ToolInvocationRecord;

final class EloquentToolInvocationStore implements ToolInvocationStore
{
    /**
     * @param  array<string, mixed>  $arguments
     */
    public function record(
        int $conversationId,
        ?int $messageId,
        string $toolName,
        array $arguments,
        string $result,
        string $status,
        ?string $error,
        \DateTimeInterface $startedAt,
        \DateTimeInterface $finishedAt,
        bool $overran = false,
    ): ToolInvocationRecord {
        $log = ToolInvocationLog::create([
            'conversation_id' => $conversationId,
            'message_id' => $messageId,
            'tool_name' => $toolName,
            'arguments' => $arguments,
            'result' => $result,
            'status' => $status,
            'overran' => $overran,
            'error' => $error,
            'started_at' => $startedAt,
            'finished_at' => $finishedAt,
        ]);

        return $this->toRecord($log);
    }

    /** @return list<ToolInvocationRecord> */
    public function freshFor(int $conversationId, int $windowSeconds): array
    {
        return array_values(
            ToolInvocationLog::where('conversation_id', $conversationId)
                ->where('finished_at', '>=', now()->subSeconds($windowSeconds))
                ->orderBy('finished_at')
                ->get()
                ->map(fn (ToolInvocationLog $log): ToolInvocationRecord => $this->toRecord($log))
                ->all(),
        );
    }

    private function toRecord(ToolInvocationLog $log): ToolInvocationRecord
    {
        return new ToolInvocationRecord(
            id: $log->id,
            conversationId: $log->conversation_id,
            messageId: $log->message_id,
            toolName: $log->tool_name,
            arguments: $log->arguments ?? [],
            result: $log->result,
            status: $log->status,
            overran: $log->overran,
            error: $log->error,
            startedAt: $log->started_at,
            finishedAt: $log->finished_at,
        );
    }
}
