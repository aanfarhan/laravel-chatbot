<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\ChannelScope;
use Aanfarhan\Chatbot\Envelopes\ContextEnvelope;
use Aanfarhan\Chatbot\Facades\Chatbot;

beforeEach(function (): void {
    config()->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
});

it('Chatbot::channel() returns a ChannelScope', function (): void {
    $scope = Chatbot::channel('admin');

    expect($scope)->toBeInstanceOf(ChannelScope::class);
});

it('channel() and context() on the same request produce envelopes for different channels', function (): void {
    Chatbot::context(['order' => 1]);
    $adminHtml = Chatbot::channel('admin')->context(['report' => 'q3'])->renderWidget();
    $defaultHtml = Chatbot::renderWidget('default');

    preg_match('/signed-context="([^"]+)"/', $adminHtml, $ma);
    preg_match('/signed-context="([^"]+)"/', $defaultHtml, $md);

    $adminEnvelope = app(ContextEnvelope::class)->verify($ma[1]);
    $defaultEnvelope = app(ContextEnvelope::class)->verify($md[1]);

    expect($adminEnvelope->channel)->toBe('admin')
        ->and($adminEnvelope->payload)->toBe(['report' => 'q3'])
        ->and($defaultEnvelope->channel)->toBe('default')
        ->and($defaultEnvelope->payload)->toBe(['order' => 1]);
});

it('ChannelScope::context()->renderWidget() mints envelope with the channel and payload', function (): void {
    $html = Chatbot::channel('admin')
        ->context(['report' => 'q3'])
        ->renderWidget();

    expect($html)->toContain('channel="admin"');

    preg_match('/signed-context="([^"]+)"/', $html, $m);
    $envelope = app(ContextEnvelope::class)->verify($m[1], expected: ['channel' => 'admin']);

    expect($envelope->payload)->toBe(['report' => 'q3']);
});
