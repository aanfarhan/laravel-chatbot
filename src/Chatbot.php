<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot;

use Aanfarhan\Chatbot\Clients\FakeClient;
use Aanfarhan\Chatbot\Contracts\LLMClient;
use Aanfarhan\Chatbot\Envelopes\ContextEnvelope;
use DateTimeImmutable;
use Illuminate\Contracts\Auth\Factory as AuthFactory;
use Illuminate\Contracts\Config\Repository;
use Illuminate\Contracts\Foundation\Application;
use Illuminate\Http\Request;

final class Chatbot
{
    /** @var array<string, array<string, mixed>> */
    private array $channelContexts = [];

    /** @var array<string, string> */
    private array $channelPrompts = [];

    /** @var array<string, string> */
    private array $channelGreetings = [];

    /** @var array<string, callable|string> */
    private array $channelSummaries = [];

    /** @var callable|null */
    private $authorizeResolver = null;

    /** @var callable|null */
    private $quotaResolver = null;

    public function __construct(
        private readonly Application $app,
    ) {}

    /**
     * @param  array<string, mixed>  $context
     */
    public function context(array $context): self
    {
        $this->channelContexts['default'] = $context;

        return $this;
    }

    /**
     * @return array<string, mixed>
     */
    public function resolveContext(): array
    {
        return $this->channelContexts['default'] ?? [];
    }

    public function prompt(string $prompt): self
    {
        $this->channelPrompts['default'] = $prompt;

        return $this;
    }

    public function greeting(string $greeting): self
    {
        $this->channelGreetings['default'] = $greeting;

        return $this;
    }

    public function summary(callable|string $summary): self
    {
        $this->channelSummaries['default'] = $summary;

        return $this;
    }

    public function channel(string $name): ChannelScope
    {
        return new ChannelScope($this, $name);
    }

    /**
     * @param  array<string, mixed>  $context
     *
     * @internal
     */
    public function setChannelContext(string $channel, array $context): void
    {
        $this->channelContexts[$channel] = $context;
    }

    /** @internal */
    public function setChannelPrompt(string $channel, string $prompt): void
    {
        $this->channelPrompts[$channel] = $prompt;
    }

    /** @internal */
    public function setChannelGreeting(string $channel, string $greeting): void
    {
        $this->channelGreetings[$channel] = $greeting;
    }

    /**
     * @internal
     */
    public function setChannelSummary(string $channel, callable|string $summary): void
    {
        $this->channelSummaries[$channel] = $summary;
    }

    public function resolveChannelPrompt(string $channel): ?string
    {
        if (isset($this->channelPrompts[$channel])) {
            return $this->channelPrompts[$channel];
        }

        /** @var Repository $config */
        $config = $this->app->make('config');
        $value = $config->get("chatbot.channels.{$channel}.prompt");

        return is_string($value) && $value !== '' ? $value : null;
    }

    public function resolveChannelGreeting(string $channel): ?string
    {
        if (isset($this->channelGreetings[$channel])) {
            return $this->channelGreetings[$channel];
        }

        /** @var Repository $config */
        $config = $this->app->make('config');
        $value = $config->get("chatbot.channels.{$channel}.greeting");

        return is_string($value) && $value !== '' ? $value : null;
    }

    public function resolveChannelSummary(string $channel): ?string
    {
        $raw = $this->channelSummaries[$channel] ?? null;

        if ($raw === null) {
            /** @var Repository $config */
            $config = $this->app->make('config');
            $raw = $config->get("chatbot.channels.{$channel}.summary");
        }

        if ($raw === null) {
            return null;
        }

        return is_callable($raw) ? (string) $raw() : (string) $raw;
    }

    public function authorize(callable $resolver): self
    {
        $this->authorizeResolver = $resolver;

        return $this;
    }

    public function quota(callable $resolver): self
    {
        $this->quotaResolver = $resolver;

        return $this;
    }

    public function resolveAuthorize(Request $request): bool
    {
        if ($this->authorizeResolver === null) {
            return true;
        }

        return (bool) ($this->authorizeResolver)($request);
    }

    /**
     * @return array{allow: bool, reason: string}
     */
    public function resolveQuota(Request $request): array
    {
        if ($this->quotaResolver === null) {
            return ['allow' => true, 'reason' => ''];
        }

        $result = ($this->quotaResolver)($request);

        if (is_array($result)) {
            return [
                'allow' => (bool) ($result['allow'] ?? true),
                'reason' => (string) ($result['reason'] ?? ''),
            ];
        }

        return ['allow' => (bool) $result, 'reason' => ''];
    }

    public function fake(): FakeClient
    {
        $fake = new FakeClient;

        $this->app->instance(LLMClient::class, $fake);

        return $fake;
    }

    public function renderWidget(string $channel = 'default'): string
    {
        return $this->renderWidgetForChannel($channel);
    }

    /** @internal */
    public function renderWidgetForChannel(string $channel): string
    {
        $envelope = $this->app->make(ContextEnvelope::class);
        $request = $this->app->make(Request::class);
        $auth = $this->app->make(AuthFactory::class)->guard();

        $userId = $auth->id();
        $userId = $userId === null ? null : (string) $userId;

        $route = $request->route()?->getName() ?? '';

        /** @var Repository $config */
        $config = $this->app->make('config');
        $ttl = $config->integer('chatbot.envelope_ttl', 900);
        $expiresAt = (new DateTimeImmutable)->modify('+'.$ttl.' seconds');

        $context = $this->channelContexts[$channel] ?? [];

        $token = $envelope->mint(
            payload: $context,
            userId: $userId,
            route: $route,
            channel: $channel,
            expiresAt: $expiresAt,
            greeting: $this->resolveChannelGreeting($channel),
            prompt: $this->resolveChannelPrompt($channel),
            summary: $this->resolveChannelSummary($channel),
        );

        return sprintf(
            '<chatbot-widget channel="%s" signed-context="%s"></chatbot-widget>',
            htmlspecialchars($channel, ENT_QUOTES, 'UTF-8'),
            htmlspecialchars($token, ENT_QUOTES, 'UTF-8'),
        );
    }
}
