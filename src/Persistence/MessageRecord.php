<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Persistence;

final readonly class MessageRecord
{
    public function __construct(
        public int $id,
        public int $conversationId,
        public string $role,
        public string $content,
        public string $routeName,
        public string $contextHash,
        public int $inputTokens,
        public int $outputTokens,
        public int $costCents,
        /** @var array<string, mixed>|null */
        public ?array $error,
        public \DateTimeInterface $createdAt,
    ) {}
}
