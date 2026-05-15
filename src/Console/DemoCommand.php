<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Console;

use Illuminate\Console\Command;

final class DemoCommand extends Command
{
    protected $signature = 'chatbot:demo';

    protected $description = 'Scaffold a demo route and seed with FakeClient replies (requires chatbot.demo.enabled = true)';

    public function handle(): int
    {
        $this->info('Demo URL: '.url('/chatbot/demo'));
        $this->line('Remember to disable demo mode before deploying: set chatbot.demo.enabled = false.');

        if ($this->laravel->isProduction()) {
            $this->error('WARNING: Demo mode is active in a production environment. Disable it immediately.');
        }

        return self::SUCCESS;
    }
}
