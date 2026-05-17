<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tests\Stubs;

use Aanfarhan\Chatbot\Concerns\HasChatbotData;
use Illuminate\Foundation\Auth\User as Authenticatable;

/** @internal Stub user model used to exercise the HasChatbotData trait in tests. Implements Authenticatable so it can be used with actingAs(). */
final class FakeUser extends Authenticatable
{
    use HasChatbotData;

    protected $table = 'users';

    protected $guarded = [];

    public $timestamps = false;
}
