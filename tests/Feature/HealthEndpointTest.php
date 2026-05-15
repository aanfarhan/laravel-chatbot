<?php

declare(strict_types=1);

it('returns version, active_streams, and status ok', function (): void {
    $response = $this->getJson('/chatbot/health');

    $response->assertOk()
        ->assertJsonStructure(['version', 'active_streams', 'status'])
        ->assertJsonPath('status', 'ok');
});

it('reflects active stream count from cache', function (): void {
    cache()->put('chatbot.active_streams', 3);

    $this->getJson('/chatbot/health')
        ->assertOk()
        ->assertJsonPath('active_streams', 3);
});
