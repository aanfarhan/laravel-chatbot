import { test, expect } from '@playwright/test'

const SUMMARY_TEXT = 'Returning customer — previously asked about ORD-1042.'

test.describe('context_summary event on playwright fixture', () => {
  test('renders the summary line above the assistant bubble', async ({ page }) => {
    // The summary is baked into the signed envelope per channel, so a dedicated
    // `playwright-summary` channel (selected via ?channel=) carries it without
    // perturbing the default `playwright` channel used by the other specs.
    await page.goto('/chatbot/test-fixture?channel=playwright-summary')

    const widget = page.locator('chatbot-widget')
    await expect(widget).toBeAttached()
    await expect(widget).toHaveAttribute('channel', 'playwright-summary')

    await widget.locator('button[part="launcher"]').click()
    await widget.locator('textarea[part="input"]').fill('Where is my order?')
    await widget.locator('button[part="send-button"]').click()

    const summary = widget.locator('.context-summary')
    await expect(summary).toBeVisible()
    await expect(summary).toContainText(SUMMARY_TEXT)

    // The assistant answer still streams in, and the summary sits above it.
    const bubble = widget.locator('.message-assistant').last()
    await expect(bubble).toContainText('Order ORD-1042')

    const summaryBox = await summary.boundingBox()
    const bubbleBox = await bubble.boundingBox()
    expect(summaryBox.y).toBeLessThan(bubbleBox.y)
  })
})
