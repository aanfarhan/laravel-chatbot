<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Extractors\ClientExtractorPayload;
use Aanfarhan\Chatbot\Extractors\ClientExtractorRegistry;

function makeRegistry(array $names = ['article', 'selection']): ClientExtractorRegistry
{
    $registry = new ClientExtractorRegistry;
    foreach ($names as $name) {
        $registry->register($name, "Description for {$name}.");
    }

    return $registry;
}

// ─── Tracer bullet ────────────────────────────────────────────────────────────

it('returns a name-keyed map for a single valid block', function (): void {
    $payload = new ClientExtractorPayload;

    $result = $payload->normalise(
        raw: [['name' => 'article', 'output' => 'Some article text.']],
        allowedExtractors: ['article'],
        registry: makeRegistry(),
    );

    expect($result)->toBe(['article' => 'Some article text.']);
});

// ─── Allowlist enforcement ────────────────────────────────────────────────────

it('rejects a block whose name is not in the allowlist', function (): void {
    $payload = new ClientExtractorPayload;

    $payload->normalise(
        raw: [['name' => 'article', 'output' => 'Some text.']],
        allowedExtractors: ['selection'],
        registry: makeRegistry(),
    );
})->throws(RuntimeException::class);

it('accepts a block whose name is in the allowlist', function (): void {
    $payload = new ClientExtractorPayload;

    $result = $payload->normalise(
        raw: [['name' => 'selection', 'output' => 'Selected row.']],
        allowedExtractors: ['selection'],
        registry: makeRegistry(),
    );

    expect($result)->toHaveKey('selection');
});

// ─── Size-cap truncation ──────────────────────────────────────────────────────

it('truncates output exceeding the size cap and appends [truncated] marker', function (): void {
    $cap = 20;
    $payload = new ClientExtractorPayload(outputSizeCap: $cap);

    $result = $payload->normalise(
        raw: [['name' => 'article', 'output' => str_repeat('x', 100)]],
        allowedExtractors: ['article'],
        registry: makeRegistry(),
    );

    expect($result['article'])->toEndWith('[truncated]')
        ->and(strlen($result['article']))->toBe($cap + strlen('[truncated]'));
});

it('does not truncate output within the size cap', function (): void {
    $payload = new ClientExtractorPayload(outputSizeCap: 8192);

    $result = $payload->normalise(
        raw: [['name' => 'article', 'output' => 'Short text.']],
        allowedExtractors: ['article'],
        registry: makeRegistry(),
    );

    expect($result['article'])->toBe('Short text.')
        ->and($result['article'])->not->toContain('[truncated]');
});

// ─── Duplicate handling ───────────────────────────────────────────────────────

it('throws when the same name appears twice in the raw payload', function (): void {
    $payload = new ClientExtractorPayload;

    $payload->normalise(
        raw: [
            ['name' => 'article', 'output' => 'First.'],
            ['name' => 'article', 'output' => 'Second.'],
        ],
        allowedExtractors: ['article'],
        registry: makeRegistry(),
    );
})->throws(RuntimeException::class);

// ─── Empty/whitespace output handling ────────────────────────────────────────

it('omits a block whose output is an empty string', function (): void {
    $payload = new ClientExtractorPayload;

    $result = $payload->normalise(
        raw: [['name' => 'article', 'output' => '']],
        allowedExtractors: ['article'],
        registry: makeRegistry(),
    );

    expect($result)->not->toHaveKey('article');
});

it('omits a block whose output is whitespace only', function (): void {
    $payload = new ClientExtractorPayload;

    $result = $payload->normalise(
        raw: [['name' => 'article', 'output' => "   \n  "]],
        allowedExtractors: ['article'],
        registry: makeRegistry(),
    );

    expect($result)->not->toHaveKey('article');
});

it('omits a block whose output is null', function (): void {
    $payload = new ClientExtractorPayload;

    $result = $payload->normalise(
        raw: [['name' => 'article', 'output' => null]],
        allowedExtractors: ['article'],
        registry: makeRegistry(),
    );

    expect($result)->not->toHaveKey('article');
});

// ─── Normalisation output shape ───────────────────────────────────────────────

it('returns multiple blocks as a name-keyed map preserving order', function (): void {
    $payload = new ClientExtractorPayload;

    $result = $payload->normalise(
        raw: [
            ['name' => 'article', 'output' => 'Article text.'],
            ['name' => 'selection', 'output' => 'Selected row.'],
        ],
        allowedExtractors: ['article', 'selection'],
        registry: makeRegistry(),
    );

    expect($result)->toBe([
        'article' => 'Article text.',
        'selection' => 'Selected row.',
    ]);
});

it('returns an empty map when all blocks have empty outputs', function (): void {
    $payload = new ClientExtractorPayload;

    $result = $payload->normalise(
        raw: [
            ['name' => 'article', 'output' => ''],
            ['name' => 'selection', 'output' => null],
        ],
        allowedExtractors: ['article', 'selection'],
        registry: makeRegistry(),
    );

    expect($result)->toBe([]);
});
