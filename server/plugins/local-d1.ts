export default defineNitroPlugin(async (nitroApp) => {
  // Removed from the production bundle by Nitro's compile-time dev flag.
  if (import.meta.dev) {
    const { createRequire } = await import('node:module')
    const { getPlatformProxy } = createRequire(import.meta.url)('wrangler') as typeof import('wrangler')
    const proxy = await getPlatformProxy({ configPath: 'wrangler.jsonc', persist: { path: process.env.BLOG_D1_STATE || '.wrangler/state/v3' } })
    nitroApp.hooks.hook('request', (event) => {
      event.context.cloudflare = { env: proxy.env }
    })
    nitroApp.hooks.hook('close', () => proxy.dispose())
  }
})
