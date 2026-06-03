<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Http;

use GuzzleHttp\Client as GuzzleClient;
use GuzzleHttp\Handler\CurlHandler;
use GuzzleHttp\HandlerStack;

final class LlmHttpClientFactory
{
    /**
     * @param  array{connect_timeout: float, read_timeout: float}  $options
     */
    public static function make(array $options): GuzzleClient
    {
        $handler = \extension_loaded('curl')
            ? HandlerStack::create(new CurlHandler)
            : HandlerStack::create();

        return new GuzzleClient([
            'handler' => $handler,
            'connect_timeout' => $options['connect_timeout'],
            'read_timeout' => $options['read_timeout'],
        ]);
    }
}
