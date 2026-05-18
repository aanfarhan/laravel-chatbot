# GDPR & user data

The package ships first-class support for the data-subject-rights side of GDPR (and comparable regulations): access, portability, rectification, anonymisation, and erasure.

## What gets persisted

| Table | Contents |
| --- | --- |
| `chatbot_conversations` | One row per conversation. Keyed by `user_id` (when authenticated) or `guest_token`. Channel, route, timestamps. Soft-deletes. |
| `chatbot_messages` | One row per `user` / `assistant` / `tool` / `error` message. Carries content, token counts, cost cents, channel, route, and a context hash. |
| `chatbot_tool_invocations` | One row per tool call. Tool name, sanitised arguments, sanitised result, status, started/finished timestamps, linked message id. |

## The `HasChatbotData` trait

Add it to your `User` model:

```php
use Aanfarhan\Chatbot\Concerns\HasChatbotData;

class User extends Authenticatable
{
    use HasChatbotData;
}
```

You now have:

```php
$user->chatbotConversations();         // HasMany relation
$user->deleteChatbotData(hard: false); // soft (default) or force delete
$user->exportChatbotData();            // array shaped as 'chatbot-export@1'
```

### Export shape

```php
[
    'format'        => 'chatbot-export@1',
    'user_id'       => 42,
    'exported_at'   => '2025-05-18T10:00:00+00:00',
    'conversations' => [
        [
            'id'       => 123,
            'channel'  => 'default',
            'messages' => [
                ['role' => 'user',      'content' => '...', 'created_at' => '...'],
                ['role' => 'assistant', 'content' => '...', 'created_at' => '...'],
            ],
        ],
    ],
]
```

## Artisan commands

For scripted operations, the package ships dedicated commands. Full flag reference in [Console commands](/reference/console-commands).

| Command | Purpose |
| --- | --- |
| `chatbot:export-user {id}` | Export a user's conversations as JSON or CSV (`--format`) |
| `chatbot:delete-user {id}` | Soft- or hard-delete a user's conversations (`--hard`, `--channel`) |
| `chatbot:anonymize-user {id}` | Scrub user identity while preserving token/cost aggregates |
| `chatbot:delete-guest {token}` | Delete a guest token's conversations |
| `chatbot:prune` | Hard-delete conversations past `chatbot.retention_days` |

## Retention policy

Configure once globally and override per channel:

```php
// config/chatbot.php
'retention_days' => 30, // null = keep forever; 0 = honour TTL only

'channels' => [
    'support' => ['retention_days' => 365], // legal hold
    'admin'   => ['retention_days' => 7],
],
```

Schedule the pruner in `routes/console.php`:

```php
Schedule::command('chatbot:prune')->daily();
```

## Host responsibilities

The package gives you the tools; the *policy* remains yours:

- **Privacy disclosure** — tell users their messages are forwarded to a third-party LLM provider.
- **Subprocessor list** — add your LLM vendor to your DPA / privacy notice.
- **Lawful basis** — decide whether you process chats under legitimate interest, contract performance, consent, or otherwise.
- **Provider data settings** — disable training-on-your-data with your LLM vendor where required.

See [Security — host responsibilities](./security) for the broader operational checklist.
