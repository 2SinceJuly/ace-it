import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { setSessionCookie } from '@/lib/auth/session'

export async function POST(request: Request) {
  let body: { username?: string; password?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
  }

  const username = (body.username ?? '').trim()
  const password = body.password ?? ''
  if (!username || !password) {
    return NextResponse.json({ error: '请输入账号和密码' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return NextResponse.json({ error: '账号或密码错误' }, { status: 401 })
  }

  await setSessionCookie(user.id)
  return NextResponse.json({ ok: true, name: user.name })
}
