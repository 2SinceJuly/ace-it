import { cookies, headers } from 'next/headers'
import { COOKIE_NAME, SESSION_TTL_MS, createSessionToken, verifySessionToken } from './token'

export async function setSessionCookie(userId: string) {
  const token = await createSessionToken(userId)
  const cookieStore = await cookies()

  // 应用可能被嵌在跨站 iframe 中（如 v0 预览）。SameSite=Lax 的 cookie 在
  // 第三方上下文会被浏览器丢弃，导致"登录成功但会话未保存"。
  // https 访问时改用 SameSite=None + Secure；本地 http 保持 Lax。
  const headerStore = await headers()
  const isHttps = headerStore.get('x-forwarded-proto')?.split(',')[0]?.trim() === 'https'

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: isHttps ? 'none' : 'lax',
    secure: isHttps,
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

/** 读取当前会话的 userId；未登录返回 null */
export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySessionToken(token)
}
