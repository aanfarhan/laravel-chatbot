<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Config;

use Illuminate\Contracts\Config\Repository;

final class ChannelSettings
{
    public function __construct(private readonly Repository $config) {}

    public function model(string $channel): ?string
    {
        return $this->resolveString($channel, 'model', 'model', null);
    }

    public function freshnessWindow(string $channel): int
    {
        return $this->resolveInt($channel, 'replay_freshness', 'tools.replay_freshness', Defaults::FRESHNESS);
    }

    public function throttlePerMinute(string $channel): int
    {
        return $this->resolveInt($channel, 'throttle.per_minute', 'throttle.per_minute', Defaults::THROTTLE_PER_MINUTE);
    }

    public function throttlePerDay(string $channel): int
    {
        return $this->resolveInt($channel, 'throttle.per_day', 'throttle.per_day', Defaults::THROTTLE_PER_DAY);
    }

    public function prompt(string $channel): ?string
    {
        return $this->resolveString($channel, 'prompt', null, null);
    }

    public function greeting(string $channel): ?string
    {
        return $this->resolveString($channel, 'greeting', null, null);
    }

    public function summary(string $channel): mixed
    {
        $key = "chatbot.channels.{$channel}.summary";

        if (! $this->config->has($key)) {
            return null;
        }

        return $this->config->get($key);
    }

    /**
     * @return list<string>
     */
    public function allowedExtractors(string $channel): array
    {
        $raw = $this->config->get("chatbot.channels.{$channel}.allowed_extractors");

        if (! is_array($raw)) {
            return [];
        }

        return array_values(array_filter($raw, 'is_string'));
    }

    public function extractorTimeoutMs(string $channel): ?int
    {
        $key = "chatbot.channels.{$channel}.extractor_timeout_ms";

        if (! $this->config->has($key)) {
            return null;
        }

        $raw = $this->config->get($key);

        if (! is_int($raw)) {
            throw new \InvalidArgumentException("chatbot.channels.{$channel}.extractor_timeout_ms must be an integer");
        }

        return $raw;
    }

    public function extractorSizeCapBytes(string $channel): ?int
    {
        $key = "chatbot.channels.{$channel}.extractor_size_cap_bytes";

        if (! $this->config->has($key)) {
            return null;
        }

        $raw = $this->config->get($key);

        if (! is_int($raw)) {
            throw new \InvalidArgumentException("chatbot.channels.{$channel}.extractor_size_cap_bytes must be an integer");
        }

        return $raw;
    }

    private function resolveInt(string $channel, string $channelKey, ?string $globalKey, int $default): int
    {
        $channelPath = "chatbot.channels.{$channel}.{$channelKey}";

        if ($this->config->has($channelPath)) {
            $raw = $this->config->get($channelPath);

            if (! is_int($raw)) {
                throw new \InvalidArgumentException("{$channelPath} must be an integer");
            }

            return $raw;
        }

        if ($globalKey !== null) {
            $globalPath = "chatbot.{$globalKey}";

            if ($this->config->has($globalPath)) {
                $raw = $this->config->get($globalPath);

                if (! is_int($raw)) {
                    throw new \InvalidArgumentException("{$globalPath} must be an integer");
                }

                return $raw;
            }
        }

        return $default;
    }

    private function resolveString(string $channel, string $channelKey, ?string $globalKey, ?string $default): ?string
    {
        $channelPath = "chatbot.channels.{$channel}.{$channelKey}";

        if ($this->config->has($channelPath)) {
            $raw = $this->config->get($channelPath);

            if (! is_string($raw)) {
                throw new \InvalidArgumentException("{$channelPath} must be a string");
            }

            return $raw !== '' ? $raw : $default;
        }

        if ($globalKey !== null) {
            $globalPath = "chatbot.{$globalKey}";

            if ($this->config->has($globalPath)) {
                $raw = $this->config->get($globalPath);

                if (! is_string($raw)) {
                    throw new \InvalidArgumentException("{$globalPath} must be a string");
                }

                return $raw !== '' ? $raw : $default;
            }
        }

        return $default;
    }
}
