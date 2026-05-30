<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Persistence;

final readonly class ConversationWithMessages
{
    /**
     * @param  MessageRecord[]  $messages
     */
    public function __construct(
        public string $uuid,
        public ?int $userId,
        public ?string $guestToken,
        public array $messages,
    ) {}
}
