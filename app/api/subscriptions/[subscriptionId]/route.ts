import { authResponseError, requireSuperAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ subscriptionId: string }> },
) {
  try {
    await requireSuperAdmin()
    const { subscriptionId } = await params
    const body = await request.json().catch(() => null)

    const subscription = await prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          plan: body?.plan,
          status: body?.status,
          startsAt: body?.startsAt ? new Date(body.startsAt) : undefined,
          expiresAt: body?.expiresAt ? new Date(body.expiresAt) : body?.expiresAt,
        },
      })

      await tx.school.update({
        where: { id: updated.schoolId },
        data: {
          subscriptionPlan: updated.plan,
          subscriptionStatus: updated.status,
        },
      })

      return updated
    })

    return Response.json({ subscription })
  } catch (error) {
    return authResponseError(error)
  }
}
