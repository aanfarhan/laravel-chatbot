<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Extractors\ClientExtractorRegistry;

it('resolves a registered extractor by name', function (): void {
    $registry = new ClientExtractorRegistry;
    $registry->register('article', 'Full text of the article on the current page.');

    expect($registry->has('article'))->toBeTrue();
});

it('returns false for an unregistered extractor name', function (): void {
    $registry = new ClientExtractorRegistry;

    expect($registry->has('unknown'))->toBeFalse();
});

it('lists all registered extractors as a name-to-description map', function (): void {
    $registry = new ClientExtractorRegistry;
    $registry->register('article', 'Article text.');
    $registry->register('selection', 'Selected table row.');

    expect($registry->all())->toBe([
        'article' => 'Article text.',
        'selection' => 'Selected table row.',
    ]);
});

it('throws when registering a duplicate extractor name', function (): void {
    $registry = new ClientExtractorRegistry;
    $registry->register('article', 'Article text.');

    $registry->register('article', 'Different description.');
})->throws(RuntimeException::class, "Client extractor 'article' is already registered");

// ─── Name shape validation ────────────────────────────────────────────────────

it('throws when registering a name that contains spaces', function (): void {
    $registry = new ClientExtractorRegistry;

    $registry->register('user id', 'Contains a space.');
})->throws(RuntimeException::class);

it('throws when registering a name that starts with a digit', function (): void {
    $registry = new ClientExtractorRegistry;

    $registry->register('1article', 'Starts with digit.');
})->throws(RuntimeException::class);

it('throws when registering a name that contains uppercase letters', function (): void {
    $registry = new ClientExtractorRegistry;

    $registry->register('Article', 'Contains uppercase.');
})->throws(RuntimeException::class);

it('throws when registering a name that contains special characters', function (): void {
    $registry = new ClientExtractorRegistry;

    $registry->register('page.text', 'Contains dot.');
})->throws(RuntimeException::class);

// ─── Identity-shaped name rejection ──────────────────────────────────────────

it('throws when registering the identity-shaped name user', function (): void {
    $registry = new ClientExtractorRegistry;

    $registry->register('user', 'Identity-shaped.');
})->throws(RuntimeException::class);

it('throws when registering the identity-shaped name user_id', function (): void {
    $registry = new ClientExtractorRegistry;

    $registry->register('user_id', 'Identity-shaped.');
})->throws(RuntimeException::class);

it('throws when registering a hyphenated identity-shaped name', function (): void {
    $registry = new ClientExtractorRegistry;

    $registry->register('user-id', 'Identity-shaped via hyphens.');
})->throws(RuntimeException::class);
