<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Factory as AuthFactory;

final class ThreadedActorResolver
{
    public function __construct(private readonly AuthFactory $auth) {}

    public function reconstitute(?string $userId): ?Authenticatable
    {
        if ($userId === null) {
            return null;
        }

        return $this->auth->guard()->getProvider()->retrieveById($userId);
    }
}
