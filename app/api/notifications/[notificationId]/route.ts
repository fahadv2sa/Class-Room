import { assertSameSchool, getTenantFilter } from '@/lib/academic/access'
import { authResponseError } from '@/lib/auth/session'
import { normalizeNotificationStatus, notificationInclude } from '@/lib/communication/api'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ notificationId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { notificationId } = await params
    const notification = await prisma.notification.findUniqueOrThrow({
      where: { id: notificationId },
      include: notificationInclude,
    })
    assertSameSchool(auth, notification.schoolId)

    return Response.json({ notification })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ notificationId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { notificationId } = await params
    const body = await request.json().catch(() => null)
    const status = normalizeNotificationStatus(body?.status)
    if (!status) {
      return Response.json({ error: 'status must be PENDING, READY, SENT, FAILED, or CANCELLED' }, { status: 400 })
    }

    const existing = await prisma.notification.findUniqueOrThrow({ where: { id: notificationId } })
    assertSameSchool(auth, existing.schoolId)

    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: { status },
      include: notificationInclude,
    })

    return Response.json({ notification })
  } catch (error) {
    return authResponseError(error)
  }
}
