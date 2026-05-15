<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Console;

use Aanfarhan\Chatbot\Models\Conversation;
use Aanfarhan\Chatbot\Models\Message;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Collection;

final class ExportUserCommand extends Command
{
    protected $signature = 'chatbot:export-user
        {id : The user ID to export data for}
        {--format=json : Output format (json|csv)}';

    protected $description = 'Export chatbot data for a user as versioned JSON or CSV.';

    public function handle(): int
    {
        $userId = (int) $this->argument('id');
        $format = $this->option('format');

        $conversations = Conversation::with('messages')
            ->where('user_id', $userId)
            ->get();

        if ($format === 'csv') {
            $this->outputCsv($userId, $conversations);
        } else {
            $this->outputJson($userId, $conversations);
        }

        return self::SUCCESS;
    }

    /** @param Collection<int, Conversation> $conversations */
    private function outputJson(int $userId, $conversations): void
    {
        $data = [
            'format' => 'chatbot-export@1',
            'user_id' => $userId,
            'exported_at' => now()->toIso8601String(),
            'conversations' => $conversations->map(fn (Conversation $c): array => [
                'id' => $c->id,
                'channel' => $c->channel,
                'messages' => $c->messages->map(fn (Message $m): array => [
                    'role' => $m->role,
                    'content' => $m->content,
                    'created_at' => $m->created_at->toIso8601String(),
                ])->all(),
            ])->all(),
        ];

        $this->line(json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    /** @param Collection<int, Conversation> $conversations */
    private function outputCsv(int $userId, $conversations): void
    {
        $this->line('conversation_id,channel,role,content,created_at');

        foreach ($conversations as $conversation) {
            foreach ($conversation->messages as $message) {
                $this->line(implode(',', [
                    $conversation->id,
                    $conversation->channel,
                    $message->role,
                    '"'.str_replace('"', '""', $message->content).'"',
                    $message->created_at->toIso8601String(),
                ]));
            }
        }
    }
}
