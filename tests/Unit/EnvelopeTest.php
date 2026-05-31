<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Envelopes\Envelope;
use Aanfarhan\Chatbot\Exceptions\TamperedEnvelopeException;

it('exposes a VERSION int constant', function (): void {
    expect(Envelope::VERSION)->toBeInt();
});

it('toBody serializes required fields with VERSION', function (): void {
    $expiresAt = new DateTimeImmutable('+5 minutes');
    $envelope = new Envelope(
        payload: ['k' => 'v'],
        userId: '42',
        route: 'orders.show',
        channel: 'default',
        expiresAt: $expiresAt,
        version: Envelope::VERSION,
    );

    $body = $envelope->toBody();

    expect($body)->toHaveKeys(['v', 'u', 'r', 'c', 'e', 'p'])
        ->and($body['v'])->toBe(Envelope::VERSION)
        ->and($body['u'])->toBe('42')
        ->and($body['r'])->toBe('orders.show')
        ->and($body['c'])->toBe('default')
        ->and($body['e'])->toBe($expiresAt->getTimestamp())
        ->and($body['p'])->toBe(['k' => 'v']);
});

it('toBody omits null and empty optional fields', function (): void {
    $envelope = new Envelope(
        payload: [],
        userId: null,
        route: 'r',
        channel: 'default',
        expiresAt: new DateTimeImmutable('+1 minute'),
        version: Envelope::VERSION,
    );

    $body = $envelope->toBody();

    expect($body)->not->toHaveKeys(['g', 'pr', 's', 't', 'x', 'xt', 'xc']);
});

it('toBody includes non-null non-empty optional fields', function (): void {
    $envelope = new Envelope(
        payload: [],
        userId: '1',
        route: 'r',
        channel: 'default',
        expiresAt: new DateTimeImmutable('+1 minute'),
        version: Envelope::VERSION,
        greeting: 'hi',
        prompt: 'do thing',
        summary: 'done',
        allowedTools: ['bash'],
        allowedExtractors: ['article'],
        extractorTimeoutMs: 500,
        extractorSizeCapBytes: 8192,
    );

    $body = $envelope->toBody();

    expect($body['g'])->toBe('hi')
        ->and($body['pr'])->toBe('do thing')
        ->and($body['s'])->toBe('done')
        ->and($body['t'])->toBe(['bash'])
        ->and($body['x'])->toBe(['article'])
        ->and($body['xt'])->toBe(500)
        ->and($body['xc'])->toBe(8192);
});

it('fromBody round-trips a fully-populated envelope', function (): void {
    $expiresAt = new DateTimeImmutable('+5 minutes');
    $original = new Envelope(
        payload: ['order' => 7],
        userId: '42',
        route: 'orders.show',
        channel: 'premium',
        expiresAt: $expiresAt,
        version: Envelope::VERSION,
        greeting: 'hello',
        prompt: 'do x',
        summary: 'did x',
        allowedTools: ['bash', 'read'],
        allowedExtractors: ['article'],
        extractorTimeoutMs: 1000,
        extractorSizeCapBytes: 16384,
    );

    $restored = Envelope::fromBody($original->toBody());

    expect($restored->payload)->toBe(['order' => 7])
        ->and($restored->userId)->toBe('42')
        ->and($restored->route)->toBe('orders.show')
        ->and($restored->channel)->toBe('premium')
        ->and($restored->expiresAt->getTimestamp())->toBe($expiresAt->getTimestamp())
        ->and($restored->version)->toBe(Envelope::VERSION)
        ->and($restored->greeting)->toBe('hello')
        ->and($restored->prompt)->toBe('do x')
        ->and($restored->summary)->toBe('did x')
        ->and($restored->allowedTools)->toBe(['bash', 'read'])
        ->and($restored->allowedExtractors)->toBe(['article'])
        ->and($restored->extractorTimeoutMs)->toBe(1000)
        ->and($restored->extractorSizeCapBytes)->toBe(16384);
});

it('fromBody throws TamperedEnvelopeException with message "envelope payload malformed" on missing required key', function (): void {
    Envelope::fromBody(['v' => 1, 'u' => '1', 'r' => 'r', 'c' => 'default']);
})->throws(TamperedEnvelopeException::class, 'envelope payload malformed');

it('fromBody throws TamperedEnvelopeException when v is not an int', function (): void {
    Envelope::fromBody(['v' => '1', 'u' => '1', 'r' => 'r', 'c' => 'default', 'e' => time() + 60, 'p' => []]);
})->throws(TamperedEnvelopeException::class, 'envelope payload malformed');
