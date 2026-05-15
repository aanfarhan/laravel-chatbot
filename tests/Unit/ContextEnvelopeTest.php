<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Envelopes\ContextEnvelope;
use Aanfarhan\Chatbot\Envelopes\Envelope;
use Aanfarhan\Chatbot\Exceptions\ExpiredEnvelopeException;
use Aanfarhan\Chatbot\Exceptions\MismatchedEnvelopeException;
use Aanfarhan\Chatbot\Exceptions\TamperedEnvelopeException;

beforeEach(function (): void {
    config()->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
});

it('mint -> verify round-trips payload, user, route, channel, expiry', function (): void {
    $envelope = app(ContextEnvelope::class);

    $expiresAt = new DateTimeImmutable('+5 minutes');
    $token = $envelope->mint(
        payload: ['order' => ['id' => 7, 'total' => 45]],
        userId: '42',
        route: 'orders.show',
        channel: 'default',
        expiresAt: $expiresAt,
    );

    expect($token)->toBeString()->not->toBe('');

    $verified = $envelope->verify($token, expected: [
        'userId' => '42',
        'route' => 'orders.show',
        'channel' => 'default',
    ]);

    expect($verified)->toBeInstanceOf(Envelope::class)
        ->and($verified->payload)->toBe(['order' => ['id' => 7, 'total' => 45]])
        ->and($verified->userId)->toBe('42')
        ->and($verified->route)->toBe('orders.show')
        ->and($verified->channel)->toBe('default')
        ->and($verified->expiresAt->getTimestamp())->toBe($expiresAt->getTimestamp())
        ->and($verified->version)->toBe(ContextEnvelope::VERSION);
});

it('rejects a token whose signature has been tampered with', function (): void {
    $envelope = app(ContextEnvelope::class);
    $token = $envelope->mint(
        payload: ['x' => 1],
        userId: '1',
        route: 'r',
        channel: 'default',
        expiresAt: new DateTimeImmutable('+1 minute'),
    );

    [$body, $sig] = explode('.', $token);
    $tampered = $body.'.'.strtr(substr($sig, 0, -1).'a', '+/', '-_');

    $envelope->verify($tampered);
})->throws(TamperedEnvelopeException::class);

it('rejects a token whose body has been swapped under the original signature', function (): void {
    $envelope = app(ContextEnvelope::class);
    $token = $envelope->mint(
        payload: ['x' => 1],
        userId: '1',
        route: 'r',
        channel: 'default',
        expiresAt: new DateTimeImmutable('+1 minute'),
    );

    [, $sig] = explode('.', $token);
    $forgedBody = rtrim(strtr(base64_encode((string) json_encode([
        'v' => ContextEnvelope::VERSION,
        'u' => '1',
        'r' => 'r',
        'c' => 'default',
        'e' => time() + 60,
        'p' => ['x' => 999],
    ])), '+/', '-_'), '=');

    $envelope->verify($forgedBody.'.'.$sig);
})->throws(TamperedEnvelopeException::class);

it('rejects an expired token', function (): void {
    $envelope = app(ContextEnvelope::class);
    $token = $envelope->mint(
        payload: ['x' => 1],
        userId: '1',
        route: 'r',
        channel: 'default',
        expiresAt: new DateTimeImmutable('-1 second'),
    );

    $envelope->verify($token);
})->throws(ExpiredEnvelopeException::class);

it('rejects a token minted for user A when posted as user B', function (): void {
    $envelope = app(ContextEnvelope::class);
    $token = $envelope->mint(
        payload: [],
        userId: 'A',
        route: 'r',
        channel: 'default',
        expiresAt: new DateTimeImmutable('+1 minute'),
    );

    $envelope->verify($token, expected: ['userId' => 'B']);
})->throws(MismatchedEnvelopeException::class);

it('rejects a token minted for route X when posted from route Y', function (): void {
    $envelope = app(ContextEnvelope::class);
    $token = $envelope->mint(
        payload: [],
        userId: '1',
        route: 'orders.show',
        channel: 'default',
        expiresAt: new DateTimeImmutable('+1 minute'),
    );

    $envelope->verify($token, expected: ['route' => 'invoices.show']);
})->throws(MismatchedEnvelopeException::class);

it('rejects a token minted for channel A when posted to channel B', function (): void {
    $envelope = app(ContextEnvelope::class);
    $token = $envelope->mint(
        payload: [],
        userId: '1',
        route: 'r',
        channel: 'default',
        expiresAt: new DateTimeImmutable('+1 minute'),
    );

    $envelope->verify($token, expected: ['channel' => 'admin']);
})->throws(MismatchedEnvelopeException::class);

it('rejects a token whose version does not match the current version', function (): void {
    $envelope = app(ContextEnvelope::class);

    $key = base64_decode(substr((string) config('app.key'), 7), true);
    $body = (string) json_encode([
        'v' => ContextEnvelope::VERSION + 1,
        'u' => '1',
        'r' => 'r',
        'c' => 'default',
        'e' => time() + 60,
        'p' => [],
    ]);
    $encoded = rtrim(strtr(base64_encode($body), '+/', '-_'), '=');
    $signature = rtrim(strtr(base64_encode(hash_hmac('sha256', $encoded, (string) $key, true)), '+/', '-_'), '=');

    $envelope->verify($encoded.'.'.$signature);
})->throws(MismatchedEnvelopeException::class);
