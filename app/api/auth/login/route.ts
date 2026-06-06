import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/auth/password'
import { createSession } from '@/lib/auth/session'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = String(body?.email ?? '').trim().toLowerCase()
  const password = String(body?.password ?? '')

  if (!email || !password) {
    return Response.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const superAdmin = await prisma.superAdmin.findUnique({ where: { email } })
  if (
    superAdmin?.isActive &&
    verifyPassword(password, superAdmin.passwordHash)
  ) {
    await createSession({
      role: 'SUPER_ADMIN',
      superAdminId: superAdmin.id,
    })

    return Response.json({
      role: 'SUPER_ADMIN',
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        fullName: superAdmin.fullName,
      },
    })
  }

  const schoolAdmin = await prisma.schoolAdmin.findUnique({
    where: { email },
    include: { school: true },
  })

  if (
    schoolAdmin?.isActive &&
    verifyPassword(password, schoolAdmin.passwordHash)
  ) {
    if (schoolAdmin.school.status !== 'ACTIVE') {
      const message = {
        PENDING: 'School registration is pending SuperAdmin approval.',
        SUSPENDED: 'School access is suspended. Contact platform support.',
        REJECTED: 'School registration was rejected.',
        ACTIVE: '',
      }[schoolAdmin.school.status]

      return Response.json({ error: message }, { status: 403 })
    }

    await createSession({
      role: 'SCHOOL_ADMIN',
      schoolAdminId: schoolAdmin.id,
      schoolId: schoolAdmin.schoolId,
    })

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

  return Response.json({ error: 'Invalid credentials' }, { status: 401 })
}
