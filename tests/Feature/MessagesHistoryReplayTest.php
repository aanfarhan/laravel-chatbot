<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Contracts\ToolInvocationStore;
use Aanfarhan\Chatbot\Facades\Chatbot;
use Aanfarhan\Chatbot\Testing\InteractsWithChatbot;
use Aanfarhan\Chatbot\Tests\Stubs\LookupOrderTool;
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

function drainReplay(TestResponse $response): void
{
    ob_start();
    $response->baseResponse->sendContent();
    ob_end_clean();
}

/**
 * Index of the message with the given role/content in the sent prompt, or -1.
 *
 * @param  list<array<string, mixed>>  $messages
 */
function promptIndexOf(array $messages, string $role, string $content): int
{
    foreach ($messages as $i => $m) {
        if (($m['role'] ?? null) === $role && ($m['content'] ?? null) === $content) {
            return $i;
        }
    }

    return -1;
}

it('replays prior user and assistant turns into the prompt, in order, between system and current user', function (): void {
    $store = app(ConversationStore::class);
    $owned = $store->start('default', userId: null, guestToken: 'guest-X');
    $store->append($owned->id, 'user', 'what is order 1', 'orders.show', 'hash');
    $store->append($owned->id, 'assistant', 'order 1 is confirmed', 'orders.show', 'hash');

    $fake = Chatbot::fake()->respondWithStream(['ok']);
    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->withCredentials()
        ->withCookie('chatbot_conversation_default', $owned->uuid)
        ->withCookie('chatbot_guest_id', 'guest-X')
        ->postJson('/chatbot/messages', [
            'signed_context' => $envelope,
            'message' => 'and order 2?',
        ])->assertOk();
    drainReplay($response);

    $fake->assertSentPrompt(function (array $messages): bool {
        $system = promptIndexOf($messages, 'system', $messages[0]['content'] ?? '__none__');
        $priorUser = promptIndexOf($messages, 'user', 'what is order 1');
        $priorAssistant = promptIndexOf($messages, 'assistant', 'order 1 is confirmed');
        $current = -1;
        foreach ($messages as $i => $m) {
            if (($m['role'] ?? null) === 'user' && str_starts_with((string) ($m['content'] ?? ''), 'and order 2?')) {
                $current = $i;
            }
        }

        return $system === 0
            && $priorUser > $system
            && $priorAssistant > $priorUser
            && $current > $priorAssistant;
    });
});

it('strips stale client-extractor blocks out of loaded historical user turns', function (): void {
    $store = app(ConversationStore::class);
    $owned = $store->start('default', userId: null, guestToken: 'guest-X');
    $store->append(
        $owned->id,
        'user',
        "show me\n\n<client-extractor name=\"page_title\" trust=\"untrusted-page-content\">\nStale Page Title\n</client-extractor>",
        'orders.show',
        'hash',
    );

    $fake = Chatbot::fake()->respondWithStream(['ok']);
    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->withCredentials()
        ->withCookie('chatbot_conversation_default', $owned->uuid)
        ->withCookie('chatbot_guest_id', 'guest-X')
        ->postJson('/chatbot/messages', [
            'signed_context' => $envelope,
            'message' => 'next',
        ])->assertOk();
    drainReplay($response);

    $fake->assertSentPrompt(function (array $messages): bool {
        $hasStripped = promptIndexOf($messages, 'user', 'show me') >= 0;
        $leaked = false;
        foreach ($messages as $m) {
            if (($m['role'] ?? null) === 'user' && str_contains((string) ($m['content'] ?? ''), 'Stale Page Title')) {
                $leaked = true;
            }
        }

        return $hasStripped && ! $leaked;
    });
});

it('prunes the oldest history turns first when the prompt exceeds the token cap, keeping system and current user', function (): void {
    config()->set('chatbot.token_cap', 700);

    $store = app(ConversationStore::class);
    $owned = $store->start('default', userId: null, guestToken: 'guest-X');
    // Each turn ~500 tokens (2000 chars / 4); two together blow a 700-token cap.
    $store->append($owned->id, 'user', str_repeat('A', 2000), 'orders.show', 'hash');
    $store->append($owned->id, 'user', str_repeat('B', 2000), 'orders.show', 'hash');

    $fake = Chatbot::fake()->respondWithStream(['ok']);
    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->withCredentials()
        ->withCookie('chatbot_conversation_default', $owned->uuid)
        ->withCookie('chatbot_guest_id', 'guest-X')
        ->postJson('/chatbot/messages', [
            'signed_context' => $envelope,
            'message' => 'newest',
        ])->assertOk();
    drainReplay($response);

    $fake->assertSentPrompt(function (array $messages): bool {
        $oldest = promptIndexOf($messages, 'user', str_repeat('A', 2000));
        $newer = promptIndexOf($messages, 'user', str_repeat('B', 2000));
        $systemPresent = ($messages[0]['role'] ?? null) === 'system';
        $currentPresent = false;
        foreach ($messages as $m) {
            if (($m['role'] ?? null) === 'user' && str_starts_with((string) ($m['content'] ?? ''), 'newest')) {
                $currentPresent = true;
            }
        }

        return $oldest === -1 && $newer >= 0 && $systemPresent && $currentPresent;
    });
});

it('replays tool invocations inside the freshness window and omits those outside it', function (): void {
    config()->set('chatbot.tools.replay_freshness', 300);
    Chatbot::clearTools();
    Chatbot::registerTool(LookupOrderTool::class);

    $store = app(ConversationStore::class);
    $invocations = app(ToolInvocationStore::class);
    $owned = $store->start('default', userId: null, guestToken: 'guest-X');

    // Outside the 300s window — kept for audit, omitted from the prompt.
    $invocations->record(
        conversationId: $owned->id,
        messageId: null,
        toolName: 'lookup_order',
        arguments: ['order_id' => 1],
        result: '{"freshness":"stale"}',
        status: 'ok',
        error: null,
        startedAt: now()->subSeconds(600),
        finishedAt: now()->subSeconds(600),
    );

    // Inside the window — replayed as an assistant tool_call + tool result pair.
    $invocations->record(
        conversationId: $owned->id,
        messageId: null,
        toolName: 'lookup_order',
        arguments: ['order_id' => 2],
        result: '{"freshness":"fresh"}',
        status: 'ok',
        error: null,
        startedAt: now()->subSeconds(60),
        finishedAt: now()->subSeconds(60),
    );

    $fake = Chatbot::fake()->respondWithStream(['ok']);
    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->withCredentials()
        ->withCookie('chatbot_conversation_default', $owned->uuid)
        ->withCookie('chatbot_guest_id', 'guest-X')
        ->postJson('/chatbot/messages', [
            'signed_context' => $envelope,
            'message' => 'continue',
        ])->assertOk();
    drainReplay($response);

    $fake->assertSentPrompt(function (array $messages): bool {
        $freshToolResult = false;
        $staleToolResult = false;
        $freshToolCall = false;
        foreach ($messages as $m) {
            if (($m['role'] ?? null) === 'tool' && str_contains((string) ($m['content'] ?? ''), '"freshness":"fresh"')) {
                $freshToolResult = true;
            }
            if (($m['role'] ?? null) === 'tool' && str_contains((string) ($m['content'] ?? ''), '"freshness":"stale"')) {
                $staleToolResult = true;
            }
            if (($m['role'] ?? null) === 'assistant' && isset($m['tool_calls'])) {
                $freshToolCall = true;
            }
        }

        return $freshToolResult && $freshToolCall && ! $staleToolResult;
    });

    // The stale record is omitted from the prompt but stays in the store.
    expect(DB::table('chatbot_tool_invocations')->where('conversation_id', $owned->id)->count())->toBe(2);
});

it('replays plain user and assistant turns regardless of age, ignoring the tool freshness window', function (): void {
    config()->set('chatbot.tools.replay_freshness', 60);

    $store = app(ConversationStore::class);
    $owned = $store->start('default', userId: null, guestToken: 'guest-X');

    // Backdate the plain turns far beyond the 60s tool freshness window.
    $this->travelTo(now()->subSeconds(1000));
    $store->append($owned->id, 'user', 'ancient question', 'orders.show', 'hash');
    $store->append($owned->id, 'assistant', 'ancient answer', 'orders.show', 'hash');
    $this->travelBack();

    $fake = Chatbot::fake()->respondWithStream(['ok']);
    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->withCredentials()
        ->withCookie('chatbot_conversation_default', $owned->uuid)
        ->withCookie('chatbot_guest_id', 'guest-X')
        ->postJson('/chatbot/messages', [
            'signed_context' => $envelope,
            'message' => 'now',
        ])->assertOk();
    drainReplay($response);

    $fake->assertSentPrompt(function (array $messages): bool {
        return promptIndexOf($messages, 'user', 'ancient question') >= 0
            && promptIndexOf($messages, 'assistant', 'ancient answer') >= 0;
    });
});

it('interleaves plain turns and tool pairs chronologically without duplicating the tool-only assistant turn', function (): void {
    config()->set('chatbot.tools.replay_freshness', 300);
    Chatbot::clearTools();
    Chatbot::registerTool(LookupOrderTool::class);

    $store = app(ConversationStore::class);
    $invocations = app(ToolInvocationStore::class);
    $owned = $store->start('default', userId: null, guestToken: 'guest-X');

    // A realistic tool turn: user asks, tool runs, assistant emits no prose
    // (tool-only) so its persisted message is empty.
    $this->travelTo(now()->subSeconds(200));
    $store->append($owned->id, 'user', 'track my order', 'orders.show', 'hash');
    $this->travelTo(now()->addSeconds(2)); // ~now-198
    $store->append($owned->id, 'assistant', '', 'orders.show', 'hash');
    $this->travelBack();

    $invocations->record(
        conversationId: $owned->id,
        messageId: null,
        toolName: 'lookup_order',
        arguments: ['order_id' => 9],
        result: '{"status":"shipped"}',
        status: 'ok',
        error: null,
        startedAt: now()->subSeconds(199),
        finishedAt: now()->subSeconds(199),
    );

    $fake = Chatbot::fake()->respondWithStream(['ok']);
    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->withCredentials()
        ->withCookie('chatbot_conversation_default', $owned->uuid)
        ->withCookie('chatbot_guest_id', 'guest-X')
        ->postJson('/chatbot/messages', [
            'signed_context' => $envelope,
            'message' => 'now',
        ])->assertOk();
    drainReplay($response);

    $fake->assertSentPrompt(function (array $messages): bool {
        $userIdx = -1;
        $toolCallIdx = -1;
        $toolResultIdx = -1;
        $currentIdx = -1;
        $emptyAssistant = false;

        foreach ($messages as $i => $m) {
            $role = $m['role'] ?? null;
            $content = (string) ($m['content'] ?? '');

            if ($role === 'user' && $content === 'track my order') {
                $userIdx = $i;
            }
            if ($role === 'assistant' && isset($m['tool_calls'])) {
                $toolCallIdx = $i;
            }
            if ($role === 'tool' && str_contains($content, '"status":"shipped"')) {
                $toolResultIdx = $i;
            }
            if ($role === 'user' && str_starts_with($content, 'now')) {
                $currentIdx = $i;
            }
            if ($role === 'assistant' && ! isset($m['tool_calls']) && $content === '') {
                $emptyAssistant = true;
            }
        }

        return $userIdx >= 0
            && $userIdx < $toolCallIdx
            && $toolCallIdx < $toolResultIdx
            && $toolResultIdx < $currentIdx
            && ! $emptyAssistant;
    });
});

it('scopes replayed history to the resolved conversation, never leaking another conversation owned by the same party', function (): void {
    $store = app(ConversationStore::class);
    $alpha = $store->start('default', userId: null, guestToken: 'guest-X');
    $bravo = $store->start('default', userId: null, guestToken: 'guest-X');
    $store->append($alpha->id, 'user', 'alpha turn', 'orders.show', 'hash');
    $store->append($bravo->id, 'user', 'bravo turn', 'orders.show', 'hash');

    $fake = Chatbot::fake()->respondWithStream(['ok']);
    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->withCredentials()
        ->withCookie('chatbot_conversation_default', $alpha->uuid)
        ->withCookie('chatbot_guest_id', 'guest-X')
        ->postJson('/chatbot/messages', [
            'signed_context' => $envelope,
            'message' => 'resume alpha',
        ])->assertOk();
    drainReplay($response);

    $fake->assertSentPrompt(function (array $messages): bool {
        return promptIndexOf($messages, 'user', 'alpha turn') >= 0
            && promptIndexOf($messages, 'user', 'bravo turn') === -1;
    });
});

it('assembles a brand-new conversation with empty history (system + current user only)', function (): void {
    $fake = Chatbot::fake()->respondWithStream(['ok']);
    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->postJson('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'first ever message',
    ])->assertOk();
    drainReplay($response);

    $fake->assertSentPrompt(function (array $messages): bool {
        return count($messages) === 2
            && ($messages[0]['role'] ?? null) === 'system'
            && ($messages[1]['role'] ?? null) === 'user'
            && str_starts_with((string) ($messages[1]['content'] ?? ''), 'first ever message');
    });
});

it('per-channel replay_freshness overrides the global freshness window', function (): void {
    // Global window is large (10 min); channel window is short (1 min).
    config()->set('chatbot.tools.replay_freshness', 600);
    config()->set('chatbot.channels.default.replay_freshness', 60);

    Chatbot::clearTools();
    Chatbot::registerTool(LookupOrderTool::class);

    $store = app(ConversationStore::class);
    $invocations = app(ToolInvocationStore::class);
    $owned = $store->start('default', userId: null, guestToken: 'guest-per-channel');

    // Recorded 120s ago — inside the global 600s window, outside the channel 60s window.
    $invocations->record(
        conversationId: $owned->id,
        messageId: null,
        toolName: 'lookup_order',
        arguments: ['order_id' => 99],
        result: '{"channel_freshness":"should_be_excluded"}',
        status: 'ok',
        error: null,
        startedAt: now()->subSeconds(120),
        finishedAt: now()->subSeconds(120),
    );

    $fake = Chatbot::fake()->respondWithStream(['ok']);
    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->withCredentials()
        ->withCookie('chatbot_conversation_default', $owned->uuid)
        ->withCookie('chatbot_guest_id', 'guest-per-channel')
        ->postJson('/chatbot/messages', [
            'signed_context' => $envelope,
            'message' => 'continue',
        ])->assertOk();
    drainReplay($response);

    $fake->assertSentPrompt(function (array $messages): bool {
        foreach ($messages as $m) {
            if (($m['role'] ?? null) === 'tool' && str_contains((string) ($m['content'] ?? ''), 'should_be_excluded')) {
                return false; // stale by channel window — must not appear
            }
        }

        return true;
    });
});
