import { authResponseError } from '@/lib/auth/session'
import { assertSameSchool, getTenantFilter } from '@/lib/academic/access'
import { includeAlertRelations, normalizeAlertStatus } from '@/lib/intelligence/api'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ alertId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { alertId } = await params
    const alert = await prisma.alert.findUniqueOrThrow({
      where: { id: alertId },
      include: includeAlertRelations,
    })
    assertSameSchool(auth, alert.schoolId)

    return Response.json({ alert })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ alertId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { alertId } = await params
    const body = await request.json().catch(() => null)
    const status = normalizeAlertStatus(body?.status)
    if (!status) {
      return Response.json({ error: 'status must be OPEN, ACKNOWLEDGED, or RESOLVED' }, { status: 400 })
    }

    const existing = await prisma.alert.findUniqueOrThrow({ where: { id: alertId } })
    assertSameSchool(auth, existing.schoolId)

    const actorId = auth.userId
    const alert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status,
        acknowledgedBy: status === 'ACKNOWLEDGED' ? actorId : status === 'OPEN' ? null : undefined,
        acknowledgedAt: status === 'ACKNOWLEDGED' ? new Date() : status === 'OPEN' ? null : undefined,
        resolvedBy: status === 'RESOLVED' ? actorId : status === 'OPEN' ? null : undefined,
        resolvedAt: status === 'RESOLVED' ? new Date() : status === 'OPEN' ? null : undefined,
      },
      include: includeAlertRelations,
    })

    return Response.json({ alert })
  } catch (error) {
    return authResponseError(error)
  }
}
