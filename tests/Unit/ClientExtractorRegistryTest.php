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
})->throws(\RuntimeException::class, "Client extractor 'article' is already registered");
