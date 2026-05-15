<?php

declare(strict_types=1);

// --- Slice 1: tracer bullet ---

it('exits zero and prints the demo URL', function (): void {
    $this->artisan('chatbot:demo')
        ->assertExitCode(0)
        ->expectsOutputToContain('/chatbot/demo');
});

// --- Slice 2: production warning ---

it('emits a production-specific warning when APP_ENV is production', function (): void {
    $this->app->instance('env', 'production');

    $this->artisan('chatbot:demo')
        ->assertExitCode(0)
        ->expectsOutputToContain('WARNING');
});

it('does not emit the production WARNING on non-production env', function (): void {
    $this->app->instance('env', 'local');

    $this->artisan('chatbot:demo')
        ->assertExitCode(0)
        ->doesntExpectOutputToContain('WARNING');
});

// --- Slice 7: idempotency ---

it('is re-runnable without error', function (): void {
    $this->artisan('chatbot:demo')->assertExitCode(0);
    $this->artisan('chatbot:demo')->assertExitCode(0);
});
