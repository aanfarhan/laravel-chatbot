<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Streaming;

enum TurnOutcome
{
    case Completed;
    case Aborted;
    case Failed;
}
