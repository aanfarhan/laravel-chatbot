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

function parseSseResponse(string $raw): array
{
    $events = [];
    $current = [];

    foreach (explode("\n", $raw) as $line) {
        if ($line === '') {
            if ($current !== []) {
                $events[] = $current;
                $current = [];
            }

            continue;
        }

        if (str_starts_with($line, 'event:')) {
            $current['event'] = trim(substr($line, 6));
        } elseif (str_starts_with($line, 'data:')) {
            $current['data'] = json_decode(trim(substr($line, 5)), true);
        }
    }

    return $events;
}

it('writes the assembled assistant message row after streaming', function (): void {
    Chatbot::fake()->respondWithStream(['Hello', ' world']);
    $envelope = $this->extractSignedContext($this->get('/orders/7'));

    $response = $this->post('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'hi',
    ]);

    ob_start();
    $response->baseResponse->sendContent();
    ob_end_clean();

    $this->assertDatabaseHas('chatbot_messages', [
        'role' => 'assistant',
        'content' => 'Hello world',
    ]);
});

it('returns text/event-stream with token events then done', function (): void {
    Chatbot::fake()->respondWithStream(['Hello', ' world']);
    $envelope = $this->extractSignedContext($this->get('/orders/7'));

    $response = $this->post('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'hi',
    ]);

    $response->assertStatus(200);
    $response->assertHeader('Content-Type', 'text/event-stream; charset=UTF-8');

    ob_start();
    $response->baseResponse->sendContent();
    $output = (string) ob_get_clean();

    $events = parseSseResponse($output);

    expect($events)->toHaveCount(3);
    expect($events[0])->toBe(['event' => 'token', 'data' => ['content' => 'Hello']]);
    expect($events[1])->toBe(['event' => 'token', 'data' => ['content' => ' world']]);
    expect($events[2]['event'])->toBe('done');
    expect($events[2]['data'])->toHaveKey('usage');
});
