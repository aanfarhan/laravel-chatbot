import { test, expect } from '@playwright/test'

// Conversation continuity flows on the Playwright fixture: history restore
// across a real page reload, "New chat" reset, and cold-start greeting. These
// exercise real localStorage + a real backend, which the vitest/jsdom suite
// can only fake.

async function openWidget(page) {
  await page.goto('/chatbot/test-fixture')
  const widget = page.locator('chatbot-widget')
  await expect(widget).toBeAttached()
  await expect(widget).toHaveAttribute('channel', 'playwright')

  // Panel may already be re-opened from a prior turn (state is persisted to
  // localStorage); only click the launcher when the input isn't showing yet.
  const input = widget.locator('textarea[part="input"]')
  if (!(await input.isVisible())) {
    await widget.locator('button[part="launcher"]').click()
  }
  await expect(input).toBeVisible()
  return widget
}

test.describe('conversation persistence & greeting', () => {
  test('reloading restores the prior user and assistant turns', async ({ page }) => {
    const widget = await openWidget(page)

    await widget.locator('textarea[part="input"]').fill('Where is my order?')
    await widget.locator('button[part="send-button"]').click()

    // The cold-start greeting is the first assistant bubble; the streamed
    // answer is the last. Waiting on it ensures the `done` event has fired and
    // persisted the conversation id, which the reload depends on.
    await expect(widget.locator('.message-assistant').last()).toContainText('arrives in 2 days')

    await page.reload()

    // After reload the widget rehydrates from history, passing signed_context so
    // the server scopes by the envelope. The response prepends the envelope
    // greeting, so the restored thread is: greeting, the user turn, then the
    // streamed answer.
    const restored = await openWidget(page)
    await expect(restored.locator('.message-user')).toContainText('Where is my order?')
    await expect(restored.locator('.message-assistant').first()).toContainText('Ask me about your order')
    await expect(restored.locator('.message-assistant').last()).toContainText('Order ORD-1042')
  })

  test('cold start renders the signed-context greeting as an assistant bubble', async ({ page }) => {
    const widget = await openWidget(page)

    // No prior conversation in localStorage, so the greeting carried in the
    // signed context should render as the only assistant bubble on mount.
    await expect(widget.locator('.message-assistant')).toContainText('Ask me about your order')
    await expect(widget.locator('.message-user')).toHaveCount(0)
  })

  test('New chat clears the list, drops the stored conversation, and re-greets', async ({ page }) => {
    const widget = await openWidget(page)

    await widget.locator('textarea[part="input"]').fill('Where is my order?')
    await widget.locator('button[part="send-button"]').click()
    await expect(widget.locator('.message-assistant').last()).toContainText('arrives in 2 days')

    // The completed turn persisted a conversation id.
    expect(await page.evaluate(() => localStorage.getItem('chatbot_conversation_playwright'))).not.toBeNull()

    await widget.locator('.new-chat').click()

    await expect(widget.locator('.message-user')).toHaveCount(0)
    await expect(widget.locator('.message-assistant')).toHaveCount(1)
    await expect(widget.locator('.message-assistant')).toContainText('Ask me about your order')
    expect(await page.evaluate(() => localStorage.getItem('chatbot_conversation_playwright'))).toBeNull()
  })
})
