export class SSEClient extends EventTarget {
  #fetchImpl
  #aborted = false
  #reader = null

  constructor(fetchImpl = globalThis.fetch) {
    super()
    this.#fetchImpl = fetchImpl
  }

  abort() {
    this.#aborted = true
    this.#reader?.cancel()
  }

  async connect(url, options = {}) {
    this.#aborted = false
    const response = await this.#fetchImpl(url, options)
    const reader = response.body.getReader()
    this.#reader = reader
    const decoder = new TextDecoder()
    let buffer = ''

    while (!this.#aborted) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        if (this.#aborted) break
        this.#parseLine(line)
      }
    }

    reader.cancel()
  }

  #parseLine(line) {
    if (!line.startsWith('data: ')) return

    const raw = line.slice(6)
    let payload
    try {
      payload = JSON.parse(raw)
    } catch {
      return
    }

    switch (payload.type) {
      case 'token':
        this.dispatchEvent(new CustomEvent('chunk', { detail: { text: payload.text } }))
        break
      case 'done':
        this.dispatchEvent(new CustomEvent('done', { detail: { usage: payload.usage } }))
        break
      case 'error':
        this.dispatchEvent(new CustomEvent('error', {
          detail: { code: payload.code, message: payload.message, retryable: payload.retryable },
        }))
        break
      case 'context_summary':
        this.dispatchEvent(new CustomEvent('context_summary', { detail: { text: payload.text } }))
        break
      case 'tool_started':
      case 'tool_finished':
      case 'tool_failed':
        this.dispatchEvent(new CustomEvent(payload.type, { detail: { name: payload.name, phase: payload.phase } }))
        break
    }
  }
}
