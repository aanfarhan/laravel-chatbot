<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Config\ChannelSettings;
use Aanfarhan\Chatbot\Config\Defaults;
use Illuminate\Config\Repository;

function makeSettings(array $config): ChannelSettings
{
    return new ChannelSettings(new Repository(['chatbot' => $config]));
}

// ─── freshnessWindow ───────────────────────────────────────────────────────────

it('returns per-channel freshness when set', function (): void {
    $s = makeSettings(['channels' => ['beta' => ['replay_freshness' => 120]]]);
    expect($s->freshnessWindow('beta'))->toBe(120);
});

it('falls back to global freshness when channel key absent', function (): void {
    $s = makeSettings(['tools' => ['replay_freshness' => 600]]);
    expect($s->freshnessWindow('beta'))->toBe(600);
});

it('returns Defaults::FRESHNESS when both absent', function (): void {
    $s = makeSettings([]);
    expect($s->freshnessWindow('beta'))->toBe(Defaults::FRESHNESS);
});

it('throws when per-channel freshness is wrong type', function (): void {
    $s = makeSettings(['channels' => ['beta' => ['replay_freshness' => 'fast']]]);
    expect(fn () => $s->freshnessWindow('beta'))->toThrow(InvalidArgumentException::class);
});

it('throws when global freshness is wrong type', function (): void {
    $s = makeSettings(['tools' => ['replay_freshness' => 'fast']]);
    expect(fn () => $s->freshnessWindow('beta'))->toThrow(InvalidArgumentException::class);
});

// ─── throttlePerMinute ────────────────────────────────────────────────────────

it('returns per-channel throttle per_minute when set', function (): void {
    $s = makeSettings(['channels' => ['api' => ['throttle' => ['per_minute' => 5]]]]);
    expect($s->throttlePerMinute('api'))->toBe(5);
});

it('falls back to global throttle per_minute', function (): void {
    $s = makeSettings(['throttle' => ['per_minute' => 50]]);
    expect($s->throttlePerMinute('api'))->toBe(50);
});

it('returns Defaults::THROTTLE_PER_MINUTE when both absent', function (): void {
    $s = makeSettings([]);
    expect($s->throttlePerMinute('api'))->toBe(Defaults::THROTTLE_PER_MINUTE);
});

it('throws when per-channel throttle per_minute is wrong type', function (): void {
    $s = makeSettings(['channels' => ['api' => ['throttle' => ['per_minute' => 'many']]]]);
    expect(fn () => $s->throttlePerMinute('api'))->toThrow(InvalidArgumentException::class);
});

// ─── throttlePerDay ───────────────────────────────────────────────────────────

it('returns per-channel throttle per_day when set', function (): void {
    $s = makeSettings(['channels' => ['api' => ['throttle' => ['per_day' => 50]]]]);
    expect($s->throttlePerDay('api'))->toBe(50);
});

it('falls back to global throttle per_day', function (): void {
    $s = makeSettings(['throttle' => ['per_day' => 500]]);
    expect($s->throttlePerDay('api'))->toBe(500);
});

it('returns Defaults::THROTTLE_PER_DAY when both absent', function (): void {
    $s = makeSettings([]);
    expect($s->throttlePerDay('api'))->toBe(Defaults::THROTTLE_PER_DAY);
});

// ─── model ────────────────────────────────────────────────────────────────────

it('returns per-channel model when set', function (): void {
    $s = makeSettings(['channels' => ['premium' => ['model' => 'gpt-4o']]]);
    expect($s->model('premium'))->toBe('gpt-4o');
});

it('falls back to global model', function (): void {
    $s = makeSettings(['model' => 'gpt-4o-mini']);
    expect($s->model('premium'))->toBe('gpt-4o-mini');
});

it('returns null when model absent at both levels', function (): void {
    $s = makeSettings([]);
    expect($s->model('premium'))->toBeNull();
});

it('throws when per-channel model is not a string', function (): void {
    $s = makeSettings(['channels' => ['premium' => ['model' => 42]]]);
    expect(fn () => $s->model('premium'))->toThrow(InvalidArgumentException::class);
});

// ─── allowedExtractors (no global level) ──────────────────────────────────────

it('returns per-channel allowed_extractors list', function (): void {
    $s = makeSettings(['channels' => ['web' => ['allowed_extractors' => ['blade-snapshot']]]]);
    expect($s->allowedExtractors('web'))->toBe(['blade-snapshot']);
});

it('returns empty array when allowed_extractors absent — no global fallback', function (): void {
    $s = makeSettings(['allowed_extractors' => ['blade-snapshot']]);  // global-level key
    expect($s->allowedExtractors('web'))->toBe([]);
});

// ─── extractorTimeoutMs (per-channel only, null default) ─────────────────────

it('returns per-channel extractor_timeout_ms', function (): void {
    $s = makeSettings(['channels' => ['web' => ['extractor_timeout_ms' => 2000]]]);
    expect($s->extractorTimeoutMs('web'))->toBe(2000);
});

it('returns null when extractor_timeout_ms absent', function (): void {
    $s = makeSettings([]);
    expect($s->extractorTimeoutMs('web'))->toBeNull();
});

it('throws when extractor_timeout_ms is wrong type', function (): void {
    $s = makeSettings(['channels' => ['web' => ['extractor_timeout_ms' => 'fast']]]);
    expect(fn () => $s->extractorTimeoutMs('web'))->toThrow(InvalidArgumentException::class);
});

// ─── extractorSizeCapBytes (per-channel only, null default) ──────────────────

it('returns per-channel extractor_size_cap_bytes', function (): void {
    $s = makeSettings(['channels' => ['web' => ['extractor_size_cap_bytes' => 8192]]]);
    expect($s->extractorSizeCapBytes('web'))->toBe(8192);
});

it('returns null when extractor_size_cap_bytes absent', function (): void {
    $s = makeSettings([]);
    expect($s->extractorSizeCapBytes('web'))->toBeNull();
});

// ─── prompt (channel-only) ────────────────────────────────────────────────────

it('returns per-channel prompt from config', function (): void {
    $s = makeSettings(['channels' => ['support' => ['prompt' => 'You are support.']]]);
    expect($s->prompt('support'))->toBe('You are support.');
});

it('returns null when prompt absent', function (): void {
    $s = makeSettings([]);
    expect($s->prompt('support'))->toBeNull();
});

// ─── greeting (channel-only) ─────────────────────────────────────────────────

it('returns per-channel greeting from config', function (): void {
    $s = makeSettings(['channels' => ['support' => ['greeting' => 'Hello!']]]);
    expect($s->greeting('support'))->toBe('Hello!');
});

it('returns null when greeting absent', function (): void {
    $s = makeSettings([]);
    expect($s->greeting('support'))->toBeNull();
});

// ─── summary (channel-only, callable supported) ───────────────────────────────

it('returns per-channel string summary from config', function (): void {
    $s = makeSettings(['channels' => ['vip' => ['summary' => 'Premium user.']]]);
    expect($s->summary('vip'))->toBe('Premium user.');
});

it('returns null when summary absent', function (): void {
    $s = makeSettings([]);
    expect($s->summary('vip'))->toBeNull();
});
