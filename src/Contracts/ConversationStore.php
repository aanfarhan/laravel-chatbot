<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Contracts;

use Aanfarhan\Chatbot\Persistence\ConversationRecord;
use Aanfarhan\Chatbot\Persistence\MessageRecord;

interface ConversationStore
{
    public function start(string $channel, ?int $userId, ?string $guestToken): ConversationRecord;

    public function find(int $id): ?ConversationRecord;

    /**
     * @param  array<string, mixed>|null  $error
     */
    public function append(
        int $conversationId,
        string $role,
        string $content,
        string $routeName,
        string $contextHash,
        int $inputTokens = 0,
        int $outputTokens = 0,
        int $costCents = 0,
        ?array $error = null,
    ): MessageRecord;

    /** @return ConversationRecord[] */
    public function forUser(int $userId): array;

    public function delete(int $id): void;

    public function anonymize(int $id): void;

    /** @return array<string, mixed> */
    public function export(int $id): array;
}
