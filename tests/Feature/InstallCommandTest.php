<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Schema;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

function testbenchConfigPath(string $file = ''): string
{
    return app()->configPath($file);
}

function testbenchEnvPath(): string
{
    return app()->basePath('.env');
}

function testbenchLayoutDir(): string
{
    return app()->resourcePath('views/layouts');
}

function testbenchLayoutPath(): string
{
    return testbenchLayoutDir().'/app.blade.php';
}

afterEach(function (): void {
    $configPath = testbenchConfigPath('chatbot.php');
    if (file_exists($configPath)) {
        @unlink($configPath);
    }

    $envPath = testbenchEnvPath();
    if (file_exists($envPath)) {
        @unlink($envPath);
    }

    $layoutPath = testbenchLayoutPath();
    if (file_exists($layoutPath)) {
        @unlink($layoutPath);
    }

    $layoutDir = testbenchLayoutDir();
    if (is_dir($layoutDir) && count(glob($layoutDir.'/*') ?: []) === 0) {
        @rmdir($layoutDir);
    }
});

// --- Slice 1: tracer bullet ---

it('exits zero on fresh install with --no-interaction', function (): void {
    $this->artisan('chatbot:install', ['--no-interaction' => true])
        ->assertExitCode(0);
});

// --- Slice 2: config published ---

it('publishes config to host app config directory', function (): void {
    $configPath = testbenchConfigPath('chatbot.php');
    expect(file_exists($configPath))->toBeFalse();

    $this->artisan('chatbot:install', ['--no-interaction' => true]);

    expect(file_exists($configPath))->toBeTrue();
});

// --- Slice 3: migrations run ---

it('runs package migrations creating chatbot tables', function (): void {
    $this->artisan('chatbot:install', ['--no-interaction' => true]);

    expect(Schema::hasTable('chatbot_conversations'))->toBeTrue()
        ->and(Schema::hasTable('chatbot_messages'))->toBeTrue();
});

// --- Slice 4: .env updated ---

it('writes LLM settings to .env using defaults in --no-interaction mode', function (): void {
    $envPath = testbenchEnvPath();
    file_put_contents($envPath, '');

    $this->artisan('chatbot:install', ['--no-interaction' => true]);

    $env = file_get_contents($envPath);
    expect($env)
        ->toContain('CHATBOT_BASE_URL=')
        ->toContain('CHATBOT_API_KEY=')
        ->toContain('CHATBOT_MODEL=');
});

// --- Slice 5: snippet injection ---

it('injects @chatbot snippet into auto-detected layout', function (): void {
    $layoutDir = testbenchLayoutDir();
    @mkdir($layoutDir, 0755, true);
    file_put_contents(testbenchLayoutPath(), "<html>\n<body>\n</body>\n</html>");

    $this->artisan('chatbot:install', ['--no-interaction' => true]);

    expect(file_get_contents(testbenchLayoutPath()))->toContain('@chatbot');
});

it('injects @chatbot snippet into layout specified via --layout option', function (): void {
    $layoutDir = testbenchLayoutDir();
    @mkdir($layoutDir, 0755, true);
    $customPath = testbenchLayoutDir().'/custom.blade.php';
    file_put_contents($customPath, "<html>\n<body>\n</body>\n</html>");

    $this->artisan('chatbot:install', [
        '--no-interaction' => true,
        '--layout' => $customPath,
    ]);

    expect(file_get_contents($customPath))->toContain('@chatbot');

    @unlink($customPath);
});

it('does not fail when no layout is detected', function (): void {
    $this->artisan('chatbot:install', ['--no-interaction' => true])
        ->assertExitCode(0);
});

// --- Slice 6: idempotency ---

it('does not overwrite existing config on re-run', function (): void {
    $configPath = testbenchConfigPath('chatbot.php');
    file_put_contents($configPath, '<?php return ["custom_marker" => true];');

    $this->artisan('chatbot:install', ['--no-interaction' => true]);

    expect(file_get_contents($configPath))->toContain('custom_marker');
});

it('preserves existing .env keys on re-run', function (): void {
    $envPath = testbenchEnvPath();
    file_put_contents($envPath, "CHATBOT_API_KEY=my-secret-key\n");

    $this->artisan('chatbot:install', ['--no-interaction' => true]);

    expect(file_get_contents($envPath))->toContain('CHATBOT_API_KEY=my-secret-key');
});

it('skips snippet injection when layout already contains @chatbot', function (): void {
    $layoutDir = testbenchLayoutDir();
    @mkdir($layoutDir, 0755, true);
    $original = "<html>\n<body>\n    @chatbot\n</body>\n</html>";
    file_put_contents(testbenchLayoutPath(), $original);

    $this->artisan('chatbot:install', ['--no-interaction' => true]);

    $content = file_get_contents(testbenchLayoutPath());
    expect(substr_count($content, '@chatbot'))->toBe(1);
});

// --- Slice 7: interactive prompts ---

it('prompts for LLM settings in interactive mode', function (): void {
    $envPath = testbenchEnvPath();
    file_put_contents($envPath, '');

    $this->artisan('chatbot:install')
        ->expectsQuestion('LLM provider base URL', 'https://custom.api.com/v1')
        ->expectsQuestion('LLM API key', 'sk-test-key')
        ->expectsQuestion('LLM model name', 'gpt-4o')
        ->assertExitCode(0);

    $env = file_get_contents($envPath);
    expect($env)
        ->toContain('CHATBOT_BASE_URL=https://custom.api.com/v1')
        ->toContain('CHATBOT_API_KEY=sk-test-key')
        ->toContain('CHATBOT_MODEL=gpt-4o');
});

it('prompts for layout injection confirmation in interactive mode', function (): void {
    $layoutDir = testbenchLayoutDir();
    @mkdir($layoutDir, 0755, true);
    file_put_contents(testbenchLayoutPath(), "<html>\n<body>\n</body>\n</html>");

    $this->artisan('chatbot:install')
        ->expectsQuestion('LLM provider base URL', 'https://api.openai.com/v1')
        ->expectsQuestion('LLM API key', '')
        ->expectsQuestion('LLM model name', 'gpt-4o-mini')
        ->expectsConfirmation('Inject @chatbot snippet into '.testbenchLayoutPath().'?', 'yes')
        ->assertExitCode(0);

    expect(file_get_contents(testbenchLayoutPath()))->toContain('@chatbot');
});
