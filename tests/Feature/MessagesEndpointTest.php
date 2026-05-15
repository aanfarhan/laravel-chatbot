<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Envelopes\ContextEnvelope;
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
        Chatbot::context(['order' => ['id' => (int) $order, 'total' => 45]]);

        return view('order-page', ['order' => (int) $order]);
    })->name('orders.show');
});

function streamAndGetTokens(TestResponse $response): array
{
    ob_start();
    $response->baseResponse->sendContent();
    $raw = (string) ob_get_clean();

    $tokens = [];
    foreach (explode("\n", $raw) as $line) {
        if (str_starts_with($line, 'event: token')) {
            // next data line carries the content
        } elseif (str_starts_with($line, 'data:') && str_contains($raw, 'event: token')) {
            $decoded = json_decode(trim(substr($line, 5)), true);
            if (isset($decoded['content'])) {
                $tokens[] = $decoded['content'];
            }
        }
    }

    return $tokens;
}

function streamAll(TestResponse $response): void
{
    ob_start();
    $response->baseResponse->sendContent();
    ob_end_clean();
}

it('returns the streamed fake reply when a valid signed_context is posted', function (): void {
    Chatbot::fake()->respondWithStream(['hi']);
    $envelope = $this->extractSignedContext($this->get('/orders/7'));

    $response = $this->postJson('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'hello',
    ]);

    $response->assertOk();
    $response->assertHeader('Content-Type', 'text/event-stream; charset=UTF-8');

    $tokens = streamAndGetTokens($response);
    expect(implode('', $tokens))->toBe('hi');
});

it('rejects a POST with no signed_context', function (): void {
    Chatbot::fake()->respondWithStream(['hi']);

    $response = $this->postJson('/chatbot/messages', [
        'message' => 'hello',
    ]);

    $response->assertStatus(422);
});

it('rejects a POST with a tampered signed_context', function (): void {
    Chatbot::fake()->respondWithStream(['hi']);
    $envelope = $this->extractSignedContext($this->get('/orders/7'));

    [$body, $sig] = explode('.', $envelope);
    $tampered = $body.'.'.substr($sig, 0, -1).'A';

    $response = $this->postJson('/chatbot/messages', [
        'signed_context' => $tampered,
        'message' => 'hello',
    ]);

    $response->assertStatus(403);
});

it('uses the verified envelope payload when calling the LLM', function (): void {
    Chatbot::fake()->respondWithStream(['ok']);
    $envelope = $this->extractSignedContext($this->get('/orders/7'));

    $response = $this->postJson('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'hello',
    ])->assertOk();

    streamAll($response);

    expect(app(ContextEnvelope::class)->verify($envelope)->payload)
        ->toBe(['order' => ['id' => 7, 'total' => 45]]);
});

it('assembles the context from the envelope into the prompt sent to the LLM', function (): void {
    $fake = Chatbot::fake()->respondWithStream(['ok']);
    $envelope = $this->extractSignedContext($this->get('/orders/7'));

    $response = $this->postJson('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'What is my order?',
    ])->assertOk();

    streamAll($response);

    $fake->assertSentPrompt(function (array $messages): bool {
        $system = $messages[0]['content'] ?? '';

        return str_contains($system, '<order>')
            && str_contains($system, '"id":7')
            && str_contains($system, '"total":45');
    });
});
