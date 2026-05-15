<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Console;

use Aanfarhan\Chatbot\Models\Conversation;
use Illuminate\Console\Command;

final class PruneCommand extends Command
{
    protected $signature = 'chatbot:prune';

    protected $description = 'Hard-delete conversations past their per-channel retention window.';

    public function handle(): int
    {
        $globalDays = config('chatbot.retention_days', 30);
        $channels = (array) config('chatbot.channels', []);

        $deleted = 0;

        $channelRetention = [];
        foreach ($channels as $name => $cfg) {
            $channelRetention[$name] = array_key_exists('retention_days', (array) $cfg)
                ? $cfg['retention_days']
                : $globalDays;
        }

        $allChannels = Conversation::withTrashed()
            ->distinct()
            ->pluck('channel')
            ->all();

        foreach ($allChannels as $channel) {
            $days = array_key_exists($channel, $channelRetention) ? $channelRetention[$channel] : $globalDays;

            if ($days === null) {
                continue;
            }

            $query = Conversation::withTrashed()->where('channel', $channel);

            if ($days === 0) {
                $ttl = (int) config('chatbot.conversation_ttl', 86400);
                $query->where('last_message_at', '<', now()->subSeconds($ttl));
            } else {
                $query->where('last_message_at', '<', now()->subDays($days));
            }

            $deleted += $query->forceDelete();
        }

        $this->info("Pruned {$deleted} conversation(s).");

        return self::SUCCESS;
    }
}
