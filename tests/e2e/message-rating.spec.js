import { test, expect } from '@playwright/test'

// Message rating (👍 / 👎) was dead before issue 08: the widget never set
// `dataset.messageId`, so #rate early-returned and no POST ever fired. The fix
// threads the persisted assistant message id through the `done` SSE event into
// the bubble. This spec proves the wired path end-to-end against the real
// fixture backend: a completed turn carries a message id, clicking a rating
// button POSTs the value to /chatbot/messages/{id}/rate, and both buttons lock.

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
  // Waiting on the streamed answer confirms `done` fired, which is when the
  // bubble's dataset.messageId is set and the action row is appended.
  const bubble = widget.locator('.message-assistant').last()
  await expect(bubble).toContainText('arrives in 2 days')
  return bubble
}

test.describe('message rating on the playwright fixture', () => {
  test('clicking 👍 posts the rating value and disables both rating buttons', async ({ page }) => {
    const widget = await openWidget(page)
    const bubble = await completeTurn(widget)

    // The done event must have carried a real persisted message id.
    await expect(bubble).toHaveAttribute('data-message-id', /\d+/)

    const actions = widget.locator('.message-actions').last()
    const up = actions.getByText('👍')
    const down = actions.getByText('👎')

    const ratePost = page.waitForRequest(
      (r) => /\/chatbot\/messages\/\d+\/rate$/.test(r.url()) && r.method() === 'POST',
    )
    await up.click()

    const req = await ratePost
    expect(JSON.parse(req.postData() ?? '{}')).toEqual({ value: 1 })

    await expect(up).toBeDisabled()
    await expect(down).toBeDisabled()
  })
})
