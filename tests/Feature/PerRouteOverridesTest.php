<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Facades\Chatbot;
use Aanfarhan\Chatbot\Testing\InteractsWithChatbot;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\View;

uses(RefreshDatabase::class);
uses(InteractsWithChatbot::class);

function decodedSseEvents(string $raw): array
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

beforeEach(function (): void {
    config()->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
    View::addLocation(__DIR__.'/fixtures');
});

use Aanfarhan\Chatbot\Envelopes\ContextEnvelope;

// ─── Behavior 1: per-route prompt ────────────────────────────────────────────

it('per-route prompt appears in the assembled system prompt', function (): void {
    Route::middleware('web')->get('/orders/{order}', function ($order) {
        Chatbot::context(['order' => ['id' => (int) $order]]);
        Chatbot::prompt('Focus on order details only.');

        return view('order-page', ['order' => (int) $order]);
    })->name('orders.show');

    $fake = Chatbot::fake()->respondWithStream(['ok']);
    $envelope = $this->extractSignedContext($this->get('/orders/7'));

    $response = $this->postJson('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'hello',
    ])->assertOk();

    ob_start();
    $response->baseResponse->sendContent();
    ob_end_clean();

    $fake->assertSentPrompt(function (array $messages): bool {
        return str_contains($messages[0]['content'] ?? '', 'Focus on order details only.');
    });
});

// ─── Behavior 2: greeting carried in envelope ─────────────────────────────────

it('greeting declared in route handler is carried in the signed envelope', function (): void {
    Route::middleware('web')->get('/orders/{order}', function ($order) {
        Chatbot::context(['order' => ['id' => (int) $order]]);
        Chatbot::greeting('Hello! Ask me about your order.');

        return view('order-page', ['order' => (int) $order]);
    })->name('orders.show');

    $html = $this->get('/orders/7')->getContent() ?? '';
    preg_match('/signed-context="([^"]+)"/', $html, $m);
    $token = htmlspecialchars_decode($m[1], ENT_QUOTES);

    $envelope = app(ContextEnvelope::class)->verify($token);

    expect($envelope->greeting)->toBe('Hello! Ask me about your order.');
});

// ─── Behavior 3: rehydrate prepends greeting ──────────────────────────────────

it('rehydrate endpoint prepends greeting before persisted messages when signed_context provided', function (): void {
    Route::middleware('web')->get('/orders/{order}', function ($order) {
        Chatbot::context(['order' => ['id' => (int) $order]]);
        Chatbot::greeting('Hello! Ask me about your order.');

        return view('order-page', ['order' => (int) $order]);
    })->name('orders.show');

    $html = $this->get('/orders/7')->getContent() ?? '';
    preg_match('/signed-context="([^"]+)"/', $html, $m);
    $signedContext = htmlspecialchars_decode($m[1], ENT_QUOTES);

    $store = app(ConversationStore::class);
    $conv = $store->start('default', null, 'guest-abc');
    $store->append($conv->id, 'user', 'What is my order?', 'orders.show', 'hash1');

    $response = $this->withCredentials()
        ->withUnencryptedCookie('chatbot_guest_id', 'guest-abc')
        ->getJson("/chatbot/conversations/{$conv->id}/messages?signed_context={$signedContext}");

    $response->assertOk()
        ->assertJsonCount(2, 'messages')
        ->assertJsonPath('messages.0.role', 'assistant')
        ->assertJsonPath('messages.0.content', 'Hello! Ask me about your order.')
        ->assertJsonPath('messages.1.role', 'user');
});

// ─── Behavior 4 & 5: summary SSE event ───────────────────────────────────────

it('summary callable is evaluated and emitted as context_summary SSE event before first token', function (): void {
    $orderId = 42;

    Route::middleware('web')->get('/orders/{order}', function ($order) {
        Chatbot::context(['order' => ['id' => (int) $order]]);
        Chatbot::summary(fn () => "Answering about order #{$order}");

        return view('order-page', ['order' => (int) $order]);
    })->name('orders.show');

    Chatbot::fake()->respondWithStream(['Hello']);
    $envelope = $this->extractSignedContext($this->get('/orders/42'));

    $response = $this->postJson('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'hi',
    ])->assertOk();

    ob_start();
    $response->baseResponse->sendContent();
    $output = (string) ob_get_clean();

    $events = decodedSseEvents($output);

    $types = array_column($events, 'event');
    $summaryIndex = array_search('context_summary', $types, true);
    $firstTokenIndex = array_search('token', $types, true);

    expect($summaryIndex)->not->toBeFalse()
        ->and($firstTokenIndex)->not->toBeFalse()
        ->and($summaryIndex)->toBeLessThan($firstTokenIndex)
        ->and($events[$summaryIndex]['data']['summary'])->toBe('Answering about order #42');
});

it('summary static string is passed through unchanged in context_summary event', function (): void {
    Route::middleware('web')->get('/orders/{order}', function ($order) {
        Chatbot::context(['order' => ['id' => (int) $order]]);
        Chatbot::summary('Static provenance note');

        return view('order-page', ['order' => (int) $order]);
    })->name('orders.show');

    Chatbot::fake()->respondWithStream(['ok']);
    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->postJson('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'hi',
    ])->assertOk();

    ob_start();
    $response->baseResponse->sendContent();
    $output = (string) ob_get_clean();

    $events = decodedSseEvents($output);

    $summary = collect($events)->firstWhere('event', 'context_summary');
    expect($summary)->not->toBeNull()
        ->and($summary['data']['summary'])->toBe('Static provenance note');
});

// ─── Behavior 6 & 7: channel config defaults ─────────────────────────────────

it('channel default greeting used when per-route greeting not declared', function (): void {
    config()->set('chatbot.channels.admin.greeting', 'Welcome, admin!');

    Route::middleware('web')->get('/admin', function () {
        Chatbot::channel('admin')->context([]);

        return view('admin-page');
    })->name('admin.dashboard');

    $html = $this->get('/admin')->getContent() ?? '';
    preg_match('/signed-context="([^"]+)"/', $html, $m);
    $token = htmlspecialchars_decode($m[1], ENT_QUOTES);

    $envelope = app(ContextEnvelope::class)->verify($token);

    expect($envelope->greeting)->toBe('Welcome, admin!');
});

it('channel default summary string used when per-route summary not declared', function (): void {
    config()->set('chatbot.channels.admin.summary', 'Admin dashboard context');

    Route::middleware('web')->get('/admin', function () {
        Chatbot::channel('admin')->context([]);

        return view('admin-page');
    })->name('admin.dashboard');

    Chatbot::fake()->respondWithStream(['ok']);
    $html = $this->get('/admin')->getContent() ?? '';
    preg_match('/signed-context="([^"]+)"/', $html, $m);
    $adminToken = htmlspecialchars_decode($m[1], ENT_QUOTES);

    $response = $this->postJson('/chatbot/messages', [
        'signed_context' => $adminToken,
        'message' => 'hi',
    ])->assertOk();

    ob_start();
    $response->baseResponse->sendContent();
    $output = (string) ob_get_clean();

    $events = decodedSseEvents($output);
    $summary = collect($events)->firstWhere('event', 'context_summary');
    expect($summary)->not->toBeNull()
        ->and($summary['data']['summary'])->toBe('Admin dashboard context');
});

// ─── Behavior 8: chainable on channel scope ───────────────────────────────────

it('prompt, greeting, and summary are chainable on Chatbot::channel() scope', function (): void {
    Route::middleware('web')->get('/admin', function () {
        Chatbot::channel('admin')
            ->context(['report' => 'q3'])
            ->prompt('Admin-only instructions.')
            ->greeting('Hello admin!')
            ->summary('Admin context');

        return view('admin-page');
    })->name('admin.dashboard');

    Chatbot::fake()->respondWithStream(['ok']);
    $html = $this->get('/admin')->getContent() ?? '';
    preg_match('/signed-context="([^"]+)"/', $html, $m);
    $adminToken = htmlspecialchars_decode($m[1], ENT_QUOTES);

    $envelope = app(ContextEnvelope::class)->verify($adminToken);

    expect($envelope->greeting)->toBe('Hello admin!')
        ->and($envelope->prompt)->toBe('Admin-only instructions.')
        ->and($envelope->summary)->toBe('Admin context');

    $response = $this->postJson('/chatbot/messages', [
        'signed_context' => $adminToken,
        'message' => 'hi',
    ])->assertOk();

    ob_start();
    $response->baseResponse->sendContent();
    $output = (string) ob_get_clean();

    $events = decodedSseEvents($output);
    $summaryEvent = collect($events)->firstWhere('event', 'context_summary');
    expect($summaryEvent)->not->toBeNull()
        ->and($summaryEvent['data']['summary'])->toBe('Admin context');
});
