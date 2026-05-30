import { test, expect } from '@playwright/test'

test.describe('widget input behaviours', () => {
  test('Enter sends; Shift+Enter inserts a newline without sending', async ({ page }) => {
    await page.goto('/chatbot/test-fixture')

    const widget = page.locator('chatbot-widget')
    await widget.locator('button[part="launcher"]').click()

    const input = widget.locator('textarea[part="input"]')
    await input.click()

    // Shift+Enter: newline, no send
    await input.type('first line')
    await input.press('Shift+Enter')
    await input.type('second line')
    await expect(input).toHaveValue('first line\nsecond line')
    await expect(widget.locator('.message-user')).toHaveCount(0)

    // Enter: sends the message, clears input
    await input.press('Enter')
    await expect(widget.locator('.message-user')).toContainText('first line\nsecond line')
    await expect(input).toHaveValue('')
  })

  test('send button is disabled while streaming and re-enabled after the turn resolves', async ({ page }) => {
    await page.goto('/chatbot/test-fixture')

    let release
    const gate = new Promise((resolve) => { release = resolve })
    await page.route('**/chatbot/messages', async (route) => {
      await gate
      await route.continue()
    })

    const widget = page.locator('chatbot-widget')
    await widget.locator('button[part="launcher"]').click()
    await widget.locator('textarea[part="input"]').fill('Where is my order?')

    const sendBtn = widget.locator('button[part="send-button"]')
    await sendBtn.click()

    // Held open by the gate — the turn is mid-stream.
    await expect(sendBtn).toBeDisabled()

    release()

    await expect(sendBtn).toBeEnabled()
  })

  test('whitespace-only input produces no message bubble and no request', async ({ page }) => {
    await page.goto('/chatbot/test-fixture')

    let requested = false
    await page.route('**/chatbot/messages', async (route) => {
      requested = true
      await route.continue()
    })

    const widget = page.locator('chatbot-widget')
    await widget.locator('button[part="launcher"]').click()

    const input = widget.locator('textarea[part="input"]')
    await input.fill('   \n  \t ')
    await widget.locator('button[part="send-button"]').click()
    await input.press('Enter')

    // Give any erroneous request a chance to fire before asserting.
    await page.waitForTimeout(200)
    expect(requested).toBe(false)
    await expect(widget.locator('.message-user')).toHaveCount(0)
  })
})

test.describe('widget layout variants', () => {
  test('position="inline" renders the panel with no launcher', async ({ page }) => {
    await page.goto('/chatbot/test-fixture?position=inline')

    const widget = page.locator('chatbot-widget')
    await expect(widget).toBeAttached()

    await expect(widget.locator('button[part="launcher"]')).toHaveCount(0)
    // Inline panel is statically rendered and visible without any toggle.
    await expect(widget.locator('[part="panel"]')).toBeVisible()
  })

  test('position="bottom-left" anchors launcher and panel to the left', async ({ page }) => {
    await page.goto('/chatbot/test-fixture?position=bottom-left')

    const widget = page.locator('chatbot-widget')
    // `left: 24px` is the explicit left-anchor rule; the default bottom-right
    // launcher leaves `left` unset so it computes to a large value instead.
    const launcher = widget.locator('button[part="launcher"]')
    await expect(launcher).toHaveCSS('left', '24px')

    await launcher.click()
    await expect(widget.locator('[part="panel"]')).toHaveCSS('left', '24px')
  })

  test('at a < 480px viewport the panel renders fullscreen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 720 })
    await page.goto('/chatbot/test-fixture')

    const widget = page.locator('chatbot-widget')
    await widget.locator('button[part="launcher"]').click()

    const panel = widget.locator('[part="panel"]')
    await expect(panel).toBeVisible()
    // The < 480px media query collapses corners and pins the panel to inset:0.
    await expect(panel).toHaveCSS('border-radius', '0px')

    const box = await panel.boundingBox()
    expect(box.width).toBe(375)
    expect(box.height).toBe(720)
    expect(box.x).toBe(0)
    expect(box.y).toBe(0)
  })
})
