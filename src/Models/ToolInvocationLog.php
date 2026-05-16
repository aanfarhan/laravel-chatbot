<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Eloquent model for the chatbot_tool_invocations table.
 * Named ToolInvocationLog to avoid collision with Tools\ToolInvocation (the domain value object).
 *
 * @property int $id
 * @property int $conversation_id
 * @property int|null $message_id
 * @property string $tool_name
 * @property array<string, mixed> $arguments
 * @property string $result
 * @property string $status
 * @property string|null $error
 * @property Carbon $started_at
 * @property Carbon $finished_at
 */
final class ToolInvocationLog extends Model
{
    public $timestamps = false;

    protected $table = 'chatbot_tool_invocations';

    protected $fillable = [
        'conversation_id',
        'message_id',
        'tool_name',
        'arguments',
        'result',
        'status',
        'error',
        'started_at',
        'finished_at',
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'arguments' => 'array',
            'started_at' => 'datetime',
            'finished_at' => 'datetime',
        ];
    }
}
