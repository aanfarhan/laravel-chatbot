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
  // Mirror the real minted token: `base64url(body).base64url(signature)`.
  const b64 = btoa(JSON.stringify(body))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  return `${b64}.signature`
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

  it('shows an animated state and a client-computed elapsed timer that ticks up while in flight', () => {
    vi.useFakeTimers()
    try {
      dispatchToolEvent(widget, 'tool_started', 'lookup_order', 'started')

      const chip = widget.shadowRoot.querySelector('[part="tool-status"]')
      expect(chip.querySelector('.tool-status-spinner')).not.toBeNull()
      expect(chip.textContent).toContain('0:00')

      vi.advanceTimersByTime(42_000)
      expect(chip.textContent).toContain('0:42')

      vi.advanceTimersByTime(60_000)
      expect(chip.textContent).toContain('1:42')
    } finally {
      vi.useRealTimers()
    }
  })

  it('stops the elapsed timer on tool_finished (frozen value, still visible)', () => {
    vi.useFakeTimers()
    try {
      dispatchToolEvent(widget, 'tool_started', 'lookup_order', 'started')
      vi.advanceTimersByTime(5_000)

      const chip = widget.shadowRoot.querySelector('[part="tool-status"]')
      expect(chip.textContent).toContain('0:05')

      dispatchToolEvent(widget, 'tool_finished', 'lookup_order', 'finished')
      vi.advanceTimersByTime(30_000)

      expect(chip.hidden).toBe(false)
      expect(chip.textContent).toContain('0:05')
      expect(chip.textContent).not.toContain('0:35')
    } finally {
      vi.useRealTimers()
    }
  })

  it('stops the elapsed timer on tool_failed (frozen value, still visible)', () => {
    vi.useFakeTimers()
    try {
      dispatchToolEvent(widget, 'tool_started', 'lookup_order', 'started')
      vi.advanceTimersByTime(3_000)

      const chip = widget.shadowRoot.querySelector('[part="tool-status"]')
      expect(chip.textContent).toContain('0:03')

      dispatchToolEvent(widget, 'tool_failed', 'lookup_order', 'failed')
      vi.advanceTimersByTime(30_000)

      expect(chip.hidden).toBe(false)
      expect(chip.textContent).toContain('0:03')
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('chatbot-widget typing-dots loading indicator', () => {
  let widget
  let captured
  let originalFetch

  beforeEach(() => {
    document.body.innerHTML = ''
    originalFetch = globalThis.fetch
    captured = setupFetchCapture()
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = function () {}
    }
    widget = makeWidget()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  function streamFetch(chunks) {
    const encoder = new TextEncoder()
    let i = 0
    globalThis.fetch = vi.fn((url, opts) => {
      captured.calls.push({ url, opts })
      return Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        body: {
          getReader: () => ({
            read: () => {
              if (i >= chunks.length) return Promise.resolve({ done: true, value: undefined })
              return Promise.resolve({ done: false, value: encoder.encode(chunks[i++]) })
            },
            cancel: () => Promise.resolve(),
          }),
        },
      })
    })
  }

  it('renders typing-dots inside the empty assistant bubble immediately on send, before any SSE event', async () => {
    await triggerSend(widget, 'hello')

    const bubble = widget.shadowRoot.querySelector('.message-assistant')
    expect(bubble).not.toBeNull()
    const dots = bubble.querySelector('[part="typing-dots"]')
    expect(dots).not.toBeNull()
  })

  it('removes typing-dots on first chunk event', async () => {
    streamFetch(['event: token\ndata: {"content":"hi"}\n\n'])

    await triggerSend(widget, 'q')
    for (let i = 0; i < 30; i++) await Promise.resolve()

    const bubble = widget.shadowRoot.querySelector('.message-assistant')
    expect(bubble.querySelector('[part="typing-dots"]')).toBeNull()
  })

  it('removes typing-dots on done with no preceding chunks (tool-only turn)', async () => {
    streamFetch(['event: done\ndata: {}\n\n'])

    await triggerSend(widget, 'q')
    for (let i = 0; i < 30; i++) await Promise.resolve()

    const bubble = widget.shadowRoot.querySelector('.message-assistant')
    expect(bubble.querySelector('[part="typing-dots"]')).toBeNull()
  })

  it('offers only copy and regenerate actions on done, with no rating buttons or message id', async () => {
    streamFetch(['event: done\ndata: {"message_id":42}\n\n'])

    await triggerSend(widget, 'q')
    for (let i = 0; i < 30; i++) await Promise.resolve()

    const bubble = widget.shadowRoot.querySelector('.message-assistant')
    expect(bubble.dataset.messageId).toBeUndefined()

    const actions = widget.shadowRoot.querySelector('.message-actions')
    const labels = [...actions.querySelectorAll('button')].map((b) => b.textContent)
    expect(labels).toEqual(['📋 Copy', '🔄 Regenerate'])
    expect(captured.calls.some((c) => /\/rate$/.test(c.url))).toBe(false)
  })

  it('removes typing-dots on error event', async () => {
    streamFetch(['event: error\ndata: {"code":"network_error","message":"boom","retryable":true}\n\n'])

    await triggerSend(widget, 'q')
    for (let i = 0; i < 30; i++) await Promise.resolve()

    expect(widget.shadowRoot.querySelector('[part="typing-dots"]')).toBeNull()
  })

  it('exposes typing-dots via ::part(typing-dots) so hosts can theme it', async () => {
    await triggerSend(widget, 'q')

    const dots = widget.shadowRoot.querySelector('[part="typing-dots"]')
    expect(dots).not.toBeNull()
    expect(dots.getAttribute('part')).toBe('typing-dots')
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

  it('throws synchronously when host registers the reserved name blade-snapshot', () => {
    widget = makeWidget()

    expect(() => widget.registerClientExtractor('blade-snapshot', () => 'x'))
      .toThrow(/blade-snapshot.*reserved/)
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

  it('auto-registers the built-in blade-snapshot extractor when allowlisted, capturing marker innerText under its label', async () => {
    document.body.innerHTML = ''
    const marker = document.createElement('span')
    marker.setAttribute('data-chatbot-snapshot', 'article')
    marker.textContent = 'Hello world'
    document.body.appendChild(marker)

    widget = makeWidget()
    widget.setAttribute('signed-context', makeEnvelope({ x: ['blade-snapshot'] }))

    await triggerSend(widget, 'q')

    const body = lastSendBody(captured)
    expect(body.extractor_blocks).toHaveLength(1)
    expect(body.extractor_blocks[0].name).toBe('blade-snapshot')
    expect(body.extractor_blocks[0].output).toContain('article')
    expect(body.extractor_blocks[0].output).toContain('Hello world')
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('replays the same blade-snapshot aggregate on consecutive user turns within one page load', async () => {
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

    document.body.innerHTML = ''
    const marker = document.createElement('span')
    marker.setAttribute('data-chatbot-snapshot', 'article')
    marker.textContent = 'Hello world'
    document.body.appendChild(marker)

    widget = makeWidget()
    widget.setAttribute('signed-context', makeEnvelope({ x: ['blade-snapshot'] }))

    await triggerSend(widget, 'first question')
    for (let i = 0; i < 20; i++) await Promise.resolve()
    await triggerSend(widget, 'what about the third paragraph?')
    for (let i = 0; i < 20; i++) await Promise.resolve()

    const sendCalls = captured.calls.filter((c) => c.url === '/chatbot/messages')
    expect(sendCalls).toHaveLength(2)

    const blockA = JSON.parse(sendCalls[0].opts.body).extractor_blocks
    const blockB = JSON.parse(sendCalls[1].opts.body).extractor_blocks

    expect(blockA).toHaveLength(1)
    expect(blockA[0].name).toBe('blade-snapshot')
    expect(blockA[0].output).toContain('Hello world')
    expect(blockB).toEqual(blockA)
  })

  it('concatenates same-label markers in document order under one section', async () => {
    document.body.innerHTML = ''
    const a = document.createElement('p')
    a.setAttribute('data-chatbot-snapshot', 'rows')
    a.textContent = 'first row'
    const b = document.createElement('p')
    b.setAttribute('data-chatbot-snapshot', 'rows')
    b.textContent = 'second row'
    const c = document.createElement('p')
    c.setAttribute('data-chatbot-snapshot', 'rows')
    c.textContent = 'third row'
    document.body.append(a, b, c)

    widget = makeWidget()
    widget.setAttribute('signed-context', makeEnvelope({ x: ['blade-snapshot'] }))

    await triggerSend(widget, 'q')

    const output = lastSendBody(captured).extractor_blocks[0].output
    expect(output).toBe('## rows\n\nfirst row\n\nsecond row\n\nthird row')
  })

  it('emits separate sections for distinct labels with the documented divider shape', async () => {
    // Divider contract: sections are joined by '\n\n' and each section is '## <label>\n\n<body>'.
    // Changing the divider should require updating this test, not just passing it.
    document.body.innerHTML = ''
    const a = document.createElement('p')
    a.setAttribute('data-chatbot-snapshot', 'article')
    a.textContent = 'body text'
    const b = document.createElement('p')
    b.setAttribute('data-chatbot-snapshot', 'sidebar')
    b.textContent = 'aside text'
    document.body.append(a, b)

    widget = makeWidget()
    widget.setAttribute('signed-context', makeEnvelope({ x: ['blade-snapshot'] }))

    await triggerSend(widget, 'q')

    const output = lastSendBody(captured).extractor_blocks[0].output
    expect(output).toBe('## article\n\nbody text\n\n## sidebar\n\naside text')
  })

  it('drops markers with invalid labels (warn) while keeping valid labels in the same DOM', async () => {
    document.body.innerHTML = ''
    const bad = document.createElement('p')
    bad.setAttribute('data-chatbot-snapshot', 'Bad Label!')
    bad.textContent = 'should be dropped'
    const good = document.createElement('p')
    good.setAttribute('data-chatbot-snapshot', 'article')
    good.textContent = 'keep me'
    document.body.append(bad, good)

    widget = makeWidget()
    widget.setAttribute('signed-context', makeEnvelope({ x: ['blade-snapshot'] }))

    await triggerSend(widget, 'q')

    const output = lastSendBody(captured).extractor_blocks[0].output
    expect(output).toBe('## article\n\nkeep me')
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Bad Label!'))
  })

  it('reads innerText (not textContent) so display:none content is excluded by the browser', async () => {
    // jsdom does not compute layout, so display:none is not actually excluded by its innerText.
    // We assert the contract by giving innerText and textContent divergent values and verifying
    // the impl picks innerText — which is what gives display:none semantics in real browsers.
    document.body.innerHTML = ''
    const marker = document.createElement('div')
    marker.setAttribute('data-chatbot-snapshot', 'article')
    marker.textContent = 'visible hidden-secret'
    Object.defineProperty(marker, 'innerText', {
      configurable: true,
      get: () => 'visible',
    })
    document.body.appendChild(marker)

    widget = makeWidget()
    widget.setAttribute('signed-context', makeEnvelope({ x: ['blade-snapshot'] }))

    await triggerSend(widget, 'q')

    const output = lastSendBody(captured).extractor_blocks[0].output
    expect(output).toBe('## article\n\nvisible')
    expect(output).not.toContain('hidden-secret')
  })

  it('does not auto-register blade-snapshot when not in the allowlist', async () => {
    document.body.innerHTML = ''
    const marker = document.createElement('span')
    marker.setAttribute('data-chatbot-snapshot', 'article')
    marker.textContent = 'Hello world'
    document.body.appendChild(marker)

    widget = makeWidget()
    widget.setAttribute('signed-context', makeEnvelope({ x: [] }))

    await triggerSend(widget, 'q')

    expect(lastSendBody(captured)?.extractor_blocks).toBeUndefined()
  })

  it('omits the blade-snapshot block when no markers are in the DOM', async () => {
    document.body.innerHTML = ''
    widget = makeWidget()
    widget.setAttribute('signed-context', makeEnvelope({ x: ['blade-snapshot'] }))

    await triggerSend(widget, 'q')

    expect(lastSendBody(captured)?.extractor_blocks).toBeUndefined()
  })

  it('fires a loud blade-snapshot-specific error when allowlisted but the built-in did not register (bundle mismatch)', async () => {
    const { ChatbotWidget } = await import('./chatbot-widget.js')
    const spy = vi.spyOn(ChatbotWidget.prototype, '_registerBuiltinExtractors').mockImplementation(() => {})

    try {
      widget = makeWidget()
      widget.setAttribute('signed-context', makeEnvelope({ x: ['blade-snapshot'] }))

      await Promise.resolve()
      await Promise.resolve()

      const messages = errorSpy.mock.calls.map((c) => String(c[0]))
      const specific = messages.find((m) => m.includes('blade-snapshot') && (m.includes('built-in') || m.includes('bundle')))
      expect(specific, `expected a blade-snapshot-specific built-in/bundle error; got: ${JSON.stringify(messages)}`).toBeDefined()
      const generic = messages.find((m) => m.includes('blade-snapshot') && m.includes('has no matching JS registration'))
      expect(generic, 'generic mismatch warning must not duplicate the blade-snapshot-specific one').toBeUndefined()
    } finally {
      spy.mockRestore()
    }
  })

  it('does not fire the missing-registration error for blade-snapshot at boot', async () => {
    widget = makeWidget()
    widget.setAttribute('signed-context', makeEnvelope({ x: ['blade-snapshot'] }))

    await Promise.resolve()
    await Promise.resolve()

    expect(errorSpy).not.toHaveBeenCalledWith(expect.stringContaining('blade-snapshot'))
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
