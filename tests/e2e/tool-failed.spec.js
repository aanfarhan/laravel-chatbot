import { test, expect } from '@playwright/test'

test.describe('tool_failed event on playwright fixture', () => {
  test('chip shows while the failing tool runs and hides once the turn resolves', async ({ page }) => {
    await page.goto('/chatbot/test-fixture')

    const widget = page.locator('chatbot-widget')
    await expect(widget).toBeAttached()
    await expect(widget).toHaveAttribute('channel', 'playwright')

    await widget.locator('button[part="launcher"]').click()
    await widget.locator('textarea[part="input"]').fill('fail-tool')
    await widget.locator('button[part="send-button"]').click()

    // `tool_started` shows the chip; the handler throws, so the loop emits
    // `tool_failed`, which resolves the chip the same way `tool_finished` does.
    const chip = widget.locator('[part="tool-status"]')
    await expect(chip).toBeVisible()
    await expect(chip).toContainText('failing_tool')

    // The turn still completes: the fixture streams a final answer after the
    // failed tool result is fed back to the model (no hang, no stuck spinner).
    await expect(widget.locator('.message-assistant').last()).toContainText('Order ORD-1042')

    await expect(chip).toBeHidden()
  })
})
