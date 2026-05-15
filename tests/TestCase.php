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
}
