<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Contracts;

use Aanfarhan\Chatbot\Persistence\ToolInvocationRecord;

interface ToolInvocationStore
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
    ): ToolInvocationRecord;

    /**
     * Returns invocations whose finished_at is within $windowSeconds of now, ordered oldest-first.
     *
     * @return list<ToolInvocationRecord>
     */
    public function freshFor(int $conversationId, int $windowSeconds): array;
}
