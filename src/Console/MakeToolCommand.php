<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Console;

use Illuminate\Console\Command;

final class MakeToolCommand extends Command
{
    protected $signature = 'chatbot:make-tool {name : Class or tool name (e.g. GetWeather or get_weather)}';

    protected $description = 'Scaffold a new ChatbotTool implementation under app/Chatbot/Tools';

    public function handle(): int
    {
        /** @var string $name */
        $name = $this->argument('name');

        $class = $this->classNameFor($name);
        $toolName = $this->toolNameFor($class);
        $dir = $this->laravel->basePath('app/Chatbot/Tools');

        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $stub = (string) file_get_contents($this->resolveStubPath());
        $rendered = str_replace(['{{ class }}', '{{ name }}'], [$class, $toolName], $stub);

        file_put_contents($dir.'/'.$class.'.php', $rendered);

        $fqcn = 'App\\Chatbot\\Tools\\'.$class;
        $this->info('Created '.$dir.'/'.$class.'.php');
        $this->line('Register it in a service provider:');
        $this->line('    Chatbot::registerTool(\\'.$fqcn.'::class);');

        return self::SUCCESS;
    }

    private function resolveStubPath(): string
    {
        $published = $this->laravel->basePath('stubs/chatbot-tool.stub');

        return file_exists($published) ? $published : __DIR__.'/stubs/chatbot-tool.stub';
    }

    private function classNameFor(string $input): string
    {
        $studly = str_replace(['-', '_'], '', ucwords($input, '-_'));

        return str_ends_with($studly, 'Tool') ? $studly : $studly.'Tool';
    }

    private function toolNameFor(string $class): string
    {
        $base = preg_replace('/Tool$/', '', $class) ?? $class;

        return strtolower((string) preg_replace('/(?<!^)([A-Z])/', '_$1', $base));
    }
}
