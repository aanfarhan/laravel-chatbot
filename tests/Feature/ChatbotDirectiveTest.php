<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\Envelopes\ContextEnvelope;
use Aanfarhan\Chatbot\Facades\Chatbot;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\View;

beforeEach(function (): void {
    config()->set('app.key', 'base64:'.base64_encode(random_bytes(32)));

    View::addLocation(__DIR__.'/fixtures');

    Route::middleware('web')->get('/orders/{order}', function ($order) {
        Chatbot::context(['order' => ['id' => (int) $order]]);

        return view('order-page', ['order' => (int) $order]);
    })->name('orders.show');
});

it('@chatbot renders a chatbot-widget tag with a verifiable signed-context', function (): void {
    $response = $this->get('/orders/7');

    $response->assertOk();

    $html = $response->getContent() ?: '';
    expect($html)->toContain('<chatbot-widget');
    expect($html)->toContain('channel="default"');

    expect(preg_match('/signed-context="([^"]+)"/', $html, $matches))->toBe(1);
    $token = $matches[1];

    $envelope = app(ContextEnvelope::class)->verify($token, expected: [
        'userId' => null,
        'route' => 'orders.show',
        'channel' => 'default',
    ]);

    expect($envelope->payload)->toBe(['order' => ['id' => 7]]);
});

it("@chatbot('admin') mints an envelope bound to the named channel and the current user", function (): void {
    Route::middleware('web')->get('/admin', function () {
        Chatbot::channel('admin')->context(['report' => 'q3']);

        return view('admin-page');
    })->name('admin.dashboard');

    $user = new class implements Authenticatable
    {
        public function getAuthIdentifierName(): string
        {
            return 'id';
        }

        public function getAuthIdentifier(): int
        {
            return 99;
        }

        public function getAuthPasswordName(): string
        {
            return 'password';
        }

        public function getAuthPassword(): string
        {
            return '';
        }

        public function getRememberToken(): string
        {
            return '';
        }

        public function setRememberToken($value): void {}

        public function getRememberTokenName(): string
        {
            return '';
        }
    };

    Auth::setUser($user);

    $response = $this->get('/admin');
    $html = $response->getContent() ?: '';

    expect($html)->toContain('channel="admin"');
    preg_match('/signed-context="([^"]+)"/', $html, $matches);

    $envelope = app(ContextEnvelope::class)->verify($matches[1], expected: [
        'userId' => '99',
        'route' => 'admin.dashboard',
        'channel' => 'admin',
    ]);

    expect($envelope->payload)->toBe(['report' => 'q3']);
});
