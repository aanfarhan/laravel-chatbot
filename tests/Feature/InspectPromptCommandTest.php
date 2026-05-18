<?php

declare(strict_types=1);
use Illuminate\Support\Facades\Artisan;

// --- Slice 1: tracer bullet ---

it('exits zero with --route flag', function (): void {
    $this->artisan('chatbot:inspect-prompt', ['--route' => 'orders.show'])
        ->assertExitCode(0);
});

// --- Slice 2: output format ---

it('output contains system message JSON', function (): void {
    $this->artisan('chatbot:inspect-prompt', ['--route' => 'orders.show'])
        ->assertExitCode(0)
        ->expectsOutputToContain('"role": "system"');
});

it('output contains user message JSON', function (): void {
    $this->artisan('chatbot:inspect-prompt', ['--route' => 'orders.show'])
        ->assertExitCode(0)
        ->expectsOutputToContain('[sample user message]');
});

// --- Slice 3: context-json injection ---

it('--context-json injects sample context into the assembled prompt', function (): void {
    $tmpFile = tempnam(sys_get_temp_dir(), 'chatbot_ctx_').'.json';
    file_put_contents($tmpFile, json_encode(['order' => ['id' => 99, 'status' => 'shipped']]));

    $this->artisan('chatbot:inspect-prompt', [
        '--route' => 'orders.show',
        '--context-json' => $tmpFile,
    ])
        ->assertExitCode(0)
        ->expectsOutputToContain('<order>');

    @unlink($tmpFile);
});

// --- Slice 4: --channel uses channel system_prompt ---

it('--channel includes the channel system_prompt in output', function (): void {
    config()->set('chatbot.channels.support.system_prompt', 'You are a support specialist.');

    $this->artisan('chatbot:inspect-prompt', [
        '--route' => 'support.chat',
        '--channel' => 'support',
    ])
        ->assertExitCode(0)
        ->expectsOutputToContain('You are a support specialist.');
});

// --- Slice 5: --user reflected in header ---

it('--user flag appears in the inspection header', function (): void {
    $this->artisan('chatbot:inspect-prompt', [
        '--route' => 'orders.show',
        '--user' => '42',
    ])
        ->assertExitCode(0)
        ->expectsOutputToContain('user=42');
});

// --- Slice 6: missing --route exits non-zero ---

it('exits non-zero when --route is not provided', function (): void {
    $this->artisan('chatbot:inspect-prompt')
        ->assertExitCode(1);
});

// --- Slice 7: invalid --context-json path ---

it('exits non-zero when --context-json file does not exist', function (): void {
    $this->artisan('chatbot:inspect-prompt', [
        '--route' => 'orders.show',
        '--context-json' => '/tmp/does-not-exist-chatbot-test.json',
    ])
        ->assertExitCode(1)
        ->expectsOutputToContain('not found');
});

// --- Slice 8: --extractor-json injects extractor blocks ---

it('--extractor-json injects extractor blocks into the assembled prompt', function (): void {
    $tmpFile = tempnam(sys_get_temp_dir(), 'chatbot_ext_').'.json';
    file_put_contents($tmpFile, json_encode([
        ['name' => 'article', 'output' => 'Sample article content for inspection.'],
    ]));

    Artisan::call('chatbot:inspect-prompt', [
        '--route' => 'orders.show',
        '--extractor-json' => $tmpFile,
        '--allowed-extractors' => 'article',
    ]);

    $output = Artisan::output();

    expect($output)->toContain('client-extractor')
        ->and($output)->toContain('Sample article content for inspection.');

    @unlink($tmpFile);
});

it('exits non-zero when --extractor-json file does not exist', function (): void {
    $this->artisan('chatbot:inspect-prompt', [
        '--route' => 'orders.show',
        '--extractor-json' => '/tmp/does-not-exist-chatbot-ext-test.json',
    ])
        ->assertExitCode(1)
        ->expectsOutputToContain('not found');
});
