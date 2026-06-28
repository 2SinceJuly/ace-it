import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const isDevAuthBypassEnabled =
    process.env.NODE_ENV !== 'production' &&
    (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true' ||
      process.env.NEXT_PUBLIC_DISABLE_AUTH === '1')

  if (isDevAuthBypassEnabled) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request as unknown as Parameters<typeof getToken>[0]['req'],
    secret: process.env.AUTH_SECRET,
  })

  const isLoggedIn = !!token
  const { pathname } = request.nextUrl

  if (pathname === '/' && isLoggedIn) {
    return NextResponse.redirect(new URL('/interviews', request.url))
  }

  if ((pathname.startsWith('/chat') || pathname.startsWith('/interviews')) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/chat/:path*', '/interviews/:path*'],
}
