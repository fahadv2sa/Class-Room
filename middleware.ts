import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/lib/auth/constants'

const protectedRoutes = [
  '/select-level',
  '/dashboard',
  '/classrooms',
  '/attendance',
  '/movement',
  '/noise',
  '/teachers',
  '/students',
  '/reports',
  '/alerts',
  '/ai',
  '/communication',
  '/devices',
  '/settings',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value)
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (pathname === '/' && hasSession) {
    return NextResponse.redirect(new URL('/select-level', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/select-level/:path*',
    '/dashboard/:path*',
    '/classrooms/:path*',
    '/attendance/:path*',
    '/movement/:path*',
    '/noise/:path*',
    '/teachers/:path*',
    '/students/:path*',
    '/reports/:path*',
    '/alerts/:path*',
    '/ai/:path*',
    '/communication/:path*',
    '/devices/:path*',
    '/settings/:path*',
  ],
}
