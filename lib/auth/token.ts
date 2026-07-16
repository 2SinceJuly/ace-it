export const COOKIE_NAME = 'ai_interview_session'
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7 // 7 天

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not set')
  return secret
}

async function hmacSign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return Buffer.from(sig).toString('base64url')
}

export async function createSessionToken(userId: string): Promise<string> {
  const expiresAt = Date.now() + SESSION_TTL_MS
  const payload = `${userId}.${expiresAt}`
  const sig = await hmacSign(payload)
  return `${payload}.${sig}`
}

export async function verifySessionToken(token: string): Promise<string | null> {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [userId, expiresAt, sig] = parts
  const expected = await hmacSign(`${userId}.${expiresAt}`)
  if (sig !== expected) return null
  if (Number(expiresAt) < Date.now()) return null
  return userId
}
