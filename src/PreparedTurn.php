<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot;

use Aanfarhan\Chatbot\Persistence\ConversationRecord;
use Illuminate\Contracts\Auth\Authenticatable;

final readonly class PreparedTurn
{
    public function __construct(
        /** @var list<array<string, mixed>> */
        public array $messages,
        public ConversationRecord $conversation,
        public string $contextHash,
        public ?string $model,
        public ?Authenticatable $actor,
        public ?string $guestToken,
    ) {}
}
