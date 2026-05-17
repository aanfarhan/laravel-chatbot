<?php

declare(strict_types=1);

use Aanfarhan\Chatbot\ChatbotServiceProvider;
use Illuminate\Support\ServiceProvider;

function makeToolPath(string $relative = ''): string
{
    return app()->basePath('app/Chatbot/Tools'.($relative === '' ? '' : '/'.$relative));
}

function publishedStubPath(): string
{
    return app()->basePath('stubs/chatbot-tool.stub');
}

afterEach(function (): void {
    $dir = makeToolPath();
    if (is_dir($dir)) {
        foreach (glob($dir.'/*') ?: [] as $f) {
            @unlink($f);
        }
        @rmdir($dir);
        @rmdir(dirname($dir));
    }

    $stub = publishedStubPath();
    if (file_exists($stub)) {
        @unlink($stub);
        @rmdir(dirname($stub));
    }
});

// --- Slice 1: tracer ---

it('exits zero on chatbot:make-tool GetWeather', function (): void {
    $this->artisan('chatbot:make-tool', ['name' => 'GetWeather'])
        ->assertExitCode(0);
});

// --- Slice 2: file written ---

it('writes generated tool file under app/Chatbot/Tools', function (): void {
    $this->artisan('chatbot:make-tool', ['name' => 'GetWeather']);

    expect(file_exists(makeToolPath('GetWeatherTool.php')))->toBeTrue();
});

// --- Slice 3: namespace + implements ---

it('declares App\\Chatbot\\Tools namespace and implements ChatbotTool', function (): void {
    $this->artisan('chatbot:make-tool', ['name' => 'GetWeather']);

    $contents = (string) file_get_contents(makeToolPath('GetWeatherTool.php'));

    expect($contents)
        ->toContain('namespace App\\Chatbot\\Tools;')
        ->toContain('implements ChatbotTool')
        ->toContain('use Aanfarhan\\Chatbot\\Contracts\\ChatbotTool;');
});

// --- Slice 4: name normalization ---

it('normalizes snake_case input to StudlyCase class with Tool suffix and snake_case name()', function (): void {
    $this->artisan('chatbot:make-tool', ['name' => 'get_weather']);

    $path = makeToolPath('GetWeatherTool.php');
    expect(file_exists($path))->toBeTrue();

    $contents = (string) file_get_contents($path);
    expect($contents)
        ->toContain('class GetWeatherTool')
        ->toContain("return 'get_weather';");
});

it('does not double-append Tool suffix when input already ends with Tool', function (): void {
    $this->artisan('chatbot:make-tool', ['name' => 'GetWeatherTool']);

    expect(file_exists(makeToolPath('GetWeatherTool.php')))->toBeTrue();

    $contents = (string) file_get_contents(makeToolPath('GetWeatherTool.php'));
    expect($contents)->toContain('class GetWeatherTool');
});

// --- Slice 5: worked example body ---

it('renders a worked example body with realistic schema, authorize and handle', function (): void {
    $this->artisan('chatbot:make-tool', ['name' => 'GetWeather']);

    $contents = (string) file_get_contents(makeToolPath('GetWeatherTool.php'));

    expect($contents)
        ->toContain("'type' => 'object'")
        ->toContain("'query'")
        ->toContain("'required'")
        ->toContain('$actor !== null')
        ->toContain("'result'")
        ->toContain('// TODO');
});

// --- Slice 6: registration hint ---

it('prints the Chatbot::registerTool hint with the fully-qualified class', function (): void {
    $this->artisan('chatbot:make-tool', ['name' => 'GetWeather'])
        ->expectsOutputToContain('Chatbot::registerTool(\\App\\Chatbot\\Tools\\GetWeatherTool::class);');
});

// --- Slice 7: prefer host-published stub ---

it('prefers a host-published stub over the package default', function (): void {
    $stubPath = publishedStubPath();
    @mkdir(dirname($stubPath), 0755, true);
    file_put_contents($stubPath, "<?php\n// CUSTOM_STUB_MARKER class={{ class }} name={{ name }}\n");

    $this->artisan('chatbot:make-tool', ['name' => 'GetWeather']);

    $contents = (string) file_get_contents(makeToolPath('GetWeatherTool.php'));
    expect($contents)
        ->toContain('CUSTOM_STUB_MARKER')
        ->toContain('class=GetWeatherTool')
        ->toContain('name=get_weather');
});

// --- Slice 8: stub publish group registered ---

it('registers the stub file under a publish group so stub:publish can pick it up', function (): void {
    $paths = ServiceProvider::pathsToPublish(ChatbotServiceProvider::class, 'chatbot-stubs');

    $matches = array_filter(
        array_values($paths),
        fn (string $p): bool => str_ends_with($p, 'chatbot-tool.stub'),
    );

    expect($matches)->not->toBeEmpty();
});
