import { prisma } from '@/lib/prisma'
import { requireSuperAdmin, authResponseError } from '@/lib/auth/session'

export async function listPendingSchools() {
  try {
    await requireSuperAdmin()

    const schools = await prisma.school.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
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

export async function updateSchoolStatus(
  schoolId: string,
  action: 'approve' | 'reject' | 'suspend' | 'activate',
) {
  try {
    const auth = await requireSuperAdmin()
    const now = new Date()

    const data =
      action === 'approve'
        ? {
            status: 'ACTIVE' as const,
            approvedBy: auth.userId,
            approvedAt: now,
          }
        : action === 'reject'
          ? {
              status: 'REJECTED' as const,
              rejectedBy: auth.userId,
              rejectedAt: now,
            }
          : action === 'suspend'
            ? {
                status: 'SUSPENDED' as const,
                suspendedBy: auth.userId,
                suspendedAt: now,
              }
            : {
                status: 'ACTIVE' as const,
                approvedBy: auth.userId,
                approvedAt: now,
              }

    const school = await prisma.school.update({
      where: { id: schoolId },
      data,
    })

    if (action === 'reject' || action === 'suspend') {
      await prisma.session.updateMany({
        where: {
          schoolId,
          revokedAt: null,
        },
        data: {
          revokedAt: now,
        },
      })
    }

    return Response.json({ school })
  } catch (error) {
    return authResponseError(error)
  }
}
