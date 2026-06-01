<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Support;

use Closure;

final readonly class Clock
{
    public function __construct(private ?Closure $clock = null) {}

    public function now(): float
    {
        return $this->clock !== null ? ($this->clock)() : microtime(true);
    }
}
