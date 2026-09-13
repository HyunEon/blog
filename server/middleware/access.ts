import { createRemoteJWKSet } from 'jose'

const keySets = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

export default defineEventHandler(async (event) => {
  let path: string
  try { path = decodeURIComponent(getRequestURL(event).pathname).replace(/\/+/g, '/') }
  catch { throw createError({ statusCode: 400, statusMessage: 'Invalid path' }) }
  if (!/^\/(admin|api\/admin)(\/|$)/.test(path)) return
  setHeader(event, 'Cache-Control', 'private, no-store')
  setHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(event.method)
  if (isMutation) {
    const origin = getHeader(event, 'origin')
    if ((origin && origin !== getRequestURL(event).origin) || getHeader(event, 'sec-fetch-site') === 'cross-site') {
      throw createError({ statusCode: 403, statusMessage: 'Cross-origin request denied' })
    }
    if (event.method !== 'DELETE' && !getHeader(event, 'content-type')?.startsWith('application/json')) {
      throw createError({ statusCode: 415, statusMessage: 'JSON required' })
    }
  }
  // Explicit local development token; impossible to enable in a production build.
  if (import.meta.dev && process.env.BLOG_DEV_TOKEN) {
    const token = getHeader(event, 'x-blog-dev-token') || getCookie(event, 'blog-dev-token')
    if (token === process.env.BLOG_DEV_TOKEN) return
  }
  const env = event.context.cloudflare?.env
  const domain = String(env?.ACCESS_TEAM_DOMAIN || '')
  const audience = String(env?.ACCESS_AUD || '')
  const token = getHeader(event, 'cf-access-jwt-assertion') || getCookie(event, 'CF_Authorization')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain) || !audience) {
    throw createError({ statusCode: 503, statusMessage: 'Access configuration required' })
  }
  const issuer = `https://${domain}`
  let keys = keySets.get(issuer)
  if (!keys) {
    keys = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`))
    keySets.set(issuer, keys)
  }
  try {
    await verifyAccessToken(token, keys, issuer, audience)
  }
  catch { throw createError({ statusCode: 401, statusMessage: 'Invalid Access token' }) }
})
