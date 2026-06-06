import { authResponseError, requireSchoolAccess, requireSuperAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  try {
    const { schoolId } = await params
    await requireSchoolAccess(schoolId)

    const school = await prisma.school.findUniqueOrThrow({
      where: { id: schoolId },
      include: {
        admins: {
          select: {
            id: true,
            email: true,
            fullName: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    return Response.json({ school })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  try {
    await requireSuperAdmin()
    const { schoolId } = await params
    const body = await request.json().catch(() => null)

    const school = await prisma.school.update({
      where: { id: schoolId },
      data: {
        name: body?.name,
        logoUrl: body?.logoUrl,
        city: body?.city,
        country: body?.country,
        subscriptionPlan: body?.subscriptionPlan,
        subscriptionStatus: body?.subscriptionStatus,
      },
    })

    return Response.json({ school })
  } catch (error) {
    return authResponseError(error)
  }
}
