<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Config;

final class Defaults
{
    public const STREAM_DURATION = 60;

    public const MAX_CALLS_PER_TURN = 5;

    public const DEFAULT_TIMEOUT = 10;

    public const RESULT_SIZE_CAP = 4096;

    public const MAX_ARG_LENGTH = 10240;

    public const SECTION_SIZE_CAP = 4096;

    public const TOKEN_CAP = 32768;

    public const CONVERSATION_TTL = 86400;

    public const FRESHNESS = 300;

    public const THROTTLE_PER_MINUTE = 20;

    public const THROTTLE_PER_DAY = 200;
}
