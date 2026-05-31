<?php

declare(strict_types=1);

namespace Aanfarhan\Chatbot\Tools;

enum InvocationStatus: string
{
    case Ok = 'ok';
    case RejectedAllowlist = 'rejected_allowlist';
    case RejectedNotFound = 'rejected_not_found';
    case RejectedSchema = 'rejected_schema';
    case RejectedUnauthorized = 'rejected_unauthorized';
    case HandlerError = 'handler_error';
}
