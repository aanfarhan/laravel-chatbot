<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tests;

use Aanfarhan\Chatbot\ChatbotServiceProvider;
use Illuminate\Foundation\Application;
use Orchestra\Testbench\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $compiled = $this->app['config']->get('view.compiled');
        if (is_string($compiled) && is_dir($compiled)) {
            foreach (glob($compiled.'/*.php') ?: [] as $file) {
                @unlink($file);
            }
        }
    }

    /**
     * @param  Application  $app
     * @return array<int, class-string>
     */
    protected function getPackageProviders($app): array
    {
        return [ChatbotServiceProvider::class];
    }

    /**
     * Pin the cache store to the in-memory array driver so the suite stays
     * hermetic. A concurrently-running `testbench serve` (Playwright webServer)
     * can leak a database cache-store config into the shared skeleton; the
     * throttle path would then query a non-existent `cache` table and 500.
     *
     * @param  Application  $app
     */
    protected function defineEnvironment($app): void
    {
        $app['config']->set('cache.default', 'array');
    }
}
