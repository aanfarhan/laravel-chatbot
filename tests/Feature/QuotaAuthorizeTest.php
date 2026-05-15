<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Facades\Chatbot;
use Aanfarhan\Chatbot\Testing\InteractsWithChatbot;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\View;

uses(RefreshDatabase::class);
uses(InteractsWithChatbot::class);

beforeEach(function (): void {
    config()->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
    View::addLocation(__DIR__.'/fixtures');

    Route::middleware('web')->get('/orders/{order}', function ($order) {
        Chatbot::context(['order' => ['id' => (int) $order]]);

        return view('order-page', ['order' => (int) $order]);
    })->name('orders.show');
});

it('Chatbot::authorize() denial returns 403 and makes no LLM call', function (): void {
    $fake = Chatbot::fake()->respondWithStream(['should not see this']);
    Chatbot::authorize(fn () => false);

    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->postJson('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'hi',
    ]);

    $response->assertStatus(403);
    $fake->assertNothingSent();
});

it('Chatbot::authorize() allowing callback proceeds normally', function (): void {
    Chatbot::fake()->respondWithStream(['ok']);
    Chatbot::authorize(fn () => true);

    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->postJson('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'hi',
    ])->assertOk();

    ob_start();
    $response->baseResponse->sendContent();
    ob_end_clean();
});

it('Chatbot::quota() denial emits an SSE error event with quota_exceeded code', function (): void {
    Chatbot::fake()->respondWithStream(['should not see this']);
    Chatbot::quota(fn () => ['allow' => false, 'reason' => 'daily limit reached']);

    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->postJson('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'hi',
    ])->assertOk();

    ob_start();
    $response->baseResponse->sendContent();
    $raw = (string) ob_get_clean();

    expect($raw)->toContain('event: error')
        ->and($raw)->toContain('quota_exceeded');
});

it('Chatbot::quota() allowing callback proceeds normally', function (): void {
    Chatbot::fake()->respondWithStream(['ok']);
    Chatbot::quota(fn () => ['allow' => true, 'reason' => '']);

    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->postJson('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'hi',
    ])->assertOk();

    ob_start();
    $response->baseResponse->sendContent();
    ob_end_clean();
});
