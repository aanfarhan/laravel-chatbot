<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Facades\Chatbot;
use Aanfarhan\Chatbot\Testing\InteractsWithChatbot;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\View;

uses(InteractsWithChatbot::class);

beforeEach(function (): void {
    config()->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
    View::addLocation(__DIR__.'/fixtures');

    Route::middleware('web')->get('/orders/{order}', function ($order) {
        Chatbot::context(['order' => ['id' => (int) $order, 'total' => 45]]);

        return view('order-page', ['order' => (int) $order]);
    })->name('orders.show');
});

it('extracts the signed context from a rendered Blade response', function (): void {
    $response = $this->get('/orders/7');

    $envelope = $this->extractSignedContext($response);

    expect($envelope)->toBeString()->not->toBe('');
});

it('throws if the response contains no chatbot-widget', function (): void {
    Route::middleware('web')->get('/empty', fn () => '<html><body>nothing</body></html>')
        ->name('empty');

    $this->extractSignedContext($this->get('/empty'));
})->throws(RuntimeException::class, 'no signed_context');
