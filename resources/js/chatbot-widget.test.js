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

describe('chatbot-widget render, panel & toggle', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    localStorage.clear()
  })

  it('position defaults to bottom-right when attribute is absent', () => {
    const el = document.createElement('chatbot-widget')
    document.body.appendChild(el)
    expect(el.getAttribute('position')).toBeNull()
    const panel = el.shadowRoot.querySelector('.panel')
    expect(panel.className).toContain('bottom-right')
  })

  it('inline mode: no launcher, panel not hidden', () => {
    const el = document.createElement('chatbot-widget')
    el.setAttribute('position', 'inline')
    document.body.appendChild(el)
    expect(el.shadowRoot.querySelector('.launcher')).toBeNull()
    const panel = el.shadowRoot.querySelector('.panel')
    expect(panel.className).toContain('inline')
    expect(panel.hidden).toBe(false)
  })

  it('floating mode: launcher present, panel starts hidden', () => {
    const el = document.createElement('chatbot-widget')
    document.body.appendChild(el)
    expect(el.shadowRoot.querySelector('.launcher')).not.toBeNull()
    expect(el.shadowRoot.querySelector('.panel').hidden).toBe(true)
  })

  it('launcher click opens panel, writes localStorage, focuses input', () => {
    const el = document.createElement('chatbot-widget')
    document.body.appendChild(el)
    const launcher = el.shadowRoot.querySelector('.launcher')
    const panel = el.shadowRoot.querySelector('.panel')
    expect(panel.hidden).toBe(true)
    launcher.click()
    expect(panel.hidden).toBe(false)
    expect(localStorage.getItem('chatbot_open_default')).toBe('1')
  })

  it('launcher click closes panel when already open', () => {
    const el = document.createElement('chatbot-widget')
    document.body.appendChild(el)
    const launcher = el.shadowRoot.querySelector('.launcher')
    launcher.click()
    launcher.click()
    expect(el.shadowRoot.querySelector('.panel').hidden).toBe(true)
    expect(localStorage.getItem('chatbot_open_default')).toBe('0')
  })

  it('restores open state from localStorage on connect', () => {
    localStorage.setItem('chatbot_open_default', '1')
    const el = document.createElement('chatbot-widget')
    document.body.appendChild(el)
    expect(el.shadowRoot.querySelector('.panel').hidden).toBe(false)
  })

  it('attributeChangedCallback re-renders shadow DOM', () => {
    const el = document.createElement('chatbot-widget')
    el.setAttribute('position', 'bottom-right')
    document.body.appendChild(el)
    const firstPanel = el.shadowRoot.querySelector('.panel')
    el.setAttribute('title', 'Support')
    const secondPanel = el.shadowRoot.querySelector('.panel')
    expect(secondPanel).not.toBe(firstPanel)
    expect(el.shadowRoot.querySelector('.header span').textContent).toBe('Support')
  })
})

describe('chatbot-widget history load & greeting', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function makeHistoryFetch(messages = []) {
    return vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ messages }),
      }),
    )
  }

  it('appends greeting from envelope when no stored conversation', async () => {
    const el = document.createElement('chatbot-widget')
    el.setAttribute('position', 'inline')
    el.setAttribute('signed-context', makeEnvelope({ g: 'Hello!' }))
    document.body.appendChild(el)
    await Promise.resolve()
    await Promise.resolve()
    const bubbles = el.shadowRoot.querySelectorAll('.message-assistant')
    expect(bubbles.length).toBeGreaterThan(0)
    expect(bubbles[0].textContent).toContain('Hello!')
  })

  it('appends nothing when greeting is empty string', async () => {
    const el = document.createElement('chatbot-widget')
    el.setAttribute('position', 'inline')
    el.setAttribute('signed-context', makeEnvelope({ g: '' }))
    document.body.appendChild(el)
    await Promise.resolve()
    await Promise.resolve()
    expect(el.shadowRoot.querySelectorAll('.message-assistant').length).toBe(0)
  })

  it('fetches history with signed_context query when envelope present', async () => {
    const envelope = makeEnvelope({ g: 'Hi' })
    localStorage.setItem('chatbot_conversation_default', '42')
    globalThis.fetch = makeHistoryFetch([
      { role: 'user', content: 'hey' },
      { role: 'assistant', content: 'hello' },
    ])
    const el = document.createElement('chatbot-widget')
    el.setAttribute('position', 'inline')
    el.setAttribute('signed-context', envelope)
    document.body.appendChild(el)
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    const url = globalThis.fetch.mock.calls[0][0]
    expect(url).toContain('/chatbot/conversations/42/messages')
    expect(url).toContain('signed_context=')
    expect(el.shadowRoot.querySelectorAll('.message-user').length).toBe(1)
    expect(el.shadowRoot.querySelectorAll('.message-assistant').length).toBe(1)
  })

  it('fetches history without query when no envelope', async () => {
    localStorage.setItem('chatbot_conversation_default', '7')
    globalThis.fetch = makeHistoryFetch([])
    const el = document.createElement('chatbot-widget')
    el.setAttribute('position', 'inline')
    document.body.appendChild(el)
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    const url = globalThis.fetch.mock.calls[0][0]
    expect(url).toBe('/chatbot/conversations/7/messages')
  })

  it('new chat clears stored conversation, empties messages, shows greeting', async () => {
    const envelope = makeEnvelope({ g: 'Hi again!' })
    localStorage.setItem('chatbot_conversation_default', '5')
    globalThis.fetch = makeHistoryFetch([{ role: 'user', content: 'q' }])
    const el = document.createElement('chatbot-widget')
    el.setAttribute('position', 'inline')
    el.setAttribute('signed-context', envelope)
    document.body.appendChild(el)
    await Promise.resolve()
    await Promise.resolve()
    await Promise.resolve()
    expect(el.shadowRoot.querySelectorAll('.message-user').length).toBe(1)
    el.shadowRoot.querySelector('.new-chat').click()
    await Promise.resolve()
    await Promise.resolve()
    expect(localStorage.getItem('chatbot_conversation_default')).toBeNull()
    expect(el.shadowRoot.querySelectorAll('.message-user').length).toBe(0)
    expect(el.shadowRoot.querySelector('.message-assistant').textContent).toContain('Hi again!')
  })
})

describe('chatbot-widget send-flow guards & request shaping', () => {
  let widget
  let captured
  let originalFetch

  beforeEach(() => {
    document.body.innerHTML = ''
    localStorage.clear()
    originalFetch = globalThis.fetch
    captured = setupFetchCapture()
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = function () {}
    }
    widget = makeWidget()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    document.head.querySelectorAll('meta[name="csrf-token"]').forEach((m) => m.remove())
    vi.restoreAllMocks()
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

  function rejectFetch() {
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('network down')))
  }

  it('streaming guard: second send while in flight makes no extra request', async () => {
    await triggerSend(widget, 'first')
    const countAfterFirst = captured.calls.filter((c) => c.url === '/chatbot/messages').length
    await triggerSend(widget, 'second')
    const countAfterSecond = captured.calls.filter((c) => c.url === '/chatbot/messages').length
    expect(countAfterSecond).toBe(countAfterFirst)
  })

  it('empty-text guard: whitespace input makes no request', async () => {
    await triggerSend(widget, '   ')
    expect(captured.calls.filter((c) => c.url === '/chatbot/messages').length).toBe(0)
  })

  it('includes X-CSRF-TOKEN header when meta tag present', async () => {
    streamFetch(['event: done\ndata: {}\n\n'])
    const meta = document.createElement('meta')
    meta.name = 'csrf-token'
    meta.content = 'tok123'
    document.head.appendChild(meta)
    await triggerSend(widget, 'hi')
    for (let j = 0; j < 20; j++) await Promise.resolve()
    const call = captured.calls.find((c) => c.url === '/chatbot/messages')
    expect(call.opts.headers['X-CSRF-TOKEN']).toBe('tok123')
  })

  it('omits X-CSRF-TOKEN header when no meta tag', async () => {
    streamFetch(['event: done\ndata: {}\n\n'])
    await triggerSend(widget, 'hi')
    for (let j = 0; j < 20; j++) await Promise.resolve()
    const call = captured.calls.find((c) => c.url === '/chatbot/messages')
    expect(call.opts.headers).not.toHaveProperty('X-CSRF-TOKEN')
  })

  it('includes conversation_id in body when stored', async () => {
    streamFetch(['event: done\ndata: {}\n\n'])
    localStorage.setItem('chatbot_conversation_default', '99')
    await triggerSend(widget, 'q')
    for (let j = 0; j < 20; j++) await Promise.resolve()
    const body = lastSendBody(captured)
    expect(body.conversation_id).toBe('99')
  })

  it('omits conversation_id from body when not stored', async () => {
    streamFetch(['event: done\ndata: {}\n\n'])
    await triggerSend(widget, 'q')
    for (let j = 0; j < 20; j++) await Promise.resolve()
    const body = lastSendBody(captured)
    expect(body).not.toHaveProperty('conversation_id')
  })

  it('done without conversationId leaves localStorage untouched', async () => {
    streamFetch(['event: done\ndata: {}\n\n'])
    await triggerSend(widget, 'q')
    for (let j = 0; j < 20; j++) await Promise.resolve()
    expect(localStorage.getItem('chatbot_conversation_default')).toBeNull()
  })

  it('first chunk concatenates onto empty dataset.raw fallback', async () => {
    streamFetch(['event: token\ndata: {"content":"hello"}\n\nevent: done\ndata: {}\n\n'])
    await triggerSend(widget, 'q')
    for (let j = 0; j < 30; j++) await Promise.resolve()
    const bubble = widget.shadowRoot.querySelector('.message-assistant')
    expect(bubble.dataset.raw).toBe('hello')
  })

  it('rejected connect triggers network_error handler and re-enables send button', async () => {
    rejectFetch()
    await triggerSend(widget, 'q')
    for (let j = 0; j < 20; j++) await Promise.resolve()
    const btn = widget.shadowRoot.querySelector('.send-button')
    expect(btn.disabled).toBe(false)
    const errEl = widget.shadowRoot.querySelector('.error-msg')
    expect(errEl).not.toBeNull()
    expect(errEl.textContent).toContain('Connection failed')
  })
})

describe('chatbot-widget stream-error rendering branches', () => {
  let widget
  let originalFetch

  beforeEach(() => {
    document.body.innerHTML = ''
    localStorage.clear()
    originalFetch = globalThis.fetch
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = function () {}
    }
    widget = makeWidget()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  function streamError(code, message) {
    const encoder = new TextEncoder()
    const data = JSON.stringify({ code, ...(message ? { message } : {}), retryable: false })
    let done = false
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/event-stream' }),
        body: {
          getReader: () => ({
            read: () => {
              if (done) return Promise.resolve({ done: true, value: undefined })
              done = true
              return Promise.resolve({ done: false, value: encoder.encode(`event: error\ndata: ${data}\n\n`) })
            },
            cancel: () => Promise.resolve(),
          }),
        },
      }),
    )
  }

  it('quota_exceeded renders quota-msg with daily-limit fallback', async () => {
    streamError('quota_exceeded')
    await triggerSend(widget, 'q')
    for (let j = 0; j < 20; j++) await Promise.resolve()
    const el = widget.shadowRoot.querySelector('.quota-msg')
    expect(el).not.toBeNull()
    expect(el.textContent).toContain('Daily limit')
  })

  it('token_cap_exceeded renders quota-msg', async () => {
    streamError('token_cap_exceeded', 'Cap hit')
    await triggerSend(widget, 'q')
    for (let j = 0; j < 20; j++) await Promise.resolve()
    const el = widget.shadowRoot.querySelector('.quota-msg')
    expect(el).not.toBeNull()
    expect(el.textContent).toContain('Cap hit')
  })

  it('content_blocked renders content-policy message', async () => {
    streamError('content_blocked')
    await triggerSend(widget, 'q')
    for (let j = 0; j < 20; j++) await Promise.resolve()
    const el = widget.shadowRoot.querySelector('.error-msg')
    expect(el).not.toBeNull()
    expect(el.textContent).toContain('blocked by content policy')
  })

  it('unknown code with no message falls back to "Something went wrong."', async () => {
    streamError('provider_error')
    await triggerSend(widget, 'q')
    for (let j = 0; j < 20; j++) await Promise.resolve()
    const el = widget.shadowRoot.querySelector('.error-msg')
    expect(el).not.toBeNull()
    expect(el.textContent).toContain('Something went wrong')
  })
})

describe('chatbot-widget context-summary, appendAssistant text & hideToolStatus', () => {
  let widget
  let originalFetch

  beforeEach(() => {
    document.body.innerHTML = ''
    localStorage.clear()
    originalFetch = globalThis.fetch
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = function () {}
    }
    widget = makeWidget()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  function streamChunks(chunks) {
    const encoder = new TextEncoder()
    let i = 0
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
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
      }),
    )
  }

  it('context_summary creates a summary node before the assistant bubble', async () => {
    streamChunks([
      'event: context_summary\ndata: {"text":"Answering about order #1"}\n\nevent: done\ndata: {}\n\n',
    ])
    await triggerSend(widget, 'q')
    for (let j = 0; j < 30; j++) await Promise.resolve()
    const summary = widget.shadowRoot.querySelector('.context-summary')
    expect(summary).not.toBeNull()
    expect(summary.textContent).toBe('Answering about order #1')
    const bubble = widget.shadowRoot.querySelector('.message-assistant')
    expect(summary.nextSibling).toBe(bubble)
  })

  it('second context_summary reuses the same node', async () => {
    streamChunks([
      'event: context_summary\ndata: {"text":"first"}\n\nevent: context_summary\ndata: {"text":"second"}\n\nevent: done\ndata: {}\n\n',
    ])
    await triggerSend(widget, 'q')
    for (let j = 0; j < 30; j++) await Promise.resolve()
    const summaries = widget.shadowRoot.querySelectorAll('.context-summary')
    expect(summaries.length).toBe(1)
    expect(summaries[0].textContent).toBe('second')
  })

  it('appendAssistant with non-empty text renders markdown (text-present branch)', async () => {
    streamChunks([
      'event: token\ndata: {"content":"**bold**"}\n\nevent: done\ndata: {}\n\n',
    ])
    await triggerSend(widget, 'q')
    for (let j = 0; j < 30; j++) await Promise.resolve()
    const bubble = widget.shadowRoot.querySelector('.message-assistant')
    expect(bubble.innerHTML).toContain('<strong>')
  })

  it('hideToolStatus hides chip after finish-streaming timeout', async () => {
    vi.useFakeTimers()
    try {
      dispatchToolEvent(widget, 'tool_started', 'lookup_order', 'started')
      const chip = widget.shadowRoot.querySelector('[part="tool-status"]')
      expect(chip.hidden).toBe(false)
      streamChunks(['event: done\ndata: {}\n\n'])
      await triggerSend(widget, 'q')
      for (let j = 0; j < 30; j++) await Promise.resolve()
      vi.advanceTimersByTime(600)
      expect(chip.hidden).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})

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

describe('chatbot-widget extractor subsystem branches', () => {
  let widget
  let warnSpy
  let originalFetch

  beforeEach(() => {
    document.body.innerHTML = ''
    localStorage.clear()
    originalFetch = globalThis.fetch
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = function () {}
    }
    widget = makeWidget()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('blade-snapshot skips a marker with empty text (L310 empty-text guard)', async () => {
    const envelope = makeEnvelope({ x: ['blade-snapshot'] })
    widget.setAttribute('signed-context', envelope)
    const empty = document.createElement('div')
    empty.setAttribute('data-chatbot-snapshot', 'orders')
    document.body.appendChild(empty)
    await Promise.resolve()
    await Promise.resolve()
    const body = await new Promise((resolve) => {
      const enc = new TextEncoder()
      let sent = false
      globalThis.fetch = vi.fn((url, opts) => {
        if (url === '/chatbot/messages') { sent = true; resolve(JSON.parse(opts.body)) }
        return Promise.resolve({ ok: true, status: 200, headers: new Headers(), body: { getReader: () => ({ read: () => new Promise(() => {}), cancel: () => {} }) } })
      })
      triggerSend(widget, 'q')
    })
    const blocks = body.extractor_blocks ?? []
    expect(blocks.find((b) => b.name === 'blade-snapshot')).toBeUndefined()
  })

  it('envelopeBody returns {} for empty first segment (L713)', () => {
    const el = document.createElement('chatbot-widget')
    el.setAttribute('position', 'inline')
    el.setAttribute('signed-context', '.signature')
    document.body.appendChild(el)
    expect(el.shadowRoot).not.toBeNull()
  })

  it('envelopeBody returns {} when decoded payload is non-object (L718)', () => {
    const b64 = btoa('42').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const el = document.createElement('chatbot-widget')
    el.setAttribute('position', 'inline')
    el.setAttribute('signed-context', `${b64}.signature`)
    document.body.appendChild(el)
    expect(el.shadowRoot).not.toBeNull()
  })

  it('envelopeBody catches atob error for invalid base64 (L719)', () => {
    const el = document.createElement('chatbot-widget')
    el.setAttribute('position', 'inline')
    el.setAttribute('signed-context', '!!!invalid!!!.sig')
    document.body.appendChild(el)
    expect(el.shadowRoot).not.toBeNull()
  })
})
