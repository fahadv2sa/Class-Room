import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session'

function authDebug(event: string, details: Record<string, unknown>) {
  console.info('[auth:login]', event, details)
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = String(body?.email ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '')

  if (!email || !password) {
    return Response.json({ error: 'Email and password are required' }, { status: 400 })
  }

  authDebug('attempt', { email })

  const superAdmin =
    (await prisma.superAdmin.findUnique({ where: { email } })) ??
    (await prisma.superAdmin.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
    }))
  const superAdminPasswordMatch = Boolean(
    superAdmin?.isActive && verifyPassword(password, superAdmin.passwordHash),
  )

  authDebug('super_admin_lookup', {
    found: Boolean(superAdmin),
    isActive: superAdmin?.isActive ?? null,
    passwordMatch: superAdminPasswordMatch,
  })

  if (superAdminPasswordMatch && superAdmin) {
    authDebug('role_detected', { role: 'SUPER_ADMIN', email: superAdmin.email })
    try {
      await createSession({
        role: 'SUPER_ADMIN',
        superAdminId: superAdmin.id,
      })
    } catch (error) {
      authDebug('session_not_created', {
        role: 'SUPER_ADMIN',
        userId: superAdmin.id,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
    authDebug('session_created', { role: 'SUPER_ADMIN', userId: superAdmin.id })

    return Response.json({
      role: 'SUPER_ADMIN',
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        fullName: superAdmin.fullName,
      },
    })
  }

  const schoolAdmin =
    (await prisma.schoolAdmin.findUnique({
      where: { email },
      include: { school: true },
    })) ??
    (await prisma.schoolAdmin.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: { school: true },
    }))

  const schoolAdminPasswordMatch = Boolean(
    schoolAdmin?.isActive && verifyPassword(password, schoolAdmin.passwordHash),
  )

  authDebug('school_admin_lookup', {
    found: Boolean(schoolAdmin),
    isActive: schoolAdmin?.isActive ?? null,
    schoolStatus: schoolAdmin?.school.status ?? null,
    passwordMatch: schoolAdminPasswordMatch,
  })

  if (schoolAdminPasswordMatch && schoolAdmin) {
    if (schoolAdmin.school.status !== 'ACTIVE') {
      const message = {
        PENDING: 'School registration is pending SuperAdmin approval.',
        SUSPENDED: 'School access is suspended. Contact platform support.',
        REJECTED: 'School registration was rejected.',
        ACTIVE: '',
      }[schoolAdmin.school.status]

      return Response.json({ error: message }, { status: 403 })
    }

    authDebug('role_detected', { role: 'SCHOOL_ADMIN', email: schoolAdmin.email })
    try {
      await createSession({
        role: 'SCHOOL_ADMIN',
        schoolAdminId: schoolAdmin.id,
        schoolId: schoolAdmin.schoolId,
      })
    } catch (error) {
      authDebug('session_not_created', {
        role: 'SCHOOL_ADMIN',
        userId: schoolAdmin.id,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
    authDebug('session_created', { role: 'SCHOOL_ADMIN', userId: schoolAdmin.id })

    return Response.json({
      role: 'SCHOOL_ADMIN',
      user: {
        id: schoolAdmin.id,
        email: schoolAdmin.email,
        fullName: schoolAdmin.fullName,
      },
      school: {
        id: schoolAdmin.school.id,
        name: schoolAdmin.school.name,
      },
    })
  }

  authDebug('login_failed', {
    superAdminFound: Boolean(superAdmin),
    superAdminPasswordMatch,
    schoolAdminFound: Boolean(schoolAdmin),
    schoolAdminPasswordMatch,
  })

  return Response.json({ error: 'Invalid credentials' }, { status: 401 })
}
