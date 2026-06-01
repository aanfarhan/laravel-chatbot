<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Http\Controllers;

use Aanfarhan\Chatbot\ChatbotServiceProvider;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\View\Factory as ViewFactory;

final class PlaywrightFixtureController
{
    /** Channels the fixture page is allowed to render. */
    private const CHANNELS = ['playwright', 'playwright-summary', 'playwright-extractor', 'playwright-plain'];

    public function __invoke(Request $request, Repository $config, Application $app, ViewFactory $view): Response
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

        $channel = $request->query('channel', 'playwright');
        if (! in_array($channel, self::CHANNELS, true)) {
            $channel = 'playwright';
        }

        return response($view->make('chatbot::test-fixture', ['channel' => $channel]));
    }
}
