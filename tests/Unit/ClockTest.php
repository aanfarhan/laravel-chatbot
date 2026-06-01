<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Support\Clock;

it('returns the injected closure value', function (): void {
    $clock = new Clock(fn () => 42.0);

    expect($clock->now())->toBe(42.0);
});

it('returns real monotonic time when no closure injected', function (): void {
    $before = microtime(true);
    $sampled = (new Clock)->now();
    $after = microtime(true);

    expect($sampled)->toBeGreaterThanOrEqual($before)
        ->toBeLessThanOrEqual($after);
});
