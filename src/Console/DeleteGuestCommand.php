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
        $rawToken = $this->argument('token');
        $token = is_string($rawToken) ? $rawToken : '';
        $hard = (bool) $this->option('hard');

        $query = Conversation::where('guest_token', $token);

        $result = $hard ? $query->forceDelete() : $query->delete();
        $count = is_int($result) ? $result : 0;

        $action = $hard ? 'Hard-deleted' : 'Soft-deleted';
        $this->info("{$action} {$count} conversation(s) for guest token {$token}.");

        return self::SUCCESS;
    }
}
