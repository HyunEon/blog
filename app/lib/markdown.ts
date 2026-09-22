import MarkdownIt from 'markdown-it'

// Keep raw HTML disabled. markdown-it also rejects unsafe link protocols.
const markdown = new MarkdownIt({ html: false, breaks: true, linkify: false })

export function renderMarkdown(source: string): string {
  return markdown.render(source)
}
