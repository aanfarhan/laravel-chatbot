<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Console;

use Aanfarhan\Chatbot\Models\Conversation;
use Illuminate\Console\Command;

final class DeleteGuestCommand extends Command
{
    protected $signature = 'chatbot:delete-guest
        {token : The guest token to delete data for}
        {--hard : Hard-delete instead of soft-delete}';

    protected $description = 'Delete chatbot conversations for a guest token (soft-delete by default).';

    public function handle(): int
    {
        $token = (string) $this->argument('token');
        $hard = (bool) $this->option('hard');

        $query = Conversation::where('guest_token', $token);

        $count = $hard ? $query->forceDelete() : $query->delete();

        $action = $hard ? 'Hard-deleted' : 'Soft-deleted';
        $this->info("{$action} {$count} conversation(s) for guest token {$token}.");

        return self::SUCCESS;
    }
}
