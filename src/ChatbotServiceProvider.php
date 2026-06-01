<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot;

use Aanfarhan\Chatbot\Blade\BladeSnapshotCompiler;
use Aanfarhan\Chatbot\Clients\OpenAiCompatibleClient;
use Aanfarhan\Chatbot\Config\ChannelSettings;
use Aanfarhan\Chatbot\Config\Defaults;
use Aanfarhan\Chatbot\Contracts\ConversationStore;
use Aanfarhan\Chatbot\Contracts\LLMClient;
use Aanfarhan\Chatbot\Contracts\ToolInvocationStore;
use Aanfarhan\Chatbot\Envelopes\ContextEnvelope;
use Aanfarhan\Chatbot\Extractors\ClientExtractorRegistry;
use Aanfarhan\Chatbot\Facades\Chatbot as ChatbotFacade;
use Aanfarhan\Chatbot\Stores\EloquentConversationStore;
use Aanfarhan\Chatbot\Stores\EloquentToolInvocationStore;
use Aanfarhan\Chatbot\Streaming\SseStreamEmitter;
use Aanfarhan\Chatbot\Streaming\StreamEmitter;
use Aanfarhan\Chatbot\Testing\Fixtures\FailingTool;
use Aanfarhan\Chatbot\Testing\Fixtures\LookupOrderTool;
use Aanfarhan\Chatbot\Testing\Fixtures\PlaywrightFixtureClient;
use Aanfarhan\Chatbot\Tools\ToolArgumentValidator;
use Aanfarhan\Chatbot\Tools\ToolInvoker;
use Aanfarhan\Chatbot\Tools\ToolRegistry;
use GuzzleHttp\Client as GuzzleClient;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Support\Facades\Blade;
use Illuminate\Support\ServiceProvider;

final class ChatbotServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/chatbot.php', 'chatbot');

        $this->app->singleton(Chatbot::class, fn (Application $app): Chatbot => new Chatbot($app, $app->make(ChannelSettings::class)));

        $this->app->singleton(
            ChannelSettings::class,
            fn (Application $app): ChannelSettings => new ChannelSettings($app->make('config')),
        );

        $this->app->singleton(ToolRegistry::class, fn (Application $app): ToolRegistry => new ToolRegistry($app));

        $this->app->singleton(
            ClientExtractorRegistry::class,
            fn (): ClientExtractorRegistry => new ClientExtractorRegistry,
        );

        $this->app->singleton(
            ContextEnvelope::class,
            fn (Application $app): ContextEnvelope => new ContextEnvelope($app->make('config')),
        );

        $this->app->singleton(
            PromptAssembler::class,
            function (Application $app): PromptAssembler {
                /** @var Repository $config */
                $config = $app->make('config');

                return new PromptAssembler(sectionSizeCap: $config->integer('chatbot.context.section_size_cap', Defaults::SECTION_SIZE_CAP));
            },
        );

        $this->app->singleton(
            ContextSanitizer::class,
            function (Application $app): ContextSanitizer {
                /** @var Repository $config */
                $config = $app->make('config');
                /** @var list<string> $tags */
                $tags = (array) $config->get('chatbot.sanitizer_tags', []);

                return new ContextSanitizer($tags);
            },
        );

        $this->app->singleton(ConversationStore::class, fn (): EloquentConversationStore => new EloquentConversationStore);

        $this->app->singleton(ToolInvocationStore::class, fn (): EloquentToolInvocationStore => new EloquentToolInvocationStore);

        $this->app->singleton(
            ConversationReplay::class,
            function (Application $app): ConversationReplay {
                /** @var Repository $config */
                $config = $app->make('config');

                return new ConversationReplay(
                    conversations: $app->make(ConversationStore::class),
                    invocations: $app->make(ToolInvocationStore::class),
                    registry: $app->make(ToolRegistry::class),
                    validator: new ToolArgumentValidator($config->integer('chatbot.tools.default_max_arg_length', Defaults::MAX_ARG_LENGTH)),
                );
            },
        );

        $this->app->singleton(ThreadedActorResolver::class, fn (Application $app): ThreadedActorResolver => new ThreadedActorResolver($app->make('auth')));

        $this->app->singleton(
            TurnIntake::class,
            function (Application $app): TurnIntake {
                /** @var Repository $config */
                $config = $app->make('config');

                return new TurnIntake(
                    assembler: $app->make(PromptAssembler::class),
                    sanitizer: $app->make(ContextSanitizer::class),
                    store: $app->make(ConversationStore::class),
                    replay: $app->make(ConversationReplay::class),
                    tokenCounter: $app->make(TokenCounter::class),
                    actorResolver: $app->make(ThreadedActorResolver::class),
                    extractorRegistry: $app->make(ClientExtractorRegistry::class),
                    channelSettings: $app->make(ChannelSettings::class),
                    config: $config,
                );
            },
        );

        $this->app->singleton(StreamEmitter::class, fn (): StreamEmitter => new SseStreamEmitter);

        $this->app->singleton(ToolInvoker::class, function (Application $app): ToolInvoker {
            /** @var Repository $config */
            $config = $app->make('config');

            return new ToolInvoker(
                resolver: $app->make(ToolRegistry::class),
                invocationStore: $app->make(ToolInvocationStore::class),
                emitter: $app->make(StreamEmitter::class),
                defaultTimeout: $config->integer('chatbot.tools.default_timeout', Defaults::DEFAULT_TIMEOUT),
                resultSizeCap: $config->integer('chatbot.tools.result_size_cap', Defaults::RESULT_SIZE_CAP),
                maxArgLength: $config->integer('chatbot.tools.default_max_arg_length', Defaults::MAX_ARG_LENGTH),
            );
        });

        $this->app->singleton(LLMClient::class, function (Application $app): LLMClient {
            /** @var Repository $config */
            $config = $app->make('config');

            if ($config->get('chatbot.playwright_fixture.enabled', false)) {
                return new PlaywrightFixtureClient;
            }

            return new OpenAiCompatibleClient(
                new GuzzleClient,
                baseUrl: $config->string('chatbot.base_url'),
                apiKey: $config->string('chatbot.api_key', ''),
                model: $config->string('chatbot.model'),
            );
        });
    }

    public function boot(): void
    {
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
        $this->loadRoutesFrom(__DIR__.'/../routes/chatbot.php');
        $this->loadRoutesFrom(__DIR__.'/../routes/chatbot-fixture.php');
        $this->loadViewsFrom(__DIR__.'/../resources/views', 'chatbot');

        $this->wirePlaywrightFixture();

        if ($this->app->runningInConsole()) {
            $this->commands([
                Console\InstallCommand::class,
                Console\PruneCommand::class,
                Console\DeleteUserCommand::class,
                Console\ExportUserCommand::class,
                Console\AnonymizeUserCommand::class,
                Console\DeleteGuestCommand::class,
                Console\InspectPromptCommand::class,
                Console\MakeToolCommand::class,
            ]);
        }

        $this->publishes([
            __DIR__.'/../config/chatbot.php' => $this->app->configPath('chatbot.php'),
        ], 'chatbot-config');

        $this->publishes([
            __DIR__.'/Console/stubs/chatbot-tool.stub' => $this->app->basePath('stubs/chatbot-tool.stub'),
        ], 'chatbot-stubs');

        Blade::directive('chatbot', function (string $expression): string {
            $arg = trim($expression) === '' ? "'default'" : $expression;

            return '<?php echo \\'.ChatbotFacade::class."::channel({$arg})->renderWidget(); ?>";
        });

        $snapshotCompiler = new BladeSnapshotCompiler;
        Blade::directive('chatbotSnapshot', fn (string $expression): string => $snapshotCompiler->open($expression));
        Blade::directive('endChatbotSnapshot', fn (string $expression): string => $snapshotCompiler->close());
    }

    /**
     * Register the Playwright fixture tool + channel allowlist when the flag is on.
     * Idempotent — safe to call from both boot() (for testbench serve) and the
     * fixture controller (for Pest tests that toggle the flag post-boot).
     */
    public function wirePlaywrightFixture(): void
    {
        /** @var Repository $config */
        $config = $this->app->make('config');

        if (! $config->get('chatbot.playwright_fixture.enabled', false)) {
            return;
        }

        $registry = $this->app->make(ToolRegistry::class);
        if ($registry->resolve('lookup_order') === null) {
            $registry->register(LookupOrderTool::class);
        }
        if ($registry->resolve('failing_tool') === null) {
            $registry->register(FailingTool::class);
        }

        $chatbot = $this->app->make(Chatbot::class);
        $chatbot->setChannelAllowlist('playwright', ['lookup_order', 'failing_tool']);
        $chatbot->setChannelGreeting('playwright', 'Hi! Ask me about your order.');

        // Dedicated channel carrying a context summary in its signed envelope, so
        // every turn emits a `context_summary` event. Isolated from `playwright`
        // to keep the other specs' turns summary-free.
        $chatbot->setChannelAllowlist('playwright-summary', ['lookup_order']);
        $chatbot->setChannelGreeting('playwright-summary', 'Hi! Ask me about your order.');
        $chatbot->setChannelSummary('playwright-summary', 'Returning customer — previously asked about ORD-1042.');

        // Dedicated channel whose signed envelope allows the built-in
        // `blade-snapshot` client extractor, so e2e can drive the page-snapshot
        // capture end-to-end. No tools — keeps the turn focused on the extractor
        // path. Isolated from `playwright` so the other specs run extractor-free.
        $chatbot->setChannelAllowlist('playwright-extractor', []);
        $chatbot->setChannelGreeting('playwright-extractor', 'Hi! Ask me about your order.');
        $config->set('chatbot.channels.playwright-extractor.allowed_extractors', ['blade-snapshot']);

        // Plain channel: no tools, no extractors. The fixture client falls
        // through to its canned text stream, giving the widget specs a simple
        // request → streamed-reply path to assert mount + typing-dot behaviour.
        $chatbot->setChannelAllowlist('playwright-plain', []);
        $chatbot->setChannelGreeting('playwright-plain', 'Hi! Ask me about your order.');
    }
}
