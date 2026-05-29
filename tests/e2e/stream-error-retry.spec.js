import { test, expect } from '@playwright/test'

// Error-handling surface of the widget, driven against a live backend. The
// fixture client injects a chosen error envelope when the user message is a
// `force-error:<code>` keyword (see PlaywrightFixtureClient), letting us cover
// every rendering branch the widget distinguishes by error `code`.

async function openWidget(page) {
  await page.goto('/chatbot/test-fixture')
  const widget = page.locator('chatbot-widget')
  await expect(widget).toBeAttached()
  await expect(widget).toHaveAttribute('channel', 'playwright')

  const input = widget.locator('textarea[part="input"]')
  if (!(await input.isVisible())) {
    await widget.locator('button[part="launcher"]').click()
  }
  await expect(input).toBeVisible()
  return widget
}

test.describe('stream error & retry UI', () => {
  test('quota_exceeded renders the amber row with no Retry button', async ({ page }) => {
    const widget = await openWidget(page)

    await widget.locator('textarea[part="input"]').fill('force-error:quota_exceeded')
    await widget.locator('button[part="send-button"]').click()

    const row = widget.locator('.quota-msg')
    await expect(row).toBeVisible()
    await expect(row).toContainText('daily message limit')
    await expect(widget.locator('.retry-btn')).toHaveCount(0)

    // The pending assistant bubble + its typing-dots are gone; only the
    // cold-start greeting bubble remains.
    await expect(widget.locator('.typing-dots')).toHaveCount(0)
    await expect(widget.locator('.message-assistant')).toHaveCount(1)
  })

  test('token_cap_exceeded renders the amber row with no Retry button', async ({ page }) => {
    const widget = await openWidget(page)

    await widget.locator('textarea[part="input"]').fill('force-error:token_cap_exceeded')
    await widget.locator('button[part="send-button"]').click()

    const row = widget.locator('.quota-msg')
    await expect(row).toBeVisible()
    await expect(row).toContainText('token cap')
    await expect(widget.locator('.retry-btn')).toHaveCount(0)
    await expect(widget.locator('.typing-dots')).toHaveCount(0)
    await expect(widget.locator('.message-assistant')).toHaveCount(1)
  })

  test('content_blocked renders the policy-block row with no Retry button', async ({ page }) => {
    const widget = await openWidget(page)

    await widget.locator('textarea[part="input"]').fill('force-error:content_blocked')
    await widget.locator('button[part="send-button"]').click()

    const row = widget.locator('.error-msg')
    await expect(row).toBeVisible()
    await expect(row).toContainText('content policy')
    await expect(widget.locator('.retry-btn')).toHaveCount(0)
    await expect(widget.locator('.typing-dots')).toHaveCount(0)
    await expect(widget.locator('.message-assistant')).toHaveCount(1)
  })

  test('a generic retryable error shows Retry; clicking it resends and clears the error', async ({ page }) => {
    const widget = await openWidget(page)

    await widget.locator('textarea[part="input"]').fill('force-error:retryable')
    await widget.locator('button[part="send-button"]').click()

    const row = widget.locator('.error-msg')
    await expect(row).toBeVisible()
    await expect(row).toContainText('temporarily unavailable')
    const retry = widget.locator('.retry-btn')
    await expect(retry).toBeVisible()
    await expect(widget.locator('.typing-dots')).toHaveCount(0)

    // Swap the next turn to a success stream so the resend is observable: the
    // retry handler refills the input with the original message and re-sends,
    // so we intercept that POST and answer with a clean token + done stream.
    await page.route('**/chatbot/messages', async (route) => {
      const body = `event: token\ndata: ${JSON.stringify({ content: 'Recovered after retry.' })}\n\n` +
        `event: done\ndata: ${JSON.stringify({ conversation_id: 1, usage: { input_tokens: 1, output_tokens: 1 } })}\n\n`
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'text/event-stream' },
        body,
      })
    })

    await retry.click()

    // Error row is cleared and the resent turn streams a normal answer.
    await expect(widget.locator('.error-msg')).toHaveCount(0)
    await expect(widget.locator('.message-assistant').last()).toContainText('Recovered after retry.')
  })

  test('a network failure (connect throws) renders a retryable error', async ({ page }) => {
    const widget = await openWidget(page)

    // Abort the stream request so SSEClient.connect() rejects, exercising the
    // widget's catch → network_error (retryable) branch.
    await page.route('**/chatbot/messages', (route) => route.abort())

    await widget.locator('textarea[part="input"]').fill('Where is my order?')
    await widget.locator('button[part="send-button"]').click()

    const row = widget.locator('.error-msg')
    await expect(row).toBeVisible()
    await expect(row).toContainText('Connection failed')
    await expect(widget.locator('.retry-btn')).toBeVisible()
    await expect(widget.locator('.typing-dots')).toHaveCount(0)
    await expect(widget.locator('.message-assistant')).toHaveCount(1)
  })
})
