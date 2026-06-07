import { assertSameSchool, getTenantFilter } from '@/lib/academic/access'
import {
  aiRecommendationInclude,
  normalizeAIRecommendationStatus,
} from '@/lib/ai/foundation'
import { authResponseError } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ recommendationId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { recommendationId } = await params
    const recommendation = await prisma.aIRecommendation.findUniqueOrThrow({
      where: { id: recommendationId },
      include: aiRecommendationInclude,
    })
    assertSameSchool(auth, recommendation.schoolId)
    return Response.json({ recommendation })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ recommendationId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { recommendationId } = await params
    const body = await request.json().catch(() => null)
    const status = normalizeAIRecommendationStatus(body?.status)
    if (!status) throw new Response('status must be ACTIVE, DISMISSED, or RESOLVED', { status: 400 })

    const existing = await prisma.aIRecommendation.findUniqueOrThrow({ where: { id: recommendationId } })
    assertSameSchool(auth, existing.schoolId)

    const recommendation = await prisma.aIRecommendation.update({
      where: { id: recommendationId },
      data: { status },
      include: aiRecommendationInclude,
    })

    return Response.json({ recommendation })
  } catch (error) {
    return authResponseError(error)
  }
}
