<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $conversation_id
 * @property string $role
 * @property string $content
 * @property int $input_tokens
 * @property int $output_tokens
 * @property int $cost_cents
 * @property string $route_name
 * @property string $context_hash
 * @property array<string, mixed>|null $error
 * @property \Illuminate\Support\Carbon $created_at
 */
final class Message extends Model
{
    protected $table = 'chatbot_messages';

    public $timestamps = false;

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'input_tokens' => 'integer',
            'output_tokens' => 'integer',
            'cost_cents' => 'integer',
            'error' => 'array',
            'created_at' => 'datetime',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class, 'conversation_id');
    }
}
