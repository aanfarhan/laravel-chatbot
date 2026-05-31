<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Persistence;

trait HasOwnership
{
    public function ownedBy(?string $userId, ?string $guestToken): bool
    {
        return match (true) {
            $this->userId !== null => $userId !== null && (int) $userId === $this->userId,
            $this->guestToken !== null => $guestToken !== null && $guestToken === $this->guestToken,
            default => false,
        };
    }
}
