<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chatbot Playwright Fixture</title>
    <style>
        body { font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    </style>
</head>
<body>
    <h1>Playwright Fixture</h1>
    <p>This page is gated by <code>CHATBOT_PLAYWRIGHT_FIXTURE=1</code> and exists only to exercise the tool-call loop in e2e tests.</p>

    @if (($channel ?? null) === 'playwright-extractor')
        {{-- Marked content for the blade-snapshot client extractor to capture. --}}
        @chatbotSnapshot('product')Acme Rocket Skates — $129@endChatbotSnapshot
    @endif

    @chatbot($channel ?? 'playwright')

    {{-- Lets layout specs mount the widget with a `position` attribute via a
         query param. Runs synchronously (classic script) before the deferred
         widget module upgrades the element, so connectedCallback reads it. --}}
    <script>
        (function () {
            var pos = new URLSearchParams(location.search).get('position')
            var allowed = ['inline', 'bottom-left', 'bottom-right']
            if (allowed.indexOf(pos) === -1) return
            var widget = document.querySelector('chatbot-widget')
            if (widget) widget.setAttribute('position', pos)
        })()
    </script>
</body>
</html>
