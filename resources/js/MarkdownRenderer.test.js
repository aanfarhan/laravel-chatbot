// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { MarkdownRenderer } from './MarkdownRenderer.js'

const renderer = new MarkdownRenderer()

describe('MarkdownRenderer', () => {
  it('renders plain markdown to HTML', () => {
    const html = renderer.render('**bold**')
    expect(html).toContain('<strong>bold</strong>')
  })

  it('strips <script> tags', () => {
    const html = renderer.render('<script>alert(1)</script>')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('alert(1)')
  })

  it('strips inline event handlers', () => {
    const html = renderer.render('<p onclick="evil()">click me</p>')
    expect(html).not.toContain('onclick')
  })

  it('strips javascript: href URLs', () => {
    const html = renderer.render('[click](javascript:alert(1))')
    expect(html).not.toContain('javascript:')
  })

  it('blocks <img> tags by default', () => {
    const html = renderer.render('![alt](https://example.com/img.png)')
    expect(html).not.toContain('<img')
  })

  it('rewrites external links with noopener noreferrer and target blank', () => {
    const html = renderer.render('[visit](https://example.com)')
    expect(html).toContain('rel="noopener noreferrer"')
    expect(html).toContain('target="_blank"')
  })

  it('incremental render matches final render', () => {
    const full = '**bold** and _italic_ with `code`'
    const chunks = ['**bold**', ' and _italic_', ' with `code`']

    const finalHtml = renderer.render(full)
    const incrementalHtml = chunks.reduce((_, chunk, i) =>
      renderer.render(chunks.slice(0, i + 1).join('')), '')

    expect(incrementalHtml).toEqual(finalHtml)
  })
})
