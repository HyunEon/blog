import { test, expect } from '@playwright/test'
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from 'jose'
import { verifyAccessToken } from '../server/utils/access-token'

test('Access JWT 서명·만료·발급자·audience 검증', async () => {
  const { publicKey, privateKey } = await generateKeyPair('RS256')
  const key = await exportJWK(publicKey)
  const keys = createLocalJWKSet({ keys: [{ ...key, kid: 'test', alg: 'RS256' }] })
  const issuer = 'https://test.cloudflareaccess.com'
  const sign = (audience: string, iss = issuer, expiration = '1h') => new SignJWT({ sub: 'user' }).setProtectedHeader({ alg: 'RS256', kid: 'test' }).setIssuer(iss).setAudience(audience).setExpirationTime(expiration).sign(privateKey)
  await expect(verifyAccessToken(await sign('blog'), keys, issuer, 'blog')).resolves.toBeDefined()
  await expect(verifyAccessToken(await sign('other'), keys, issuer, 'blog')).rejects.toThrow()
  await expect(verifyAccessToken(await sign('blog', 'https://other.cloudflareaccess.com'), keys, issuer, 'blog')).rejects.toThrow()
  await expect(verifyAccessToken(await sign('blog', issuer, '-1h'), keys, issuer, 'blog')).rejects.toThrow()
  const other = await generateKeyPair('RS256')
  const forged = await new SignJWT({ sub: 'user' }).setProtectedHeader({ alg: 'RS256', kid: 'test' }).setIssuer(issuer).setAudience('blog').setExpirationTime('1h').sign(other.privateKey)
  await expect(verifyAccessToken(forged, keys, issuer, 'blog')).rejects.toThrow()
})
