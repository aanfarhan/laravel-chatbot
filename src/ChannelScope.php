<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot;

final class ChannelScope
{
    public function __construct(
        private readonly Chatbot $chatbot,
        private readonly string $channel,
    ) {}

    /**
     * @param  array<string, mixed>  $context
     */
    public function context(array $context): self
    {
        $this->chatbot->setChannelContext($this->channel, $context);

        return $this;
    }

    public function prompt(string $prompt): self
    {
        $this->chatbot->setChannelPrompt($this->channel, $prompt);

        return $this;
    }

    public function greeting(string $greeting): self
    {
        $this->chatbot->setChannelGreeting($this->channel, $greeting);

        return $this;
    }

    /**
     * @param  callable|string  $summary
     */
    public function summary(callable|string $summary): self
    {
        $this->chatbot->setChannelSummary($this->channel, $summary);

        return $this;
    }

    public function renderWidget(): string
    {
        return $this->chatbot->renderWidgetForChannel($this->channel);
    }
}
