<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Concerns;

use Aanfarhan\Chatbot\Models\Conversation;
use Aanfarhan\Chatbot\Models\Message;
use Illuminate\Database\Eloquent\Relations\HasMany;

trait HasChatbotData
{
    public function chatbotConversations(): HasMany
    {
        return $this->hasMany(Conversation::class, 'user_id');
    }

    public function deleteChatbotData(bool $hard = false): void
    {
        $query = Conversation::where('user_id', $this->getKey());

        if ($hard) {
            $query->forceDelete();
        } else {
            $query->delete();
        }
    }

    /** @return array<string, mixed> */
    public function exportChatbotData(): array
    {
        $conversations = Conversation::with('messages')
            ->where('user_id', $this->getKey())
            ->get();

        return [
            'format' => 'chatbot-export@1',
            'user_id' => $this->getKey(),
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
    }
}
