import { test, expect } from '@playwright/test'

const headers = { 'x-blog-dev-token': 'local-e2e-token' }
const postInput = (slug: string) => ({ title: '테스트 글', slug, excerpt: '글 요약', content: '첫 번째 문단\n\n<script>alert("test")</script>', status: 'published' })

test('비인증 관리 페이지 및 GET·POST·PUT·DELETE 차단', async ({ request }) => {
  const id = crypto.randomUUID()
  for (const url of ['/admin', '/admin/posts', '/admin/posts/new', `/admin/posts/${id}/edit`, '/api/admin/posts', '/api/admin/categories']) {
    const response = await request.get(url)
    expect(response.status(), url).toBe(401)
    expect(response.headers()['cache-control']).toContain('no-store')
  }
  for (const resource of ['posts', 'categories']) {
    expect((await request.post(`/api/admin/${resource}`, { data: {} })).status()).toBe(401)
    expect((await request.put(`/api/admin/${resource}/${id}`, { data: {} })).status()).toBe(401)
    expect((await request.delete(`/api/admin/${resource}/${id}`)).status()).toBe(401)
  }
  expect((await request.get('/api/admin/posts', { headers: { 'x-blog-dev-token': 'wrong' } })).status()).toBe(401)
  expect((await request.get('/api/admin/posts', { headers: { 'cf-access-jwt-assertion': 'forged' } })).ok()).toBe(false)
})

test('D1 포스트와 카테고리 POST·PUT·DELETE, 입력 검증, 공개 조회', async ({ request }) => {
  const slug = `api-${crypto.randomUUID()}`
  const category = await request.post('/api/admin/categories', { headers, data: { name: 'API 카테고리', slug } })
  expect(category.status()).toBe(201)
  const { id: categoryId } = await category.json()
  let postId: string | undefined
  try {
    const create = await request.post('/api/admin/posts', { headers, data: { ...postInput(slug), category_id: categoryId, status: 'draft' } })
    expect(create.status()).toBe(201)
    postId = (await create.json()).id
    expect((await request.get(`/api/posts/${slug}`)).status()).toBe(404)
    expect((await request.post('/api/admin/posts', { headers, data: postInput(slug) })).status()).toBe(409)
    expect((await request.post('/api/admin/posts', { headers, data: { ...postInput('bad'), title: '' } })).status()).toBe(400)
    expect((await request.put(`/api/admin/posts/${postId}`, { headers, data: { ...postInput(slug), category_id: crypto.randomUUID() } })).status()).toBe(400)
    expect((await request.put(`/api/admin/posts/${postId}`, { headers, data: { ...postInput(slug), category_id: categoryId } })).status()).toBe(200)
    const publicPost = await request.get(`/api/posts/${slug}`)
    expect(publicPost.status()).toBe(200)
    expect((await publicPost.json()).category_name).toBe('API 카테고리')
    const list = await request.get(`/api/posts?category=${slug}`)
    const listData = await list.json()
    expect(listData.posts.map((post: { id: string }) => post.id)).toContain(postId)
    expect(listData.posts[0]).not.toHaveProperty('content')
    expect((await request.put(`/api/admin/categories/${categoryId}`, { headers, data: { name: '수정한 카테고리', slug } })).status()).toBe(200)
    expect((await request.delete(`/api/admin/categories/${categoryId}`, { headers })).status()).toBe(204)
    const adminPost = await request.get(`/api/admin/posts/${postId}`, { headers })
    expect((await adminPost.json()).category_id).toBeNull()
    expect((await request.delete(`/api/admin/posts/${postId}`, { headers })).status()).toBe(204)
    expect((await request.get(`/api/admin/posts/${postId}`, { headers })).status()).toBe(404)
    expect((await request.delete(`/api/admin/posts/${postId}`, { headers })).status()).toBe(404)
  }
  finally {
    if (postId) await request.delete(`/api/admin/posts/${postId}`, { headers })
    await request.delete(`/api/admin/categories/${categoryId}`, { headers })
  }
})

test('잘못된 입력과 교차 출처 요청 차단', async ({ request }) => {
  expect((await request.post('/api/admin/posts', { headers: { ...headers, origin: 'https://other.example' }, data: postInput('csrf') })).status()).toBe(403)
  expect((await request.post('/api/admin/posts', { headers, data: 'plain text' })).status()).toBe(415)
  expect((await request.post('/api/admin/posts', { headers: { ...headers, 'content-type': 'application/json' }, data: '{broken' })).status()).toBe(400)
  expect((await request.post('/api/admin/posts', { headers, data: { ...postInput('long'), content: 'a'.repeat(100001) } })).status()).toBe(400)
  expect((await request.get('/api/posts?page=-1')).status()).toBe(400)
  expect((await request.get('/api/posts?category=%27%20OR%201=1')).status()).toBe(400)
})

test('브라우저에서 글 생성·수정·삭제, 본문 이스케이프, 모바일', async ({ page, context, request }) => {
  const slug = `browser-${crypto.randomUUID()}`
  const originalTitle = `브라우저 작성 글 ${slug}`
  const editedTitle = `수정한 글 ${slug}`
  await context.addCookies([{ name: 'blog-dev-token', value: 'local-e2e-token', domain: '127.0.0.1', path: '/', httpOnly: true, sameSite: 'Lax' }])
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/admin/posts/new')
  await page.getByLabel('제목', { exact: true }).fill(originalTitle)
  await page.getByLabel('주소', { exact: true }).fill(slug)
  await page.getByRole('tab', { name: '미리보기', exact: true }).click()
  await page.getByRole('button', { name: '저장', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('본문을 입력해 주세요.')
  const markdown = '## Markdown 제목\n\n**굵게**\n\n- 첫 항목\n- 둘째 항목\n\n```ts\nconst value = 1\n```\n\n| 열 | 값 |\n| --- | --- |\n| A | B |\n\n[정상 링크](https://example.com)\n\n[위험 링크](javascript:alert(1))\n\n<script>alert("xss")</script>\n안녕하세요.'
  const editor = page.getByRole('textbox', { name: '본문', exact: true })
  await expect(editor).toHaveAttribute('contenteditable', 'true')
  await expect(page.locator('form #content')).toBeVisible()
  await editor.evaluate((element, source) => {
    const clipboardData = new DataTransfer()
    clipboardData.setData('text/plain', source)
    element.dispatchEvent(new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }))
  }, markdown)
  await expect(editor.getByRole('heading', { name: 'Markdown 제목' })).toBeVisible()
  await expect(editor.locator('script, a[href^="javascript:"]')).toHaveCount(0)
  await page.screenshot({ path: 'test-results/milkdown-editor.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/milkdown-mobile.png', fullPage: true })
  await page.setViewportSize({ width: 1280, height: 720 })
  await page.getByRole('tab', { name: '미리보기', exact: true }).click()
  const preview = page.getByRole('tabpanel')
  await expect(preview.getByRole('heading', { name: 'Markdown 제목' })).toBeVisible()
  await expect(preview.locator('strong')).toHaveText('굵게')
  await expect(preview.locator('pre code')).toHaveText('const value = 1\n')
  await expect(preview.getByRole('table')).toBeVisible()
  await expect(preview.locator('script, a[href^="javascript:"]')).toHaveCount(0)
  await page.screenshot({ path: 'test-results/markdown-preview.png', fullPage: true })
  await page.getByRole('button', { name: '저장', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/posts$/)
  const row = page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: originalTitle, exact: true }) })
  await expect(row).toContainText('초안')
  expect((await request.get(`/api/posts/${slug}`)).status()).toBe(404)
  await row.getByRole('link', { name: '수정', exact: true }).click()
  await expect(page.getByRole('textbox', { name: '본문', exact: true }).getByRole('heading', { name: 'Markdown 제목' })).toBeVisible()
  await page.getByLabel('제목', { exact: true }).fill(editedTitle)
  await page.getByLabel('공개 상태').click()
  await page.getByRole('option', { name: '공개', exact: true }).click()
  const editingBody = page.getByRole('textbox', { name: '본문', exact: true })
  await editingBody.press('Control+End')
  await page.keyboard.press('Enter')
  await page.keyboard.insertText('바로 저장한 마지막 문장')
  await page.getByRole('button', { name: '저장', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/posts$/)
  await page.goto(`/posts/${slug}`)
  await expect(page.getByRole('heading', { name: editedTitle })).toBeVisible()
  await expect(page.locator('article')).toContainText('<script>alert("xss")</script>')
  await expect(page.locator('article')).toContainText('바로 저장한 마지막 문장')
  await expect(page.locator('article script, article a[href^="javascript:"]')).toHaveCount(0)
  await expect(page.locator('article').getByRole('heading', { name: 'Markdown 제목' })).toBeVisible()
  await expect(page.locator('article strong')).toHaveText('굵게')
  await expect(page.locator('article pre code')).toHaveText('const value = 1\n')
  await expect(page.locator('article table')).toBeVisible()
  await page.screenshot({ path: 'test-results/post-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.screenshot({ path: 'test-results/post-mobile.png', fullPage: true })
  await page.goto('/admin/posts')
  const updated = page.getByRole('listitem').filter({ has: page.getByRole('heading', { name: editedTitle, exact: true }) })
  await updated.getByRole('button', { name: '삭제', exact: true }).click()
  await page.getByRole('button', { name: '취소', exact: true }).click()
  await expect(updated).toBeVisible()
  await updated.getByRole('button', { name: '삭제', exact: true }).click()
  await page.getByRole('button', { name: '삭제 확인', exact: true }).click()
  await expect(updated).toHaveCount(0)
  expect(errors).toEqual([])
})

test('카테고리 탐색·페이지네이션·공개 캐시 만료', async ({ request, page }) => {
  test.setTimeout(110000)
  const slug = `paging-${crypto.randomUUID()}`
  const category = await request.post('/api/admin/categories', { headers, data: { name: '페이지 검증', slug } })
  expect(category.status()).toBe(201)
  const { id: categoryId } = await category.json()
  const ids: string[] = []
  try {
    for (let index = 0; index < 21; index++) {
      const response = await request.post('/api/admin/posts', { headers, data: { ...postInput(`${slug}-${index}`), title: `페이지 글 ${index}`, category_id: categoryId } })
      expect(response.status()).toBe(201)
      ids.push((await response.json()).id)
    }
    const first = await (await request.get(`/api/posts?category=${slug}&page=1`)).json()
    const second = await (await request.get(`/api/posts?category=${slug}&page=2`)).json()
    expect(first.posts).toHaveLength(20)
    expect(first.hasMore).toBe(true)
    expect(second.posts).toHaveLength(1)
    expect(second.hasMore).toBe(false)
    expect(new Set([...first.posts, ...second.posts].map(post => post.id)).size).toBe(21)
    // A published response can remain visible for at most the documented cache TTL.
    expect((await request.get(`/api/posts/${slug}-0`)).status()).toBe(200)
    expect((await request.delete(`/api/admin/posts/${ids[0]}`, { headers })).status()).toBe(204)
    await expect.poll(async () => (await request.get(`/api/posts/${slug}-0`)).status(), { timeout: 75000, intervals: [1000, 5000] }).toBe(404)
    await page.goto(`/category/${slug}`)
    await expect(page.getByRole('heading', { name: '페이지 검증', exact: true })).toBeVisible()
    await expect(page.locator('main ol > li')).toHaveCount(20)
    await page.getByRole('link', { name: '전체', exact: true }).click()
    await expect(page.getByRole('heading', { name: '최근 글' })).toBeVisible()
  }
  finally {
    for (const id of ids) await request.delete(`/api/admin/posts/${id}`, { headers })
    await request.delete(`/api/admin/categories/${categoryId}`, { headers })
  }
})
