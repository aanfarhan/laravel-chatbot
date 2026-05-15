import { marked } from 'marked'
import DOMPurify from 'dompurify'

export class MarkdownRenderer {
  #purify

  constructor() {
    this.#purify = DOMPurify

    this.#purify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A') {
        node.setAttribute('rel', 'noopener noreferrer')
        node.setAttribute('target', '_blank')
      }
    })
  }

  render(markdown) {
    const rawHtml = marked.parse(markdown, { async: false })

    return this.#purify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'code', 'pre', 'blockquote',
        'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'a', 'hr', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      ],
      ALLOWED_ATTR: ['href', 'rel', 'target'],
      ALLOW_DATA_ATTR: false,
    })
  }
}
