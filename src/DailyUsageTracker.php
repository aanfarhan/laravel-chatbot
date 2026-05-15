<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot;

use Illuminate\Support\Facades\DB;

final class DailyUsageTracker
{
    /**
     * Returns today's (UTC) total input and output tokens for a user+channel pair.
     *
     * @return array{input: int, output: int}
     */
    public function totalsToday(int $userId, string $channel): array
    {
        $row = DB::table('chatbot_messages')
            ->join('chatbot_conversations', 'chatbot_conversations.id', '=', 'chatbot_messages.conversation_id')
            ->where('chatbot_conversations.user_id', $userId)
            ->where('chatbot_conversations.channel', $channel)
            ->whereDate('chatbot_messages.created_at', now()->utc()->toDateString())
            ->selectRaw('COALESCE(SUM(chatbot_messages.input_tokens), 0) as input_total')
            ->selectRaw('COALESCE(SUM(chatbot_messages.output_tokens), 0) as output_total')
            ->first();

        return [
            'input' => (int) ($row->input_total ?? 0),
            'output' => (int) ($row->output_total ?? 0),
        ];
    }
}
