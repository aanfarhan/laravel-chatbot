<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Facades\Chatbot;
use Aanfarhan\Chatbot\Testing\InteractsWithChatbot;
use Aanfarhan\Chatbot\Tests\Stubs\ActorCaptureTool;
use Aanfarhan\Chatbot\Tests\Stubs\FakeUser;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\View;
use Illuminate\Testing\TestResponse;

uses(RefreshDatabase::class);
uses(InteractsWithChatbot::class);

beforeEach(function (): void {
    config()->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
    config()->set('auth.providers.users.model', FakeUser::class);
    View::addLocation(__DIR__.'/fixtures');

    Schema::create('users', function ($table): void {
        $table->id();
        $table->string('name')->default('Test');
    });

    Chatbot::clearTools();
    ActorCaptureTool::reset();

    Route::middleware('web')->get('/orders/{order}', function ($order) {
        Chatbot::context(['order' => ['id' => (int) $order]]);

        return view('order-page', ['order' => (int) $order]);
    })->name('orders.show');
});

afterEach(function (): void {
    Schema::dropIfExists('users');
});

function drainActorTest(TestResponse $response): void
{
    ob_start();
    $response->baseResponse->sendContent();
    ob_end_clean();
}

it('threads the envelope actor into ChatbotTool::handle()', function (): void {
    $user = FakeUser::create(['name' => 'Alice']);
    $this->actingAs($user);

    Chatbot::registerTool(ActorCaptureTool::class);
    Chatbot::tools(['actor_capture']);

    $fake = Chatbot::fake();
    $fake->respondWithToolCall('actor_capture', [], 'call_actor_1');
    $fake->respondWithStream(['Done.']);

    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->postJson('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'go',
    ])->assertOk();

    drainActorTest($response);

    expect(ActorCaptureTool::$handleActorWasSet)->toBeTrue();
    expect(ActorCaptureTool::$capturedHandleActor)->not->toBeNull();
    expect(ActorCaptureTool::$capturedHandleActor?->getAuthIdentifier())->toBe($user->id);
});

it('threads a null actor into handle() on a guest turn', function (): void {
    Chatbot::registerTool(ActorCaptureTool::class);
    Chatbot::tools(['actor_capture']);

    $fake = Chatbot::fake();
    $fake->respondWithToolCall('actor_capture', [], 'call_actor_guest');
    $fake->respondWithStream(['Done.']);

    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->postJson('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'go',
    ])->assertOk();

    drainActorTest($response);

    expect(ActorCaptureTool::$handleActorWasSet)->toBeTrue();
    expect(ActorCaptureTool::$capturedHandleActor)->toBeNull();
});

it('threads the envelope actor into ChatbotTool::authorize() and lets it deny based on identity', function (): void {
    $user = FakeUser::create(['name' => 'Bob']);
    $this->actingAs($user);

    Chatbot::registerTool(ActorCaptureTool::class);
    Chatbot::tools(['actor_capture']);
    ActorCaptureTool::$authorizeUsing = static fn (?Authenticatable $a): bool => false;

    $fake = Chatbot::fake();
    $fake->respondWithToolCall('actor_capture', [], 'call_actor_authz');
    $fake->respondWithStream(['ok']);

    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->postJson('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'go',
    ])->assertOk();

    drainActorTest($response);

    expect(ActorCaptureTool::$authorizeActorWasSet)->toBeTrue();
    expect(ActorCaptureTool::$capturedAuthorizeActor?->getAuthIdentifier())->toBe($user->id);
    expect(ActorCaptureTool::$handleActorWasSet)->toBeFalse();

    $fake->assertSentPrompt(function (array $messages): bool {
        foreach ($messages as $msg) {
            if (($msg['role'] ?? '') === 'tool' && str_contains((string) ($msg['content'] ?? ''), 'not authorized')) {
                return true;
            }
        }

        return false;
    });
});
