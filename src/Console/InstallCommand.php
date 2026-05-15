<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Console;

use Illuminate\Console\Command;

final class InstallCommand extends Command
{
    protected $signature = 'chatbot:install
        {--layout= : Path to Blade layout file for snippet injection}';

    protected $description = 'Install and configure the chatbot package (idempotent, safe to re-run)';

    public function handle(): int
    {
        $this->publishConfig();
        $this->runMigrations();
        $this->writeEnvSettings();
        $this->injectBlade();

        $this->info('Chatbot installed successfully.');

        return self::SUCCESS;
    }

    private function publishConfig(): void
    {
        $configPath = $this->laravel->configPath('chatbot.php');

        if (file_exists($configPath)) {
            $this->line('<info>Config already published, skipping.</info>');

            return;
        }

        $this->callSilently('vendor:publish', ['--tag' => 'chatbot-config']);
        $this->line('<info>Config published.</info>');
    }

    private function runMigrations(): void
    {
        $this->callSilently('migrate');
    }

    private function writeEnvSettings(): void
    {
        $envPath = $this->laravel->basePath('.env');

        $defaults = [
            'CHATBOT_BASE_URL' => 'https://api.openai.com/v1',
            'CHATBOT_API_KEY'  => '',
            'CHATBOT_MODEL'    => 'gpt-4o-mini',
        ];

        $existing = file_exists($envPath) ? (string) file_get_contents($envPath) : '';
        $appended = '';

        foreach ($defaults as $key => $default) {
            if (preg_match('/^'.preg_quote($key, '/').'=/m', $existing)) {
                continue;
            }

            $value = $this->input->isInteractive()
                ? (string) ($this->ask($this->labelFor($key), $default) ?? $default)
                : $default;

            $appended .= "{$key}={$value}\n";
        }

        if ($appended !== '') {
            $content = $existing === '' ? $appended : rtrim($existing)."\n".$appended;
            file_put_contents($envPath, $content);
        }
    }

    private function injectBlade(): void
    {
        $layoutPath = $this->resolveLayout();

        if ($layoutPath === null) {
            $this->warn('No layout detected — add @chatbot to your layout manually.');

            return;
        }

        $content = (string) file_get_contents($layoutPath);

        if (str_contains($content, '@chatbot')) {
            $this->line('<info>Snippet already present in layout, skipping.</info>');

            return;
        }

        if ($this->input->isInteractive()) {
            if (! $this->confirm('Inject @chatbot snippet into '.$layoutPath.'?', true)) {
                return;
            }
        }

        file_put_contents($layoutPath, str_replace('</body>', "    @chatbot\n</body>", $content));
        $this->line('<info>Blade snippet injected into layout.</info>');
    }

    private function resolveLayout(): ?string
    {
        /** @var string|null $option */
        $option = $this->option('layout');

        if ($option !== null) {
            return file_exists($option) ? $option : null;
        }

        $convention = $this->laravel->resourcePath('views/layouts/app.blade.php');

        return file_exists($convention) ? $convention : null;
    }

    private function labelFor(string $envKey): string
    {
        return match ($envKey) {
            'CHATBOT_BASE_URL' => 'LLM provider base URL',
            'CHATBOT_API_KEY'  => 'LLM API key',
            'CHATBOT_MODEL'    => 'LLM model name',
            default            => $envKey,
        };
    }
}
