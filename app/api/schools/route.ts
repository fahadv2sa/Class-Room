import { hashPassword } from '@/lib/auth/password'
import { authResponseError, requireAuth, requireSuperAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

function normalizeSchoolCode(value: unknown) {
  return String(value ?? '').trim().toUpperCase()
}

export async function GET() {
  try {
    const auth = await requireAuth()

    const where =
      auth.role === 'SUPER_ADMIN'
        ? {}
        : {
            id: auth.schoolId!,
          }

    const schools = await prisma.school.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        admins: {
          select: {
            id: true,
            email: true,
            fullName: true,
            isActive: true,
            createdAt: true,
          },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    return Response.json({ schools })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin()

    const body = await request.json().catch(() => null)
    const name = String(body?.name ?? '').trim()
    const schoolCode = normalizeSchoolCode(body?.schoolCode ?? body?.school_code)
    const city = String(body?.city ?? '').trim()
    const country = String(body?.country ?? '').trim()
    const adminEmail = String(body?.adminEmail ?? '').trim().toLowerCase()
    const adminFullName = String(body?.adminFullName ?? '').trim()
    const adminPassword = String(body?.adminPassword ?? '')
    const subscriptionPlan = body?.subscriptionPlan ?? 'STARTER'
    const subscriptionStatus = body?.subscriptionStatus ?? 'TRIALING'

    if (!name || !schoolCode || !city || !country || !adminEmail || !adminFullName || !adminPassword) {
      return Response.json({ error: 'Missing required school or admin fields' }, { status: 400 })
    }

    if (!/^[A-Z]{3}[0-9]{3}$/.test(schoolCode)) {
      return Response.json({ error: 'schoolCode must match the format JUB001' }, { status: 400 })
    }

    const school = await prisma.$transaction(async (tx) => {
      const createdSchool = await tx.school.create({
        data: {
          schoolCode,
          name,
          logoUrl: body?.logoUrl ?? null,
          city,
          country,
          subscriptionPlan,
          subscriptionStatus,
          status: 'PENDING',
        },
      })

      await tx.schoolAdmin.create({
        data: {
          schoolId: createdSchool.id,
          email: adminEmail,
          fullName: adminFullName,
          passwordHash: hashPassword(adminPassword),
        },
      })

      await tx.subscription.create({
        data: {
          schoolId: createdSchool.id,
          plan: subscriptionPlan,
          status: subscriptionStatus,
          startsAt: body?.startsAt ? new Date(body.startsAt) : new Date(),
          expiresAt: body?.expiresAt ? new Date(body.expiresAt) : null,
        },
      })

      return createdSchool
    })

    return Response.json({ school }, { status: 201 })
  } catch (error) {
    return authResponseError(error)
  }
}
