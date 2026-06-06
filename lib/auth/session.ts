import { cookies } from 'next/headers'
import { createHmac, randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { SESSION_COOKIE } from '@/lib/auth/constants'

export type AuthRole = 'SUPER_ADMIN' | 'SCHOOL_ADMIN'

export type AuthContext = {
  sessionId: string
  role: AuthRole
  userId: string
  email: string
  fullName: string
  schoolId: string | null
}

function sessionDays() {
  const value = Number(process.env.SESSION_DAYS ?? 7)
  return Number.isSafeInteger(value) && value > 0 ? value : 7
}

function tokenHash(token: string) {
  const secret = process.env.AUTH_SECRET
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET is required in production')
  }

  return createHmac('sha256', secret ?? 'classpulse-development-secret')
    .update(token)
    .digest('hex')
}

export async function createSession(input: {
  role: AuthRole
  superAdminId?: string
  schoolAdminId?: string
  schoolId?: string
}) {
  const token = randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + sessionDays() * 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: {
      tokenHash: tokenHash(token),
      role: input.role,
      superAdminId: input.superAdminId,
      schoolAdminId: input.schoolAdminId,
      schoolId: input.schoolId,
      expiresAt,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  })
}

export async function clearSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (token) {
    await prisma.session.updateMany({
      where: { tokenHash: tokenHash(token), revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  cookieStore.delete(SESSION_COOKIE)
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await prisma.session.findFirst({
    where: {
      tokenHash: tokenHash(token),
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      superAdmin: true,
      schoolAdmin: {
        include: { school: true },
      },
    },
  })

  if (!session) return null

  if (session.role === 'SUPER_ADMIN' && session.superAdmin?.isActive) {
    return {
      sessionId: session.id,
      role: 'SUPER_ADMIN',
      userId: session.superAdmin.id,
      email: session.superAdmin.email,
      fullName: session.superAdmin.fullName,
      schoolId: null,
    }
  }

  const admin = session.schoolAdmin
  if (
    session.role === 'SCHOOL_ADMIN' &&
    admin?.isActive &&
    admin.school?.status === 'ACTIVE' &&
    session.schoolId === admin.schoolId
  ) {
    return {
      sessionId: session.id,
      role: 'SCHOOL_ADMIN',
      userId: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      schoolId: admin.schoolId,
    }
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  })

  return null
}

export async function requireAuth() {
  const auth = await getAuthContext()
  if (!auth) throw new Response('Unauthorized', { status: 401 })
  return auth
}

export async function requireSuperAdmin() {
  const auth = await requireAuth()
  if (auth.role !== 'SUPER_ADMIN') throw new Response('Forbidden', { status: 403 })
  return auth
}

export async function requireSchoolAccess(schoolId: string) {
  const auth = await requireAuth()
  if (auth.role === 'SUPER_ADMIN') return auth
  if (auth.schoolId !== schoolId) throw new Response('Forbidden', { status: 403 })
  return auth
}

export function authResponseError(error: unknown) {
  if (error instanceof Response) return error
  console.error(error)
  return Response.json({ error: 'Internal server error' }, { status: 500 })
}
