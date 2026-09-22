import { test, expect } from '@playwright/test'
import { renderMarkdown } from '../app/lib/markdown'

test('Markdown 출력은 HTML과 위험 URL을 실행하지 않는다', () => {
  const html = renderMarkdown('<script>alert(1)</script>\n<img src=x onerror=alert(1)>\n\n[bad](javascript:alert(1))\n\n[encoded](jav&#x61;script:alert(1))\n\n[good](https://example.com)\n\n```html\n<script>alert(1)</script>\n```')
  expect(html).not.toContain('<script>')
  expect(html).not.toContain('<img')
  expect(html).not.toMatch(/href="javascript:/i)
  expect(html).toContain('href="https://example.com"')
  expect(html).toContain('&lt;script&gt;')
  expect(renderMarkdown('첫 줄\n다음 줄')).toContain('<br>')
})
