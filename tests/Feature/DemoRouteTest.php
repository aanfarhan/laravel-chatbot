<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Testing\InteractsWithChatbot;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);
uses(InteractsWithChatbot::class);

beforeEach(function (): void {
    config()->set('app.key', 'base64:'.base64_encode(random_bytes(32)));
});

// --- Slice 3: demo disabled by default ---

it('returns 404 when chatbot.demo.enabled is false', function (): void {
    $this->app['config']->set('chatbot.demo.enabled', false);

    $this->get('/chatbot/demo')->assertStatus(404);
});

// --- Slice 4: demo route enabled ---

it('returns 200 when chatbot.demo.enabled is true', function (): void {
    $this->app['config']->set('chatbot.demo.enabled', true);

    $this->get('/chatbot/demo')->assertStatus(200);
});

// --- Slice 5: widget present ---

it('renders the chatbot widget on the demo page', function (): void {
    $this->app['config']->set('chatbot.demo.enabled', true);

    $this->get('/chatbot/demo')->assertSee('chatbot-widget', escape: false);
});

// --- Slice 6: canned streamed reply ---

it('sends a streamed canned reply when a message is posted in demo mode', function (): void {
    $this->app['config']->set('chatbot.demo.enabled', true);

    $envelope = $this->extractSignedContext($this->get('/chatbot/demo'));

    $response = $this->post('/chatbot/messages', [
        'signed_context' => $envelope,
        'message' => 'Where is my order?',
    ]);

    $response->assertStatus(200)
        ->assertHeader('Content-Type', 'text/event-stream; charset=UTF-8');

    ob_start();
    $response->baseResponse->sendContent();
    $raw = ob_get_clean();

    expect($raw)->toContain('event: token');
});
