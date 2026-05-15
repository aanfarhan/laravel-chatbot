<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Console;

use Aanfarhan\Chatbot\Models\Conversation;
use Aanfarhan\Chatbot\Models\Message;
use Illuminate\Console\Command;

final class AnonymizeUserCommand extends Command
{
    protected $signature = 'chatbot:anonymize-user {id : The user ID to anonymize}';

    protected $description = 'Scrub user identity from conversations; preserve token/cost aggregates.';

    public function handle(): int
    {
        $userId = (int) $this->argument('id');

        $conversationIds = Conversation::where('user_id', $userId)->pluck('id');

        Conversation::whereIn('id', $conversationIds)->update(['user_id' => null, 'guest_token' => null]);

        Message::whereIn('conversation_id', $conversationIds)->update(['content' => '[redacted]']);

        $this->info("Anonymized {$conversationIds->count()} conversation(s) for user {$userId}.");

        return self::SUCCESS;
    }
}
