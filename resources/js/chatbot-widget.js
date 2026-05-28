import { SSEClient } from './SSEClient.js'
import { MarkdownRenderer } from './MarkdownRenderer.js'
import '../css/chatbot-widget.css'

const STORAGE_KEY = (channel) => `chatbot_open_${channel}`
const CONV_KEY = (channel) => `chatbot_conversation_${channel}`

const css = `
:host {
  --chatbot-primary: #6366f1;
  --chatbot-on-primary: #ffffff;
  --chatbot-surface: #ffffff;
  --chatbot-on-surface: #1f2937;
  --chatbot-radius: 12px;
  --chatbot-font: system-ui, sans-serif;
  --chatbot-shadow: 0 8px 32px rgba(0,0,0,0.16);
  --chatbot-z-index: 9999;
  font-family: var(--chatbot-font);
}
.launcher {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--chatbot-primary);
  color: var(--chatbot-on-primary);
  border: none;
  cursor: pointer;
  box-shadow: var(--chatbot-shadow);
  z-index: var(--chatbot-z-index);
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.launcher.bottom-left { right: auto; left: 24px; }
.panel {
  position: fixed;
  bottom: 96px;
  right: 24px;
  width: 380px;
  max-height: 560px;
  border-radius: var(--chatbot-radius);
  background: var(--chatbot-surface);
  color: var(--chatbot-on-surface);
  box-shadow: var(--chatbot-shadow);
  z-index: var(--chatbot-z-index);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel.bottom-left { right: auto; left: 24px; }
.panel.inline {
  position: static;
  width: 100%;
  max-height: 560px;
  border-radius: var(--chatbot-radius);
  box-shadow: var(--chatbot-shadow);
}
.panel[hidden] { display: none !important; }
.header {
  background: var(--chatbot-primary);
  color: var(--chatbot-on-primary);
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}
.new-chat {
  background: none;
  border: 1px solid var(--chatbot-on-primary);
  color: var(--chatbot-on-primary);
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
}
.messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.message { padding: 8px 12px; border-radius: 8px; max-width: 85%; }
.message-user {
  background: var(--chatbot-primary);
  color: var(--chatbot-on-primary);
  align-self: flex-end;
}
.message-assistant {
  background: #f3f4f6;
  align-self: flex-start;
}
.context-summary {
  font-size: 11px;
  color: #6b7280;
  padding: 2px 0 4px;
  align-self: flex-start;
}
.extractor-chip {
  font-size: 11px;
  color: #6b7280;
  background: #f3f4f6;
  border-radius: 9999px;
  padding: 2px 10px;
  align-self: flex-end;
  max-width: fit-content;
}
.tool-status {
  font-size: 12px;
  color: #374151;
  background: #e5e7eb;
  border-radius: 9999px;
  padding: 4px 12px;
  align-self: flex-start;
  max-width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.tool-status[hidden] {
  display: none;
}
.tool-status-spinner {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: #6b7280;
  animation: tool-status-pulse 1s ease-in-out infinite;
}
@keyframes tool-status-pulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}
.typing-dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
}
.typing-dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: #6b7280;
  animation: tool-status-pulse 1s ease-in-out infinite;
}
.typing-dot:nth-child(2) { animation-delay: 0.2s; }
.typing-dot:nth-child(3) { animation-delay: 0.4s; }
.message-actions {
  display: flex;
  gap: 4px;
  margin-top: 4px;
  align-self: flex-start;
}
.action-btn {
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 2px 6px;
  cursor: pointer;
  font-size: 11px;
  color: #6b7280;
}
.action-btn:hover { background: #f3f4f6; }
.error-msg {
  background: #fee2e2;
  color: #991b1b;
  align-self: stretch;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.retry-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 12px;
  white-space: nowrap;
}
.quota-msg { background: #fef3c7; color: #92400e; align-self: stretch; }
.input-row {
  display: flex;
  padding: 8px;
  gap: 8px;
  border-top: 1px solid #e5e7eb;
}
.input {
  flex: 1;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 8px;
  font-family: var(--chatbot-font);
  font-size: 14px;
  resize: none;
  min-height: 36px;
  max-height: 120px;
}
.send-button {
  background: var(--chatbot-primary);
  color: var(--chatbot-on-primary);
  border: none;
  border-radius: 6px;
  padding: 8px 14px;
  cursor: pointer;
  font-size: 14px;
}
.send-button:disabled { opacity: 0.5; cursor: not-allowed; }
@media (max-width: 480px) {
  .panel {
    position: fixed;
    inset: 0;
    width: 100%;
    max-height: 100%;
    border-radius: 0;
    bottom: 0;
    right: 0;
  }
  .launcher { bottom: 16px; right: 16px; }
}
`

class ChatbotWidget extends HTMLElement {
  static observedAttributes = ['channel', 'position', 'title']

  #shadow
  #renderer = new MarkdownRenderer()
  #open = false
  #streaming = false
  #lastUserMessage = null
  #lastAssistantBubble = null
  #contextSummary = null
  #toolStatusEl = null
  #toolTimerInterval = null
  #toolStartedAt = null
  #toolLabelEl = null
  #extractors = new Map()

  constructor() {
    super()
    this.#shadow = this.attachShadow({ mode: 'open' })
  }

  registerClientExtractor(name, fn, options = {}) {
    if (ChatbotWidget.#RESERVED_EXTRACTOR_NAMES.includes(name)) {
      throw new Error(
        `Client extractor name '${name}' is reserved and cannot be registered by hosts.`,
      )
    }
    this.#registerInternalExtractor(name, fn, options)
  }

  static #RESERVED_EXTRACTOR_NAMES = ['blade-snapshot']

  #registerInternalExtractor(name, fn, options = {}) {
    this.#extractors.set(name, { fn, description: options.description })
  }

  get channel() { return this.getAttribute('channel') || 'default' }
  get position() { return this.getAttribute('position') || 'bottom-right' }
  get title() { return this.getAttribute('title') || 'Chat' }

  connectedCallback() {
    this.#render()
    this.#restoreState()
    this.#loadHistory()
    this.addEventListener('tool_started', (e) => this.#showToolStatus(e.detail.name))
    this.addEventListener('tool_finished', () => this.#resolveToolStatus())
    this.addEventListener('tool_failed', () => this.#resolveToolStatus())
    queueMicrotask(() => {
      this._registerBuiltinExtractors()
      this.#bootAllowlistCheck()
    })
  }

  _registerBuiltinExtractors() {
    const allowed = this.#allowedExtractors(this.getAttribute('signed-context'))
    if (allowed.includes('blade-snapshot') && !this.#extractors.has('blade-snapshot')) {
      this.#registerInternalExtractor(
        'blade-snapshot',
        () => this.#captureBladeSnapshot(),
        { description: 'Page snapshot' },
      )
    }
  }

  #captureBladeSnapshot() {
    const markers = document.querySelectorAll('[data-chatbot-snapshot]')
    if (markers.length === 0) return ''

    const groups = new Map()
    const order = []
    const labelPattern = /^[a-z][a-z0-9_-]*$/
    for (const el of markers) {
      const label = el.getAttribute('data-chatbot-snapshot') ?? ''
      if (!labelPattern.test(label)) {
        console.warn(`@chatbotSnapshot label '${label}' is invalid; section dropped.`)
        continue
      }
      const text = (el.innerText ?? el.textContent ?? '').trim()
      if (!text) continue
      if (!groups.has(label)) {
        groups.set(label, [])
        order.push(label)
      }
      groups.get(label).push(text)
    }

    const sections = order.map((label) => `## ${label}\n\n${groups.get(label).join('\n\n')}`)
    return sections.join('\n\n')
  }

  #bootAllowlistCheck() {
    const allowed = this.#allowedExtractors(this.getAttribute('signed-context'))
    for (const name of allowed) {
      if (this.#extractors.has(name)) continue
      if (ChatbotWidget.#RESERVED_EXTRACTOR_NAMES.includes(name)) {
        console.error(
          `Built-in client extractor '${name}' is in the signed allowlist but was not registered at boot — likely a widget bundle mismatch after an upgrade. Page content for '${name}' will not be sent.`
        )
        continue
      }
      console.error(
        `Client extractor '${name}' is in the signed allowlist but has no matching JS registration on the widget.`
      )
    }
  }

  attributeChangedCallback() {
    if (this.#shadow.innerHTML) this.#render()
  }

  #render() {
    const style = document.createElement('style')
    style.textContent = css

    const isInline = this.position === 'inline'

    this.#shadow.innerHTML = ''
    this.#shadow.appendChild(style)

    if (!isInline) {
      const launcher = document.createElement('button')
      launcher.className = `launcher ${this.position}`
      launcher.part = 'launcher'
      launcher.innerHTML = '💬'
      launcher.setAttribute('aria-label', 'Open chat')
      launcher.addEventListener('click', () => this.#togglePanel())
      this.#shadow.appendChild(launcher)
    }

    const panel = document.createElement('div')
    panel.className = `panel ${isInline ? 'inline' : this.position}`
    panel.part = 'panel'
    if (!isInline && !this.#open) panel.hidden = true

    const header = document.createElement('div')
    header.className = 'header'
    header.part = 'header'
    header.innerHTML = `<span>${this.title}</span>`

    const newChat = document.createElement('button')
    newChat.className = 'new-chat'
    newChat.textContent = 'New chat'
    newChat.addEventListener('click', () => this.#newConversation())
    header.appendChild(newChat)
    panel.appendChild(header)

    const messages = document.createElement('div')
    messages.className = 'messages'
    messages.part = 'messages'
    panel.appendChild(messages)

    const toolStatus = document.createElement('div')
    toolStatus.className = 'tool-status'
    toolStatus.setAttribute('part', 'tool-status')
    toolStatus.hidden = true
    panel.appendChild(toolStatus)
    this.#toolStatusEl = toolStatus

    const inputRow = document.createElement('div')
    inputRow.className = 'input-row'

    const input = document.createElement('textarea')
    input.className = 'input'
    input.part = 'input'
    input.placeholder = 'Ask a question…'
    input.rows = 1
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.#send() }
    })
    inputRow.appendChild(input)

    const sendBtn = document.createElement('button')
    sendBtn.className = 'send-button'
    sendBtn.part = 'send-button'
    sendBtn.textContent = 'Send'
    sendBtn.addEventListener('click', () => this.#send())
    inputRow.appendChild(sendBtn)

    panel.appendChild(inputRow)
    this.#shadow.appendChild(panel)
  }

  #panel() { return this.#shadow.querySelector('.panel') }
  #messagesEl() { return this.#shadow.querySelector('.messages') }
  #inputEl() { return this.#shadow.querySelector('.input') }
  #sendBtn() { return this.#shadow.querySelector('.send-button') }

  #togglePanel() {
    this.#open = !this.#open
    const panel = this.#panel()
    if (panel) panel.hidden = !this.#open
    localStorage.setItem(STORAGE_KEY(this.channel), this.#open ? '1' : '0')
    if (this.#open) this.#inputEl()?.focus()
  }

  #restoreState() {
    const saved = localStorage.getItem(STORAGE_KEY(this.channel))
    if (saved === '1') {
      this.#open = true
      const panel = this.#panel()
      if (panel) panel.hidden = false
    }
  }

  #loadGreeting() {
    const envelope = this.getAttribute('signed-context')
    if (!envelope) return
    try {
      const payload = JSON.parse(atob(envelope.split('.')[1] ?? ''))
      if (payload.greeting) this.#appendAssistant(payload.greeting)
    } catch { /* no greeting */ }
  }

  async #loadHistory() {
    const conversationId = localStorage.getItem(CONV_KEY(this.channel))
    if (!conversationId) {
      this.#loadGreeting()
      return
    }
    try {
      const response = await fetch(`/chatbot/conversations/${conversationId}/messages`)
      if (!response.ok) {
        localStorage.removeItem(CONV_KEY(this.channel))
        this.#loadGreeting()
        return
      }
      const { messages } = await response.json()
      for (const msg of messages) {
        if (msg.role === 'user') this.#appendUser(msg.content)
        else if (msg.role === 'assistant') this.#appendAssistant(msg.content)
      }
    } catch {
      this.#loadGreeting()
    }
  }

  #newConversation() {
    localStorage.removeItem(CONV_KEY(this.channel))
    const messages = this.#messagesEl()
    if (messages) messages.innerHTML = ''
    this.#lastUserMessage = null
    this.#lastAssistantBubble = null
    this.#contextSummary = null
    this.#loadGreeting()
  }

  async #send() {
    if (this.#streaming) return

    const input = this.#inputEl()
    const text = input?.value.trim()
    if (!text) return

    input.value = ''
    this.#appendUser(text)

    const envelope = this.getAttribute('signed-context')
    const conversationId = localStorage.getItem(CONV_KEY(this.channel))
    const extractorBlocks = await this.#runExtractors(envelope)
    this.#clearExtractorChips()
    this.#renderExtractorChip(extractorBlocks)

    this.#streaming = true
    const btn = this.#sendBtn()
    if (btn) btn.disabled = true

    const bubble = this.#appendAssistant('')
    this.#showTypingDots(bubble)
    this.#lastAssistantBubble = bubble
    this.#contextSummary = null

    const client = new SSEClient()
    client.addEventListener('chunk', (e) => {
      this.#removeTypingDots(bubble)
      bubble.dataset.raw = (bubble.dataset.raw ?? '') + e.detail.text
      bubble.innerHTML = this.#renderer.render(bubble.dataset.raw)
    })
    client.addEventListener('context_summary', (e) => {
      const summary = this.#ensureContextSummary(bubble)
      summary.textContent = e.detail.text
    })
    client.addEventListener('done', (e) => {
      this.#removeTypingDots(bubble)
      if (e.detail?.conversationId) {
        localStorage.setItem(CONV_KEY(this.channel), e.detail.conversationId)
      }
      this.#addMessageActions(bubble)
      this.#finishStreaming()
    })
    client.addEventListener('tool_started', (e) => this.dispatchEvent(new CustomEvent('tool_started', { detail: e.detail })))
    client.addEventListener('tool_finished', (e) => this.dispatchEvent(new CustomEvent('tool_finished', { detail: e.detail })))
    client.addEventListener('tool_failed', (e) => this.dispatchEvent(new CustomEvent('tool_failed', { detail: e.detail })))
    client.addEventListener('error', (e) => {
      this.#handleStreamError(e.detail, bubble, text, envelope, conversationId)
      this.#finishStreaming()
    })

    const csrf = document.querySelector('meta[name="csrf-token"]')?.content

    try {
      await client.connect('/chatbot/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
        },
        body: JSON.stringify({
          message: text,
          signed_context: envelope,
          ...(conversationId ? { conversation_id: conversationId } : {}),
          ...(extractorBlocks.length ? { extractor_blocks: extractorBlocks } : {}),
        }),
      })
    } catch {
      this.#handleStreamError({ code: 'network_error', message: 'Connection failed.', retryable: true }, bubble, text, envelope, conversationId)
      this.#finishStreaming()
    }
  }

  #appendUser(text) {
    const messages = this.#messagesEl()
    const el = document.createElement('div')
    el.className = 'message message-user'
    el.part = 'message-user'
    el.textContent = text
    messages?.appendChild(el)
    el.scrollIntoView({ behavior: 'smooth' })
    this.#lastUserMessage = text
    return el
  }

  #appendAssistant(text) {
    const messages = this.#messagesEl()
    const el = document.createElement('div')
    el.className = 'message message-assistant'
    el.part = 'message-assistant'
    el.dataset.raw = text
    if (text) el.innerHTML = this.#renderer.render(text)
    messages?.appendChild(el)
    el.scrollIntoView({ behavior: 'smooth' })
    return el
  }

  #ensureContextSummary(bubble) {
    if (this.#contextSummary) return this.#contextSummary
    const summary = document.createElement('div')
    summary.className = 'context-summary'
    bubble.parentElement?.insertBefore(summary, bubble)
    this.#contextSummary = summary
    return summary
  }

  #addMessageActions(bubble) {
    const actions = document.createElement('div')
    actions.className = 'message-actions'

    const copy = document.createElement('button')
    copy.className = 'action-btn'
    copy.textContent = '📋 Copy'
    copy.addEventListener('click', () => navigator.clipboard.writeText(bubble.dataset.raw ?? ''))

    const regen = document.createElement('button')
    regen.className = 'action-btn'
    regen.textContent = '🔄 Regenerate'
    regen.addEventListener('click', () => {
      bubble.dataset.raw = ''
      bubble.innerHTML = ''
      actions.remove()
      if (this.#lastUserMessage) this.#send()
    })

    const thumbUp = document.createElement('button')
    thumbUp.className = 'action-btn'
    thumbUp.textContent = '👍'
    thumbUp.addEventListener('click', () => this.#rate(bubble, 1, thumbUp, thumbDown))

    const thumbDown = document.createElement('button')
    thumbDown.className = 'action-btn'
    thumbDown.textContent = '👎'
    thumbDown.addEventListener('click', () => this.#rate(bubble, -1, thumbUp, thumbDown))

    actions.append(copy, regen, thumbUp, thumbDown)
    bubble.parentElement?.insertBefore(actions, bubble.nextSibling)
  }

  async #rate(bubble, value, upBtn, downBtn) {
    const messageId = bubble.dataset.messageId
    if (!messageId) return
    const csrf = document.querySelector('meta[name="csrf-token"]')?.content
    await fetch('/chatbot/messages/' + messageId + '/rate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
      },
      body: JSON.stringify({ value }),
    })
    upBtn.disabled = true
    downBtn.disabled = true
  }

  #handleStreamError(detail, bubble, originalMessage, envelope, conversationId) {
    const messages = this.#messagesEl()
    bubble.remove()

    const errEl = document.createElement('div')
    errEl.className = 'message error-msg'

    if (detail.code === 'quota_exceeded' || detail.code === 'token_cap_exceeded') {
      errEl.className = 'message quota-msg'
      errEl.textContent = detail.message || 'Daily limit reached. Try again later.'
    } else if (detail.code === 'content_blocked') {
      errEl.textContent = detail.message || 'This message was blocked by content policy.'
    } else {
      errEl.textContent = detail.message || 'Something went wrong.'
      if (detail.retryable) {
        const retryBtn = document.createElement('button')
        retryBtn.className = 'retry-btn'
        retryBtn.textContent = 'Retry'
        retryBtn.addEventListener('click', () => {
          errEl.remove()
          this.#inputEl() && (this.#inputEl().value = originalMessage)
          this.#send()
        })
        errEl.appendChild(retryBtn)
      }
    }

    messages?.appendChild(errEl)
    errEl.scrollIntoView({ behavior: 'smooth' })
  }

  #showToolStatus(name) {
    if (!this.#toolStatusEl) return
    this.#stopToolTimer()

    this.#toolStatusEl.textContent = ''
    const spinner = document.createElement('span')
    spinner.className = 'tool-status-spinner'
    spinner.setAttribute('aria-hidden', 'true')
    const label = document.createElement('span')
    label.className = 'tool-status-label'
    this.#toolStatusEl.appendChild(spinner)
    this.#toolStatusEl.appendChild(label)
    this.#toolLabelEl = label

    this.#toolStartedAt = Date.now()
    this.#renderToolLabel(name)
    this.#toolTimerInterval = setInterval(() => this.#renderToolLabel(name), 1000)
    this.#toolStatusEl.removeAttribute('hidden')
  }

  #renderToolLabel(name) {
    if (!this.#toolLabelEl || this.#toolStartedAt === null) return
    const seconds = Math.floor((Date.now() - this.#toolStartedAt) / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = String(seconds % 60).padStart(2, '0')
    this.#toolLabelEl.textContent = `Running ${name}… ${mins}:${secs}`
  }

  #stopToolTimer() {
    if (this.#toolTimerInterval !== null) {
      clearInterval(this.#toolTimerInterval)
      this.#toolTimerInterval = null
    }
  }

  #resolveToolStatus() {
    this.#stopToolTimer()
  }

  #showTypingDots(bubble) {
    const dots = document.createElement('span')
    dots.className = 'typing-dots'
    dots.setAttribute('part', 'typing-dots')
    dots.setAttribute('aria-label', 'Assistant is typing')
    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('span')
      dot.className = 'typing-dot'
      dots.appendChild(dot)
    }
    bubble.appendChild(dots)
  }

  #removeTypingDots(bubble) {
    bubble?.querySelector('.typing-dots')?.remove()
  }

  #hideToolStatus() {
    if (!this.#toolStatusEl) return
    this.#stopToolTimer()
    this.#toolStartedAt = null
    this.#toolStatusEl.setAttribute('hidden', '')
  }

  #allowedExtractors(envelope) {
    if (!envelope) return []
    try {
      const payload = JSON.parse(atob(envelope.split('.')[1] ?? ''))
      return Array.isArray(payload.x) ? payload.x : []
    } catch { return [] }
  }

  #envelopeBody(envelope) {
    if (!envelope) return {}
    try { return JSON.parse(atob(envelope.split('.')[1] ?? '')) } catch { return {} }
  }

  async #runExtractors(envelope) {
    const allowed = this.#allowedExtractors(envelope)
    if (allowed.length === 0) return []
    this._registerBuiltinExtractors()

    const body = this.#envelopeBody(envelope)
    const timeoutMs = Number.isInteger(body.xt) && body.xt > 0 ? body.xt : 250
    const sizeCap = Number.isInteger(body.xc) && body.xc > 0 ? body.xc : 8192

    const results = await Promise.all(allowed.map(async (name) => {
      const entry = this.#extractors.get(name)
      if (!entry) return null
      const fn = entry.fn
      try {
        const value = await Promise.race([
          Promise.resolve().then(() => fn()),
          new Promise((_, reject) => setTimeout(() => reject(new Error('__extractor_timeout__')), timeoutMs)),
        ])
        if (value === null || value === undefined || value === '') {
          console.warn(`Client extractor '${name}' returned empty output; block omitted.`)
          return null
        }
        let output = String(value)
        const bytes = new TextEncoder().encode(output)
        if (bytes.byteLength > sizeCap) {
          const marker = ' [truncated]'
          const slice = bytes.slice(0, Math.max(0, sizeCap - marker.length))
          output = new TextDecoder('utf-8', { fatal: false }).decode(slice) + marker
        }
        return { name, output }
      } catch (e) {
        if (e && e.message === '__extractor_timeout__') {
          console.warn(`Client extractor '${name}' exceeded ${timeoutMs}ms timeout; block omitted.`)
        } else {
          console.error(`Client extractor '${name}' threw; block omitted.`, e)
        }
        return null
      }
    }))

    return results.filter((b) => b !== null)
  }

  #clearExtractorChips() {
    this.#shadow.querySelectorAll('[part="extractor-chip"]').forEach((el) => el.remove())
  }

  #renderExtractorChip(blocks) {
    if (!blocks.length) return
    const messages = this.#messagesEl()
    if (!messages) return
    const labels = blocks.map((b) => this.#extractors.get(b.name)?.description ?? b.name)
    const chip = document.createElement('div')
    chip.className = 'extractor-chip'
    chip.setAttribute('part', 'extractor-chip')
    chip.textContent = `Read from page: ${labels.join(', ')}`
    messages.appendChild(chip)
  }

  #finishStreaming() {
    this.#streaming = false
    setTimeout(() => this.#hideToolStatus(), 500)
    const btn = this.#sendBtn()
    if (btn) btn.disabled = false
  }
}

customElements.define('chatbot-widget', ChatbotWidget)

export { ChatbotWidget }
