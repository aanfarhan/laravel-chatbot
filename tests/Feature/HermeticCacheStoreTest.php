<?php

declare(strict_types=1);

use Illuminate\Cache\ArrayStore;

it('pins the cache store to the in-memory array driver under test', function (): void {
    expect(config('cache.default'))->toBe('array');
    expect(cache()->getStore())->toBeInstanceOf(ArrayStore::class);
});
