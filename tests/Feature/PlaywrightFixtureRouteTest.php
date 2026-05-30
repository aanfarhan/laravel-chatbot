<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Chatbot;
use Aanfarhan\Chatbot\Tools\ToolRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    config()->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
});

it('returns 200 from /chatbot/test-fixture when the fixture flag is on', function (): void {
    config()->set('chatbot.playwright_fixture.enabled', true);

    $this->get('/chatbot/test-fixture')->assertStatus(200);
});

it('renders the chatbot widget on the playwright channel when the fixture flag is on', function (): void {
    config()->set('chatbot.playwright_fixture.enabled', true);

    $this->get('/chatbot/test-fixture')
        ->assertSee('chatbot-widget', escape: false)
        ->assertSee('channel="playwright"', escape: false);
});

it('registers the lookup_order tool and playwright channel allowlist when the fixture flag is on', function (): void {
    config()->set('chatbot.playwright_fixture.enabled', true);

    // Trigger provider boot-time wiring by hitting the route.
    $this->get('/chatbot/test-fixture')->assertStatus(200);

    $registry = $this->app->make(ToolRegistry::class);
    expect($registry->resolve('lookup_order'))->not->toBeNull();
    expect($registry->resolve('failing_tool'))->not->toBeNull();

    $chatbot = $this->app->make(Chatbot::class);
    expect($chatbot->resolveChannelAllowlist('playwright'))->toBe(['lookup_order', 'failing_tool']);
});

it('allows the blade-snapshot extractor on the playwright-extractor channel and renders its markers', function (): void {
    config()->set('chatbot.playwright_fixture.enabled', true);

    $this->get('/chatbot/test-fixture?channel=playwright-extractor')
        ->assertStatus(200)
        ->assertSee('channel="playwright-extractor"', escape: false)
        ->assertSee('data-chatbot-snapshot="product"', escape: false);

    expect(config('chatbot.channels.playwright-extractor.allowed_extractors'))->toBe(['blade-snapshot']);
});

it('returns 404 from /chatbot/test-fixture when the fixture flag is off', function (): void {
    config()->set('chatbot.playwright_fixture.enabled', false);

    $this->get('/chatbot/test-fixture')->assertStatus(404);
});

it('does not register the lookup_order tool when the fixture flag is off', function (): void {
    config()->set('chatbot.playwright_fixture.enabled', false);

    $registry = $this->app->make(ToolRegistry::class);
    expect($registry->resolve('lookup_order'))->toBeNull();

    $chatbot = $this->app->make(Chatbot::class);
    expect($chatbot->resolveChannelAllowlist('playwright'))->toBe([]);
});
