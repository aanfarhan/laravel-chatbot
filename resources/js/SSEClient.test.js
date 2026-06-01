import { describe, it, expect, vi } from 'vitest'
import { SSEClient } from './SSEClient.js'

function makeStream(...lines) {
  const text = lines.join('\n') + '\n'
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text))
      controller.close()
    },
  })
}

function makeFetch(stream, status = 200) {
  return async () => ({ ok: status < 400, status, body: stream })
}

function makeChunkedStream(...chunks) {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk))
      controller.close()
    },
  })
}

// ── tracer bullet ──────────────────────────────────────────────────────────
describe('SSEClient', () => {
  it('emits a chunk event for a token line', async () => {
    const stream = makeStream(
      'data: {"type":"token","text":"hello"}',
      '',
    )
    const client = new SSEClient(makeFetch(stream))
    const chunks = []
    client.addEventListener('chunk', (e) => chunks.push(e.detail))

    await client.connect('/chatbot/messages', { method: 'POST', body: '{}' })

    expect(chunks).toEqual([{ text: 'hello' }])
  })

  it('emits a done event', async () => {
    const stream = makeStream(
      'data: {"type":"done","usage":{"input":10,"output":5}}',
      '',
    )
    const client = new SSEClient(makeFetch(stream))
    const dones = []
    client.addEventListener('done', (e) => dones.push(e.detail))

    await client.connect('/chatbot/messages', { method: 'POST', body: '{}' })

    expect(dones).toEqual([{ usage: { input: 10, output: 5 } }])
  })

  it('does not surface a message id on the done event', async () => {
    const stream = makeStream(
      'data: {"type":"done","conversation_id":7,"message_id":42,"usage":{"input":1,"output":2}}',
      '',
    )
    const client = new SSEClient(makeFetch(stream))
    const dones = []
    client.addEventListener('done', (e) => dones.push(e.detail))

    await client.connect('/chatbot/messages', { method: 'POST', body: '{}' })

    expect(dones[0]).not.toHaveProperty('messageId')
    expect(dones[0].conversationId).toBe(7)
  })

  it('emits an error event', async () => {
    const stream = makeStream(
      'data: {"type":"error","code":"provider_error","message":"upstream failed","retryable":true}',
      '',
    )
    const client = new SSEClient(makeFetch(stream))
    const errors = []
    client.addEventListener('error', (e) => errors.push(e.detail))

    await client.connect('/chatbot/messages', { method: 'POST', body: '{}' })

    expect(errors).toEqual([{ code: 'provider_error', message: 'upstream failed', retryable: true }])
  })

  it('emits a context_summary event', async () => {
    const stream = makeStream(
      'data: {"type":"context_summary","text":"Answering about order #42"}',
      '',
    )
    const client = new SSEClient(makeFetch(stream))
    const summaries = []
    client.addEventListener('context_summary', (e) => summaries.push(e.detail))

    await client.connect('/chatbot/messages', { method: 'POST', body: '{}' })

    expect(summaries).toEqual([{ text: 'Answering about order #42' }])
  })

  it('recovers from malformed JSON without throwing', async () => {
    const stream = makeStream(
      'data: not-valid-json',
      '',
      'data: {"type":"token","text":"after bad"}',
      '',
    )
    const client = new SSEClient(makeFetch(stream))
    const chunks = []
    client.addEventListener('chunk', (e) => chunks.push(e.detail))

    await expect(client.connect('/chatbot/messages', { method: 'POST', body: '{}' })).resolves.not.toThrow()
    expect(chunks).toEqual([{ text: 'after bad' }])
  })

  it('emits a tool_started event', async () => {
    const stream = makeStream(
      'data: {"type":"tool_started","name":"lookup_order","phase":"started"}',
      '',
    )
    const client = new SSEClient(makeFetch(stream))
    const events = []
    client.addEventListener('tool_started', (e) => events.push(e.detail))

    await client.connect('/chatbot/messages', { method: 'POST', body: '{}' })

    expect(events).toEqual([{ name: 'lookup_order', phase: 'started' }])
  })

  it('emits a tool_finished event', async () => {
    const stream = makeStream(
      'data: {"type":"tool_finished","name":"lookup_order","phase":"finished"}',
      '',
    )
    const client = new SSEClient(makeFetch(stream))
    const events = []
    client.addEventListener('tool_finished', (e) => events.push(e.detail))

    await client.connect('/chatbot/messages', { method: 'POST', body: '{}' })

    expect(events).toEqual([{ name: 'lookup_order', phase: 'finished' }])
  })

  it('emits a tool_failed event', async () => {
    const stream = makeStream(
      'data: {"type":"tool_failed","name":"lookup_order","phase":"failed"}',
      '',
    )
    const client = new SSEClient(makeFetch(stream))
    const events = []
    client.addEventListener('tool_failed', (e) => events.push(e.detail))

    await client.connect('/chatbot/messages', { method: 'POST', body: '{}' })

    expect(events).toEqual([{ name: 'lookup_order', phase: 'failed' }])
  })

  it('abort stops processing mid-stream', async () => {
    // Both lines arrive in one read; abort() inside the chunk listener
    // stops the second line from being processed.
    const stream = makeStream(
      'data: {"type":"token","text":"hi"}',
      '',
      'data: {"type":"token","text":"never"}',
      '',
    )
    const client = new SSEClient(makeFetch(stream))
    const chunks = []
    client.addEventListener('chunk', (e) => {
      chunks.push(e.detail)
      client.abort()
    })

    await client.connect('/chatbot/messages', { method: 'POST', body: '{}' })

    expect(chunks).toHaveLength(1)
    expect(chunks[0]).toEqual({ text: 'hi' })
  })

  it('handles chunk split exactly on newline boundary (L31 empty-buffer fallback)', async () => {
    // First chunk ends on '\n' so lines.pop() returns '' (empty trailing element).
    // Second chunk carries the blank separator and second event.
    const stream = makeChunkedStream(
      'data: {"type":"token","text":"first"}\n',
      '\ndata: {"type":"token","text":"second"}\n\n',
    )
    const client = new SSEClient(makeFetch(stream))
    const chunks = []
    client.addEventListener('chunk', (e) => chunks.push(e.detail))

    await client.connect('/chatbot/messages', { method: 'POST', body: '{}' })

    expect(chunks).toEqual([{ text: 'first' }, { text: 'second' }])
  })

  it('ignores non-data/non-event lines (L52 early-return branch)', async () => {
    const stream = makeStream(
      ': keep-alive',
      'data: {"type":"token","text":"after comment"}',
      '',
    )
    const client = new SSEClient(makeFetch(stream))
    const chunks = []
    client.addEventListener('chunk', (e) => chunks.push(e.detail))

    await client.connect('/chatbot/messages', { method: 'POST', body: '{}' })

    expect(chunks).toEqual([{ text: 'after comment' }])
  })
})
