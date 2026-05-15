<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Facades\Chatbot;
use Aanfarhan\Chatbot\Testing\InteractsWithChatbot;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\View;
use Illuminate\Testing\TestResponse;

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

function streamAllRl(TestResponse $response): void
{
    ob_start();
    $response->baseResponse->sendContent();
    ob_end_clean();
}

it('returns 429 after exceeding the per-minute request threshold', function (): void {
    // Set a very low threshold: 2 requests per minute for the test.
    config()->set('chatbot.throttle.per_minute', 2);
    config()->set('chatbot.throttle.per_day', 1000);

    Chatbot::fake()
        ->respondWithStream(['ok'])
        ->respondWithStream(['ok'])
        ->respondWithStream(['ok']);

    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $r1 = $this->postJson('/chatbot/messages', ['signed_context' => $envelope, 'message' => 'hi']);
    streamAllRl($r1);
    $r1->assertOk();

    $r2 = $this->postJson('/chatbot/messages', ['signed_context' => $envelope, 'message' => 'hi']);
    streamAllRl($r2);
    $r2->assertOk();

    $r3 = $this->postJson('/chatbot/messages', ['signed_context' => $envelope, 'message' => 'hi']);
    $r3->assertStatus(429);
    $r3->assertJsonPath('retry_after', fn ($v) => is_int($v) && $v > 0);
});

it('throttle threshold is configurable per channel', function (): void {
    config()->set('chatbot.throttle.per_minute', 100); // global high
    config()->set('chatbot.channels.default.throttle.per_minute', 1); // channel low
    config()->set('chatbot.throttle.per_day', 1000);

    Chatbot::fake()
        ->respondWithStream(['ok'])
        ->respondWithStream(['ok']);

    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $r1 = $this->postJson('/chatbot/messages', ['signed_context' => $envelope, 'message' => 'hi']);
    streamAllRl($r1);
    $r1->assertOk();

    $r2 = $this->postJson('/chatbot/messages', ['signed_context' => $envelope, 'message' => 'hi']);
    $r2->assertStatus(429);
});
