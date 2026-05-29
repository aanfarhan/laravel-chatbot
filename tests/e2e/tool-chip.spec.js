import { test, expect } from '@playwright/test'

test.describe('tool-status chip on playwright fixture', () => {
  test('chip shows during the lookup_order call and hides after the text streams in', async ({ page }) => {
    await page.goto('/chatbot/test-fixture')

    const widget = page.locator('chatbot-widget')
    await expect(widget).toBeAttached()
    await expect(widget).toHaveAttribute('channel', 'playwright')

    await widget.locator('button[part="launcher"]').click()
    await widget.locator('textarea[part="input"]').fill('Where is my order?')
    await widget.locator('button[part="send-button"]').click()

    // Chip becomes visible when `tool_started` arrives; widget hides it ~500ms
    // after the stream completes, so Playwright's auto-wait has a comfortable
    // window to observe both transitions.
    const chip = widget.locator('[part="tool-status"]')
    await expect(chip).toBeVisible()
    await expect(chip).toContainText('lookup_order')

    // assistant text from the second LLM round streams in (the first assistant
    // bubble is the cold-start greeting, so target the latest one)
    await expect(widget.locator('.message-assistant').last()).toContainText('Order ORD-1042')

    await expect(chip).toBeHidden()
  })
})
