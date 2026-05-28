<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Http\Controllers;

use Aanfarhan\Chatbot\ChatbotServiceProvider;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Http\Response;
use Illuminate\View\Factory as ViewFactory;

final class PlaywrightFixtureController
{
    public function __invoke(Repository $config, Application $app, ViewFactory $view): Response
    {
        if (! $config->get('chatbot.playwright_fixture.enabled', false)) {
            abort(404);
        }

        // Idempotent — provider boot() also wires this when the env flag is on
        // at boot time. We call it here too so Pest tests that set the config
        // post-boot still exercise the same code path.
        $provider = $app->getProvider(ChatbotServiceProvider::class);
        if ($provider instanceof ChatbotServiceProvider) {
            $provider->wirePlaywrightFixture();
        }

        return response($view->make('chatbot::test-fixture'));
    }
}
