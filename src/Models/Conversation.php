<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $uuid
 * @property string $channel
 * @property int|null $user_id
 * @property string|null $guest_token
 * @property int $input_tokens
 * @property int $output_tokens
 * @property int $cost_cents
 * @property Carbon|null $last_message_at
 * @property Carbon|null $deleted_at
 * @property Carbon $created_at
 * @property Carbon $updated_at
 */
final class Conversation extends Model
{
    use SoftDeletes;

    protected $table = 'chatbot_conversations';

    protected $guarded = [];

    protected static function booted(): void
    {
        // The uuid is the only conversation identifier exposed to the client.
        // Mint it authoritatively on create so it is never settable from a
        // request or from start() arguments. See ADR-0008.
        self::creating(function (self $conversation): void {
            $conversation->uuid = (string) Str::uuid();
        });
    }

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'input_tokens' => 'integer',
            'output_tokens' => 'integer',
            'cost_cents' => 'integer',
            'last_message_at' => 'datetime',
        ];
    }

    /** @return HasMany<Message, $this> */
    public function messages(): HasMany
    {
        return $this->hasMany(Message::class, 'conversation_id');
    }
}
