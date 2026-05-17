<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Facades\Chatbot;
use Aanfarhan\Chatbot\Testing\InteractsWithChatbot;
use Aanfarhan\Chatbot\Tests\Stubs\FailingTool;
use Aanfarhan\Chatbot\Tests\Stubs\LookupOrderTool;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\View;
use Illuminate\Testing\TestResponse;

uses(RefreshDatabase::class);
uses(InteractsWithChatbot::class);

beforeEach(function (): void {
    config()->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
    View::addLocation(__DIR__.'/fixtures');
    Chatbot::clearTools();

    Route::middleware('web')->get('/orders/{order}', function ($order) {
        Chatbot::context(['order' => ['id' => (int) $order, 'total' => 45]]);

        return view('order-page', ['order' => (int) $order]);
    })->name('orders.show');
});

function drain(TestResponse $response): void
{
    ob_start();
    $response->baseResponse->sendContent();
    ob_end_clean();
}

it('writes a chatbot_tool_invocations row with status=ok after a successful tool call via the endpoint', function (): void {
    Chatbot::registerTool(LookupOrderTool::class);
    Chatbot::tools(['lookup_order']);

    $fake = Chatbot::fake();
    $fake->respondWithToolCall('lookup_order', ['order_id' => 42], 'call_endpoint_ok');
    $fake->respondWithStream(['Order 42 is confirmed.']);

    $envelope = $this->extractSignedContext($this->get('/orders/42'));

    $response = $this->postJson('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'What is order 42?',
    ])->assertOk();

    drain($response);

    $rows = DB::table('chatbot_tool_invocations')->get();
    expect($rows)->toHaveCount(1);
    expect($rows[0]->tool_name)->toBe('lookup_order');
    expect($rows[0]->status)->toBe('ok');
});

it('writes a chatbot_tool_invocations row with status=handler_error when the handler throws via the endpoint', function (): void {
    Chatbot::registerTool(FailingTool::class);
    Chatbot::tools(['failing_op']);

    $fake = Chatbot::fake();
    $fake->respondWithToolCall('failing_op', [], 'call_endpoint_fail');
    $fake->respondWithStream(['Error.']);

    $envelope = $this->extractSignedContext($this->get('/orders/1'));

    $response = $this->postJson('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'do it',
    ])->assertOk();

    drain($response);

    $rows = DB::table('chatbot_tool_invocations')->get();
    expect($rows)->toHaveCount(1);
    expect($rows[0]->status)->toBe('handler_error');
    expect($rows[0]->error)->not->toBeNull();
});
