import { authResponseError } from '@/lib/auth/session'
import { assertSameSchool, getTenantFilter } from '@/lib/academic/access'
import { syncInsightNotifications } from '@/lib/communication/api'
import { includeInsightRelations, normalizeInsightStatus } from '@/lib/intelligence/api'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ insightId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { insightId } = await params
    const insight = await prisma.insight.findUniqueOrThrow({
      where: { id: insightId },
      include: includeInsightRelations,
    })
    assertSameSchool(auth, insight.schoolId)

    return Response.json({ insight })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ insightId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { insightId } = await params
    const body = await request.json().catch(() => null)
    const status = normalizeInsightStatus(body?.status)
    if (!status) {
      return Response.json({ error: 'status must be ACTIVE, DISMISSED, or RESOLVED' }, { status: 400 })
    }

    const existing = await prisma.insight.findUniqueOrThrow({ where: { id: insightId } })
    assertSameSchool(auth, existing.schoolId)

    const insight = await prisma.insight.update({
      where: { id: insightId },
      data: { status },
      include: includeInsightRelations,
    })
    await syncInsightNotifications({
      schoolId: insight.schoolId,
      insightId: insight.id,
      title: insight.title,
      message: insight.description,
    })

    return Response.json({ insight })
  } catch (error) {
    return authResponseError(error)
  }
}
