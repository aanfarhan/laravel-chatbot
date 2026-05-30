import { test, expect } from '@playwright/test'

// The blade-snapshot extractor allowlist is baked into the signed envelope per
// channel, so a dedicated `playwright-extractor` channel (selected via
// ?channel=) carries it without perturbing the default `playwright` channel
// used by the other specs. The fixture page renders `[data-chatbot-snapshot]`
// markers (via @chatbotSnapshot) only on this channel.
const MARKER_TEXT = 'Acme Rocket Skates — $129'

test.describe('blade-snapshot client extractor on playwright fixture', () => {
  test('captures marked page content and attaches it to the /chatbot/messages request', async ({ page }) => {
    await page.goto('/chatbot/test-fixture?channel=playwright-extractor')

    const widget = page.locator('chatbot-widget')
    await expect(widget).toBeAttached()
    await expect(widget).toHaveAttribute('channel', 'playwright-extractor')

    await widget.locator('button[part="launcher"]').click()
    await widget.locator('textarea[part="input"]').fill('What are these?')

    const requestPromise = page.waitForRequest(
      (req) => req.url().includes('/chatbot/messages') && req.method() === 'POST',
    )
    await widget.locator('button[part="send-button"]').click()

    const body = (await requestPromise).postDataJSON()
    expect(body.extractor_blocks).toBeTruthy()
    expect(body.extractor_blocks).toHaveLength(1)
    expect(body.extractor_blocks[0].name).toBe('blade-snapshot')
    expect(body.extractor_blocks[0].output).toContain(MARKER_TEXT)
  })

  test('renders the "Read from page" transparency chip with the extractor description', async ({ page }) => {
    await page.goto('/chatbot/test-fixture?channel=playwright-extractor')

    const widget = page.locator('chatbot-widget')
    await expect(widget).toBeAttached()

    await widget.locator('button[part="launcher"]').click()
    await widget.locator('textarea[part="input"]').fill('What are these?')
    await widget.locator('button[part="send-button"]').click()

    // The built-in blade-snapshot extractor registers with description
    // "Page snapshot"; the chip surfaces that the page was read from.
    const chip = widget.locator('[part="extractor-chip"]')
    await expect(chip).toBeVisible()
    await expect(chip).toHaveText('Read from page: Page snapshot')
  })
})
