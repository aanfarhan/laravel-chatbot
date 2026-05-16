<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tests\Stubs;

use Aanfarhan\Chatbot\Concerns\HasChatbotData;
use Illuminate\Database\Eloquent\Model;

/** @internal Stub user model used to exercise the HasChatbotData trait in tests. */
final class FakeUser extends Model
{
    use HasChatbotData;

    protected $table = 'users';

    protected $guarded = [];

    public $timestamps = false;
}
