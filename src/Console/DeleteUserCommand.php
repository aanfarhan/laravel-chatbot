<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Console;

use Aanfarhan\Chatbot\Models\Conversation;
use Illuminate\Console\Command;

final class DeleteUserCommand extends Command
{
    protected $signature = 'chatbot:delete-user
        {id : The user ID to delete data for}
        {--hard : Hard-delete (GDPR erasure) instead of soft-delete}
        {--channel= : Restrict to a specific channel}';

    protected $description = 'Delete chatbot conversations for a user (soft-delete by default).';

    public function handle(): int
    {
        $userId = (int) $this->argument('id');
        $hard = (bool) $this->option('hard');
        $channel = $this->option('channel');

        $query = Conversation::where('user_id', $userId);

        if ($channel !== null) {
            $query->where('channel', $channel);
        }

        $result = $hard ? $query->forceDelete() : $query->delete();
        $count = is_int($result) ? $result : 0;

        $action = $hard ? 'Hard-deleted' : 'Soft-deleted';
        $this->info("{$action} {$count} conversation(s) for user {$userId}.");

        return self::SUCCESS;
    }
}
