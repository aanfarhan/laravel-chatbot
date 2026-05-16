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
        $rawGlobal = config('chatbot.retention_days');
        $globalDays = is_int($rawGlobal) ? $rawGlobal : (is_null($rawGlobal) ? null : 30);
        $channels = (array) config('chatbot.channels', []);

        $deleted = 0;

        /** @var array<string, int|null> $channelRetention */
        $channelRetention = [];
        foreach ($channels as $name => $cfg) {
            if (! is_string($name)) {
                continue;
            }
            $cfgArray = is_array($cfg) ? $cfg : [];
            if (array_key_exists('retention_days', $cfgArray)) {
                $rawDays = $cfgArray['retention_days'];
                $channelRetention[$name] = is_int($rawDays) ? $rawDays : (is_null($rawDays) ? null : $globalDays);
            } else {
                $channelRetention[$name] = $globalDays;
            }
        }

        $allChannels = Conversation::withTrashed()
            ->distinct()
            ->pluck('channel')
            ->all();

        foreach ($allChannels as $channel) {
            if (! is_string($channel)) {
                continue;
            }

            $days = array_key_exists($channel, $channelRetention) ? $channelRetention[$channel] : $globalDays;

            if ($days === null) {
                continue;
            }

            $query = Conversation::withTrashed()->where('channel', $channel);

            if ($days === 0) {
                $rawTtl = config('chatbot.conversation_ttl');
                $ttl = is_int($rawTtl) ? $rawTtl : 86400;
                $query->where('last_message_at', '<', now()->subSeconds($ttl));
            } else {
                $query->where('last_message_at', '<', now()->subDays($days));
            }

            $count = $query->forceDelete();
            $deleted += is_int($count) ? $count : 0;
        }

        $this->info("Pruned {$deleted} conversation(s).");

        return self::SUCCESS;
    }
}
