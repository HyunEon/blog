import { jwtVerify, type JWTVerifyGetKey } from 'jose'

export function verifyAccessToken(token: string, keys: JWTVerifyGetKey, issuer: string, audience: string) {
  return jwtVerify(token, keys, { issuer, audience, algorithms: ['RS256'], requiredClaims: ['exp', 'sub'] })
}
