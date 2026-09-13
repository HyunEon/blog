import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { setTimeout as delay } from 'node:timers/promises'
import assert from 'node:assert/strict'

const base = 'http://127.0.0.1:3101'
const worker = spawn('pnpm', ['exec', 'wrangler', 'dev', '--ip', '127.0.0.1', '--port', '3101', '--inspector-port', '0'], {
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: true,
  env: { ...process.env, BLOG_DEV_TOKEN: 'production-must-ignore-this' },
})
let output = ''
worker.stdout.on('data', data => { output += data })
worker.stderr.on('data', data => { output += data })
try {
  let ready = false
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(`${base}/api/categories`)
      if (response.ok) { ready = true; break }
    }
    catch { /* Wait for the local workerd process to start. */ }
    if (worker.exitCode !== null) throw new Error(output)
    await delay(500)
  }
  assert.ok(ready, `Worker did not become ready:\n${output}`)
  const home = await fetch(base)
  assert.equal(home.status, 200)
  const html = await home.text()
  assert.ok(html.includes('기록'))
  const asset = html.match(/(?:src|href)="(\/_nuxt\/[^" ]+\.js)"/)
  assert.ok(asset, 'SSR should include a JavaScript asset')
  assert.equal((await fetch(`${base}${asset[1]}`)).status, 200)
  for (const path of ['/admin', '/admin/posts', '/api/admin/posts', '/api/admin/categories']) {
    const response = await fetch(`${base}${path}`, { headers: { 'x-blog-dev-token': 'production-must-ignore-this', cookie: 'blog-dev-token=production-must-ignore-this' } })
    assert.equal(response.status, 401, path)
    assert.match(response.headers.get('cache-control') || '', /no-store/)
  }
  for (const resource of ['posts', 'categories']) {
    for (const method of ['POST', 'PUT', 'DELETE']) {
      const path = `/api/admin/${resource}${method === 'POST' ? '' : `/${crypto.randomUUID()}`}`
      const response = await fetch(`${base}${path}`, { method, headers: { 'content-type': 'application/json', 'x-blog-dev-token': 'production-must-ignore-this' }, body: method === 'DELETE' ? undefined : '{}' })
      assert.equal(response.status, 401, `${method} ${path}`)
    }
  }
  console.log('Worker smoke passed: SSR, assets, D1, protected routes, POST/PUT/DELETE, production dev-token rejection.')
}
finally {
  const exited = once(worker, 'exit')
  if (worker.exitCode === null) process.kill(-worker.pid, 'SIGTERM')
  await Promise.race([exited, delay(5000)])
}
