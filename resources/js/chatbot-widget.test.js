// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import './chatbot-widget.js'

function makeWidget() {
  const el = document.createElement('chatbot-widget')
  el.setAttribute('position', 'inline')
  document.body.appendChild(el)
  return el
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
