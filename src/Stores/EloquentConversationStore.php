<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Stores;

use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Models\Conversation;
use Aanfarhan\Chatbot\Models\Message;
use Aanfarhan\Chatbot\Persistence\ConversationRecord;
use Aanfarhan\Chatbot\Persistence\ConversationWithMessages;
use Aanfarhan\Chatbot\Persistence\MessageRecord;

final class EloquentConversationStore implements ConversationStore
{
    public function start(string $channel, ?int $userId, ?string $guestToken): ConversationRecord
    {
        $conversation = Conversation::create([
            'channel' => $channel,
            'user_id' => $userId,
            'guest_token' => $guestToken,
        ]);

        return $this->toRecord($conversation);
    }

    public function findByUuid(string $uuid): ?ConversationRecord
    {
        $conversation = Conversation::where('uuid', $uuid)->first();

        return $conversation ? $this->toRecord($conversation) : null;
    }

    public function findByUuidWithMessages(string $uuid): ?ConversationWithMessages
    {
        $conversation = Conversation::with('messages')->where('uuid', $uuid)->first();

        if ($conversation === null) {
            return null;
        }

        return new ConversationWithMessages(
            uuid: $conversation->uuid,
            userId: $conversation->user_id,
            guestToken: $conversation->guest_token,
            messages: $conversation->messages
                ->map(fn (Message $m): MessageRecord => $this->toMessageRecord($m))
                ->all(),
        );
    }

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
    ): MessageRecord {
        $message = Message::create([
            'conversation_id' => $conversationId,
            'role' => $role,
            'content' => $content,
            'route_name' => $routeName,
            'context_hash' => $contextHash,
            'input_tokens' => $inputTokens,
            'output_tokens' => $outputTokens,
            'cost_cents' => $costCents,
            'error' => $error,
            'created_at' => now(),
        ]);

        Conversation::where('id', $conversationId)->update([
            'last_message_at' => now(),
            'input_tokens' => \DB::raw("input_tokens + {$inputTokens}"),
            'output_tokens' => \DB::raw("output_tokens + {$outputTokens}"),
            'cost_cents' => \DB::raw("cost_cents + {$costCents}"),
        ]);

        return $this->toMessageRecord($message);
    }

    /** @return ConversationRecord[] */
    public function forUser(int $userId): array
    {
        return Conversation::where('user_id', $userId)
            ->get()
            ->map(fn (Conversation $c): ConversationRecord => $this->toRecord($c))
            ->all();
    }

    public function delete(int $id): void
    {
        Conversation::where('id', $id)->delete();
    }

    public function anonymize(int $id): void
    {
        Conversation::where('id', $id)->update([
            'user_id' => null,
            'guest_token' => null,
        ]);
    }

    /** @return array<string, mixed> */
    public function export(int $id): array
    {
        $conversation = Conversation::with('messages')->findOrFail($id);

        return [
            'id' => $conversation->id,
            'channel' => $conversation->channel,
            'messages' => $conversation->messages->map(fn (Message $m): array => [
                'role' => $m->role,
                'content' => $m->content,
                'created_at' => $m->created_at->toIso8601String(),
            ])->all(),
        ];
    }

    private function toRecord(Conversation $conversation): ConversationRecord
    {
        return new ConversationRecord(
            id: $conversation->id,
            uuid: $conversation->uuid,
            channel: $conversation->channel,
            userId: $conversation->user_id,
            guestToken: $conversation->guest_token,
            inputTokens: (int) $conversation->input_tokens,
            outputTokens: (int) $conversation->output_tokens,
            costCents: (int) $conversation->cost_cents,
            lastMessageAt: $conversation->last_message_at,
        );
    }

    private function toMessageRecord(Message $message): MessageRecord
    {
        return new MessageRecord(
            id: $message->id,
            conversationId: $message->conversation_id,
            role: $message->role,
            content: $message->content,
            routeName: $message->route_name,
            contextHash: $message->context_hash,
            inputTokens: $message->input_tokens,
            outputTokens: $message->output_tokens,
            costCents: $message->cost_cents,
            error: $message->error,
            createdAt: $message->created_at,
        );
    }
}
