import { authResponseError, requireAuth, requireSuperAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const auth = await requireAuth()

    const subscriptions = await prisma.subscription.findMany({
      where: auth.role === 'SUPER_ADMIN' ? {} : { schoolId: auth.schoolId! },
      orderBy: { createdAt: 'desc' },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
            status: true,
          },
        },
      },
    })

    return Response.json({ subscriptions })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function POST(request: Request) {
  try {
    await requireSuperAdmin()

    const body = await request.json().catch(() => null)
    const subscription = await prisma.$transaction(async (tx) => {
      const created = await tx.subscription.create({
        data: {
          schoolId: String(body?.schoolId ?? ''),
          plan: body?.plan ?? 'STARTER',
          status: body?.status ?? 'TRIALING',
          startsAt: body?.startsAt ? new Date(body.startsAt) : new Date(),
          expiresAt: body?.expiresAt ? new Date(body.expiresAt) : null,
        },
      })

      await tx.school.update({
        where: { id: created.schoolId },
        data: {
          subscriptionPlan: created.plan,
          subscriptionStatus: created.status,
        },
      })

      return created
    })

    return Response.json({ subscription }, { status: 201 })
  } catch (error) {
    return authResponseError(error)
  }
}
