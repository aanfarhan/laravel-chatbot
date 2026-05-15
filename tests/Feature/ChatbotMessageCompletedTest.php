<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Events\ChatbotMessageCompleted;
use Aanfarhan\Chatbot\Facades\Chatbot;
use Aanfarhan\Chatbot\Testing\InteractsWithChatbot;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
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

function streamAllCmpl(\Illuminate\Testing\TestResponse $response): void
{
    ob_start();
    $response->baseResponse->sendContent();
    ob_end_clean();
}

it('dispatches ChatbotMessageCompleted after a successful stream with tokens and model', function (): void {
    Event::fake([ChatbotMessageCompleted::class]);

    config()->set('chatbot.model', 'gpt-4o-mini');
    Chatbot::fake()->respondWithStream(['hello']);

    $envelope = $this->extractSignedContext($this->get('/orders/1'));
    $response = $this->postJson('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'hi',
    ])->assertOk();

    streamAllCmpl($response);

    Event::assertDispatched(ChatbotMessageCompleted::class, function (ChatbotMessageCompleted $event): bool {
        return $event->model === 'gpt-4o-mini'
            && $event->inputTokens >= 0
            && $event->outputTokens >= 0;
    });
});
