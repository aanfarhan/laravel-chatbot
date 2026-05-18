<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Envelopes\ContextEnvelope;
use Aanfarhan\Chatbot\Facades\Chatbot;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\View;

beforeEach(function (): void {
    config()->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
    config()->set('chatbot.channels.default.allowed_extractors', ['blade-snapshot']);

    View::addLocation(__DIR__.'/fixtures');

    Route::middleware('web')->get('/snapshot', function () {
        Chatbot::context(['note' => 'hi']);

        return view('snapshot-page', ['total' => 42]);
    })->name('snapshot.show');

    Route::middleware('web')->get('/snapshot-loop', function () {
        Chatbot::context(['note' => 'hi']);

        return view('snapshot-page', [
            'total' => 0,
            'rows' => ['alpha', 'bravo', 'charlie'],
        ]);
    })->name('snapshot.loop');
});

it('renders a page with @chatbotSnapshot that the widget can extract as blade-snapshot', function (): void {
    $response = $this->get('/snapshot');

    $response->assertOk();
    $html = $response->getContent() ?: '';

    expect($html)->toContain('<chatbot-widget');
    expect($html)->toContain('data-chatbot-snapshot="article"');
    expect($html)->toContain('display:contents');
    expect($html)->toContain('The order total is 42 dollars.');

    preg_match('/signed-context="([^"]+)"/', $html, $matches);
    $envelope = app(ContextEnvelope::class)->verify((string) $matches[1], expected: [
        'userId' => null,
        'route' => 'snapshot.show',
        'channel' => 'default',
    ]);
    expect($envelope->allowedExtractors)->toContain('blade-snapshot');
});

it('emits one data-chatbot-snapshot marker per @foreach iteration in document order', function (): void {
    $response = $this->get('/snapshot-loop');

    $response->assertOk();
    $html = $response->getContent() ?: '';

    preg_match_all(
        '/<span data-chatbot-snapshot="rows"[^>]*>\s*<p>([^<]+)<\/p>\s*<\/span>/',
        $html,
        $matches,
    );

    expect($matches[1])->toBe(['alpha', 'bravo', 'charlie']);
});
