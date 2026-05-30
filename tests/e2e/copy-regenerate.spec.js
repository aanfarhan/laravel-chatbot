import { test, expect } from '@playwright/test'

// Message-action buttons the widget appends to a completed assistant bubble:
// Copy (writes raw markdown to the clipboard) and Regenerate (clears the bubble
// and resends the last user message). These ran vitest-only before; here they
// exercise a real browser clipboard and a real backend round-trip.

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

async function completeTurn(widget) {
  await widget.locator('textarea[part="input"]').fill('Where is my order?')
  await widget.locator('button[part="send-button"]').click()
  // The cold-start greeting is the first assistant bubble; the streamed answer
  // is the last. Waiting on its text confirms the `done` event fired, which is
  // when the action row gets appended.
  const bubble = widget.locator('.message-assistant').last()
  await expect(bubble).toContainText('arrives in 2 days')
  return bubble
}

test.describe('copy & regenerate actions on the playwright fixture', () => {
  test('a completed assistant turn carries the copy / regenerate action row and no rating buttons', async ({ page }) => {
    const widget = await openWidget(page)
    await completeTurn(widget)

    const actions = widget.locator('.message-actions').last()
    await expect(actions).toBeVisible()
    await expect(actions.getByText('📋 Copy')).toBeVisible()
    await expect(actions.getByText('🔄 Regenerate')).toBeVisible()
    await expect(actions.getByText('👍')).toHaveCount(0)
    await expect(actions.getByText('👎')).toHaveCount(0)
  })

  test('Copy places the assistant raw text on the clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    const widget = await openWidget(page)
    const bubble = await completeTurn(widget)
    const raw = await bubble.getAttribute('data-raw')

    await widget.locator('.message-actions').last().getByText('📋 Copy').click()

    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(raw)
  })

  test('Regenerate clears the bubble and resends the last user message for a fresh turn', async ({ page }) => {
    const widget = await openWidget(page)
    await completeTurn(widget)
    await expect(widget.locator('.message-user')).toHaveCount(1)

    await widget.locator('.message-actions').last().getByText('🔄 Regenerate').click()

    // The last user message is resent, so a second user bubble appears, and a
    // fresh assistant turn streams in with its own completed answer + actions.
    await expect(widget.locator('.message-user')).toHaveCount(2)
    await expect(widget.locator('.message-user').last()).toContainText('Where is my order?')
    await expect(widget.locator('.message-assistant').last()).toContainText('arrives in 2 days')
    await expect(widget.locator('.message-actions').last()).toBeVisible()
  })
})
