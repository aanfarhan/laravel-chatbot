import { test, expect } from '@playwright/test'

test.describe('typing-dots loading indicator', () => {
  test('widget mounts on the fixture page', async ({ page }) => {
    await page.goto('/chatbot/test-fixture?channel=playwright-plain')

    const widget = page.locator('chatbot-widget')
    await expect(widget).toBeAttached()

    const launcher = widget.locator('button[part="launcher"]')
    await expect(launcher).toBeVisible()

    await launcher.click()
    await expect(widget.locator('textarea[part="input"]')).toBeVisible()
  })

  test('dots show while stream pending and disappear after completion', async ({ page }) => {
    await page.goto('/chatbot/test-fixture?channel=playwright-plain')

    let release
    const gate = new Promise((resolve) => { release = resolve })
    await page.route('**/chatbot/messages', async (route) => {
      await gate
      await route.continue()
    })

    const widget = page.locator('chatbot-widget')
    await widget.locator('button[part="launcher"]').click()
    await widget.locator('textarea[part="input"]').fill('Where is my order?')
    await widget.locator('button[part="send-button"]').click()

    const dots = widget.locator('[part="typing-dots"]')
    await expect(dots).toBeVisible()

    release()

    await expect(dots).toHaveCount(0)
    await expect(widget.locator('.message-assistant').last()).toContainText('Order')
  })
})
