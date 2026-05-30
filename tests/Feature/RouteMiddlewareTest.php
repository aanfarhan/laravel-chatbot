<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Facades\Chatbot;
use Aanfarhan\Chatbot\Testing\InteractsWithChatbot;
use Aanfarhan\Chatbot\Tests\Stubs\SentinelMiddleware;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Routing\RouteCollection;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\View;

uses(RefreshDatabase::class);
uses(InteractsWithChatbot::class);

beforeEach(function (): void {
    config()->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
    View::addLocation(dirname(__DIR__).'/Feature/fixtures');
});

/**
 * Re-register the package routes under a chosen middleware group. Routes load
 * once at provider boot from config, so changing the group at runtime means
 * rebuilding the route table. Re-adds the order page so an envelope can be
 * minted for happy-path assertions.
 */
function reloadChatbotRoutes(array $middleware): void
{
    config()->set('chatbot.route_middleware', $middleware);

    $router = app('router');
    $router->setRoutes(new RouteCollection);

    require dirname(__DIR__, 2).'/routes/chatbot.php';

    Route::middleware('web')->get('/orders/{order}', function ($order) {
        Chatbot::context(['order' => ['id' => (int) $order]]);

        return view('order-page', ['order' => (int) $order]);
    })->name('orders.show');

    $router->getRoutes()->refreshNameLookups();
}

it('defaults route_middleware to the web group', function (): void {
    expect(config('chatbot.route_middleware'))->toBe(['web']);
});

it('runs the write and history routes through the configured group, leaving health and widget bare', function (): void {
    reloadChatbotRoutes([SentinelMiddleware::class]);

    $this->postJson('/chatbot/messages', [])->assertStatus(499);
    $this->getJson('/chatbot/conversations/any-uuid/messages')->assertStatus(499);
    $this->getJson('/chatbot/health')->assertOk();
    $this->get('/chatbot/widget.js')->assertOk();
});

it('restores middleware-free behavior with an empty group; the write path still functions via the envelope', function (): void {
    reloadChatbotRoutes([]);

    expect(Route::getRoutes()->getByName('chatbot.messages')->middleware())->not->toContain('web');

    Chatbot::fake()->respondWithStream(['hi']);
    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->postJson('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'hello',
    ])->assertOk();

    ob_start();
    $response->baseResponse->sendContent();
    ob_end_clean();

    $this->assertDatabaseHas('chatbot_messages', ['role' => 'assistant', 'content' => 'hi']);
});

it('wraps the write and history routes in the configured group, leaving health and widget bare', function (): void {
    $middleware = fn (string $name): array => Route::getRoutes()->getByName($name)->middleware();

    expect($middleware('chatbot.messages'))->toContain('web')
        ->and($middleware('chatbot.conversations.messages'))->toContain('web')
        ->and($middleware('chatbot.health'))->not->toContain('web')
        ->and($middleware('chatbot.widget-js'))->not->toContain('web');
});
