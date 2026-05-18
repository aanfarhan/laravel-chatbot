// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import './chatbot-widget.js'

function makeWidget() {
  const el = document.createElement('chatbot-widget')
  el.setAttribute('position', 'inline')
  document.body.appendChild(el)
  return el
}

function makeEnvelope(body) {
  const payload = btoa(JSON.stringify(body))
  return `header.${payload}.signature`
}

function setupFetchCapture() {
  const captured = { calls: [] }
  globalThis.fetch = vi.fn((url, opts) => {
    captured.calls.push({ url, opts })
    return Promise.resolve({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/event-stream' }),
      body: {
        getReader: () => ({
          read: () => new Promise(() => {}),
          cancel: () => Promise.resolve(),
        }),
      },
    })
  })
  return captured
}

async function triggerSend(widget, text) {
  widget.shadowRoot.querySelector('.input').value = text
  widget.shadowRoot.querySelector('.send-button').click()
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

function lastSendBody(captured) {
  const send = captured.calls.find((c) => c.url === '/chatbot/messages')
  return send ? JSON.parse(send.opts.body) : null
}

function dispatchToolEvent(widget, type, name, phase) {
  widget.dispatchEvent(new CustomEvent(type, { bubbles: false, detail: { name, phase } }))
}

describe('chatbot-widget tool-status chip', () => {
  let widget

  beforeEach(() => {
    document.body.innerHTML = ''
    widget = makeWidget()
  })

  it('shows a tool-status chip when tool_started fires', () => {
    dispatchToolEvent(widget, 'tool_started', 'lookup_order', 'started')

    const chip = widget.shadowRoot.querySelector('[part="tool-status"]')
    expect(chip).not.toBeNull()
    expect(chip.hidden).toBe(false)
  })

  it('keeps the chip visible when tool_finished fires (hides only on stream done)', () => {
    dispatchToolEvent(widget, 'tool_started', 'lookup_order', 'started')
    dispatchToolEvent(widget, 'tool_finished', 'lookup_order', 'finished')

    const chip = widget.shadowRoot.querySelector('[part="tool-status"]')
    expect(chip).not.toBeNull()
    expect(chip.hidden).toBe(false)
  })

  it('keeps the chip visible when tool_failed fires (hides only on stream done)', () => {
    dispatchToolEvent(widget, 'tool_started', 'lookup_order', 'started')
    dispatchToolEvent(widget, 'tool_failed', 'lookup_order', 'failed')

    const chip = widget.shadowRoot.querySelector('[part="tool-status"]')
    expect(chip).not.toBeNull()
    expect(chip.hidden).toBe(false)
  })

  it('updates chip text on a new tool_started before previous terminal event', () => {
    dispatchToolEvent(widget, 'tool_started', 'lookup_order', 'started')
    dispatchToolEvent(widget, 'tool_started', 'search_products', 'started')

    const chip = widget.shadowRoot.querySelector('[part="tool-status"]')
    expect(chip.hidden).toBe(false)
    expect(chip.textContent).toContain('search_products')
  })
})

describe('chatbot-widget client extractors', () => {
  let widget
  let captured
  let originalFetch
  let warnSpy
  let errorSpy

  beforeEach(() => {
    document.body.innerHTML = ''
    originalFetch = globalThis.fetch
    captured = setupFetchCapture()
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = function () {}
    }
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    warnSpy.mockRestore()
    errorSpy.mockRestore()
  })

  it('attaches a registered extractor output to the outbound request', async () => {
    widget = makeWidget()
    widget.setAttribute('signed-context', makeEnvelope({ x: ['page_title'] }))
    widget.registerClientExtractor('page_title', () => 'Hello World')

    await triggerSend(widget, 'summarise')

    const body = lastSendBody(captured)
    expect(body.extractor_blocks).toEqual([{ name: 'page_title', output: 'Hello World' }])
  })

  it('awaits a Promise-returning extractor and uses its resolved value', async () => {
    widget = makeWidget()
    widget.setAttribute('signed-context', makeEnvelope({ x: ['article'] }))
    widget.registerClientExtractor('article', () => Promise.resolve('async body'))

    await triggerSend(widget, 'q')

    expect(lastSendBody(captured).extractor_blocks).toEqual([{ name: 'article', output: 'async body' }])
  })

  it('omits block and warns when an extractor exceeds the 250ms timeout', async () => {
    vi.useFakeTimers()
    try {
      widget = makeWidget()
      widget.setAttribute('signed-context', makeEnvelope({ x: ['slow'] }))
      widget.registerClientExtractor('slow', () => new Promise((r) => setTimeout(() => r('late'), 5000)))

      widget.shadowRoot.querySelector('.input').value = 'q'
      widget.shadowRoot.querySelector('.send-button').click()
      await vi.advanceTimersByTimeAsync(300)
      vi.useRealTimers()
      for (let i = 0; i < 10; i++) await Promise.resolve()
    } finally {
      if (vi.isFakeTimers?.()) vi.useRealTimers()
    }

    expect(lastSendBody(captured)?.extractor_blocks).toBeUndefined()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('slow'))
  })

  it('truncates output exceeding 8KB with a [truncated] marker', async () => {
    widget = makeWidget()
    widget.setAttribute('signed-context', makeEnvelope({ x: ['big'] }))
    const big = 'a'.repeat(10000)
    widget.registerClientExtractor('big', () => big)

    await triggerSend(widget, 'q')

    const block = lastSendBody(captured).extractor_blocks[0]
    expect(block.name).toBe('big')
    expect(block.output.endsWith(' [truncated]')).toBe(true)
    expect(new TextEncoder().encode(block.output).byteLength).toBeLessThanOrEqual(8192)
  })

  it.each([
    ['null', () => null],
    ['undefined', () => undefined],
    ['empty string', () => ''],
  ])('omits block when extractor returns %s', async (_label, fn) => {
    widget = makeWidget()
    widget.setAttribute('signed-context', makeEnvelope({ x: ['e'] }))
    widget.registerClientExtractor('e', fn)

    await triggerSend(widget, 'q')

    expect(lastSendBody(captured)?.extractor_blocks).toBeUndefined()
  })

  it('omits block and logs console.error when extractor throws; error not sent to server', async () => {
    widget = makeWidget()
    widget.setAttribute('signed-context', makeEnvelope({ x: ['boom'] }))
    widget.registerClientExtractor('boom', () => { throw new Error('explode') })

    await triggerSend(widget, 'q')

    const body = lastSendBody(captured)
    expect(body?.extractor_blocks).toBeUndefined()
    expect(JSON.stringify(body)).not.toContain('explode')
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('boom'), expect.any(Error))
  })

  it('fails loudly when envelope allowlists a name with no JS registration', async () => {
    widget = makeWidget()
    widget.setAttribute('signed-context', makeEnvelope({ x: ['missing_one'] }))

    await Promise.resolve()
    await Promise.resolve()

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('missing_one'))
  })

  it('renders a transparency chip listing fired extractors by description', async () => {
    widget = makeWidget()
    widget.setAttribute('signed-context', makeEnvelope({ x: ['page_title'] }))
    widget.registerClientExtractor('page_title', () => 'Hello World', { description: 'Current page title' })

    await triggerSend(widget, 'summarise')

    const chip = widget.shadowRoot.querySelector('[part="extractor-chip"]')
    expect(chip).not.toBeNull()
    expect(chip.textContent).toContain('Current page title')
  })

  it('chip label falls back to extractor name when no description was registered', async () => {
    widget = makeWidget()
    widget.setAttribute('signed-context', makeEnvelope({ x: ['raw_name'] }))
    widget.registerClientExtractor('raw_name', () => 'something')

    await triggerSend(widget, 'q')

    const chip = widget.shadowRoot.querySelector('[part="extractor-chip"]')
    expect(chip).not.toBeNull()
    expect(chip.textContent).toContain('raw_name')
  })

  it('does not render a chip when the channel has no allowlisted extractor', async () => {
    widget = makeWidget()
    widget.setAttribute('signed-context', makeEnvelope({ x: [] }))

    await triggerSend(widget, 'q')

    expect(widget.shadowRoot.querySelector('[part="extractor-chip"]')).toBeNull()
  })

  it('does not render a chip when every allowlisted extractor returned empty', async () => {
    widget = makeWidget()
    widget.setAttribute('signed-context', makeEnvelope({ x: ['quiet'] }))
    widget.registerClientExtractor('quiet', () => '', { description: 'Quiet' })

    await triggerSend(widget, 'q')

    expect(widget.shadowRoot.querySelector('[part="extractor-chip"]')).toBeNull()
  })

  it('exposes the chip via ::part(extractor-chip) so hosts can theme or hide it', async () => {
    widget = makeWidget()
    widget.setAttribute('signed-context', makeEnvelope({ x: ['t'] }))
    widget.registerClientExtractor('t', () => 'x', { description: 'T' })

    const style = document.createElement('style')
    style.textContent = `chatbot-widget::part(extractor-chip) { display: none; }`
    document.head.appendChild(style)

    await triggerSend(widget, 'q')

    const chip = widget.shadowRoot.querySelector('[part="extractor-chip"]')
    expect(chip).not.toBeNull()
    expect(chip.getAttribute('part')).toBe('extractor-chip')

    style.remove()
  })

  it('is transient: prior turn chip is gone on a subsequent turn that fires no extractors', async () => {
    const encoder = new TextEncoder()
    globalThis.fetch = vi.fn((url, opts) => {
      captured.calls.push({ url, opts })
      let sent = false
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        body: {
          getReader: () => ({
            read: () => {
              if (sent) return Promise.resolve({ done: true, value: undefined })
              sent = true
              return Promise.resolve({ done: false, value: encoder.encode('event: done\ndata: {}\n\n') })
            },
            cancel: () => Promise.resolve(),
          }),
        },
      })
    })

    widget = makeWidget()
    widget.setAttribute('signed-context', makeEnvelope({ x: ['t'] }))
    let fire = true
    widget.registerClientExtractor('t', () => (fire ? 'first' : ''), { description: 'T' })

    await triggerSend(widget, 'first')
    for (let i = 0; i < 20; i++) await Promise.resolve()
    expect(widget.shadowRoot.querySelectorAll('[part="extractor-chip"]').length).toBe(1)

    fire = false
    await triggerSend(widget, 'second')
    for (let i = 0; i < 20; i++) await Promise.resolve()
    expect(widget.shadowRoot.querySelectorAll('[part="extractor-chip"]').length).toBe(0)
  })

  it('honours envelope xt timeout override when running extractors', async () => {
    vi.useFakeTimers()
    try {
      widget = makeWidget()
      widget.setAttribute('signed-context', makeEnvelope({ x: ['slow'], xt: 1000 }))
      widget.registerClientExtractor('slow', () => new Promise((r) => setTimeout(() => r('on time'), 500)))

      widget.shadowRoot.querySelector('.input').value = 'q'
      widget.shadowRoot.querySelector('.send-button').click()
      await vi.advanceTimersByTimeAsync(700)
      vi.useRealTimers()
      for (let i = 0; i < 20; i++) await Promise.resolve()
    } finally {
      if (vi.isFakeTimers?.()) vi.useRealTimers()
    }

    expect(lastSendBody(captured)?.extractor_blocks).toEqual([
      { name: 'slow', output: 'on time' },
    ])
  })

  it('honours envelope xc size-cap override when truncating output', async () => {
    widget = makeWidget()
    widget.setAttribute('signed-context', makeEnvelope({ x: ['big'], xc: 16 }))
    widget.registerClientExtractor('big', () => 'a'.repeat(100))

    await triggerSend(widget, 'q')

    const block = lastSendBody(captured).extractor_blocks[0]
    expect(block.output.endsWith(' [truncated]')).toBe(true)
    expect(new TextEncoder().encode(block.output).byteLength).toBeLessThanOrEqual(16)
  })

  it('silently ignores JS registration of a name not in the allowlist', async () => {
    widget = makeWidget()
    widget.setAttribute('signed-context', makeEnvelope({ x: ['only_this'] }))
    widget.registerClientExtractor('only_this', () => 'yes')
    widget.registerClientExtractor('not_listed', () => 'ignored')

    await triggerSend(widget, 'q')

    const body = lastSendBody(captured)
    expect(body.extractor_blocks).toEqual([{ name: 'only_this', output: 'yes' }])
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
