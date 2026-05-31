<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Persistence;

final readonly class ConversationRecord
{
    use HasOwnership;

    public function __construct(
        public int $id,
        public string $uuid,
        public string $channel,
        public ?int $userId,
        public ?string $guestToken,
        public int $inputTokens,
        public int $outputTokens,
        public int $costCents,
        public ?\DateTimeInterface $lastMessageAt,
    ) {}
}
