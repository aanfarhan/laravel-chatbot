<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Persistence;

final readonly class ToolInvocationRecord
{
    /**
     * @param  array<string, mixed>  $arguments
     */
    public function __construct(
        public int $id,
        public int $conversationId,
        public ?int $messageId,
        public string $toolName,
        public array $arguments,
        public string $result,
        public string $status,
        public ?string $error,
        public \DateTimeInterface $startedAt,
        public \DateTimeInterface $finishedAt,
    ) {}
}
