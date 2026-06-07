import type { Prisma } from '@prisma/client'
import { getTenantFilter, scopedSchoolId } from '@/lib/academic/access'
import {
  aiPeriodRange,
  aiRecommendationInclude,
  normalizeAIRecommendationPriority,
  normalizeAIRecommendationStatus,
  normalizeAIRecommendationType,
  normalizeAISummaryPeriod,
  refreshAIRecommendations,
  requireAISchoolId,
} from '@/lib/ai/foundation'
import { authResponseError } from '@/lib/auth/session'
import { paginationMeta, parsePagination } from '@/lib/people/api'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { auth } = await getTenantFilter()
    const url = new URL(request.url)
    const schoolId = scopedSchoolId(auth, url.searchParams.get('schoolId'))
    const recommendationType = normalizeAIRecommendationType(url.searchParams.get('recommendationType'))
    const status = normalizeAIRecommendationStatus(url.searchParams.get('status'))
    const priority = normalizeAIRecommendationPriority(url.searchParams.get('priority'))
    const { page, pageSize, skip, take } = parsePagination(url)

    const where: Prisma.AIRecommendationWhereInput = {
      ...(schoolId ? { schoolId } : {}),
      ...(recommendationType ? { recommendationType } : {}),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
    }

    const [recommendations, total] = await Promise.all([
      prisma.aIRecommendation.findMany({
        where,
        include: aiRecommendationInclude,
        orderBy: [{ priority: 'desc' }, { generatedAt: 'desc' }],
        skip,
        take,
      }),
      prisma.aIRecommendation.count({ where }),
    ])

    return Response.json({ recommendations, meta: paginationMeta(total, page, pageSize) })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { auth } = await getTenantFilter()
    const body = await request.json().catch(() => null)
    const schoolId = requireAISchoolId(auth, body?.schoolId)
    const period = normalizeAISummaryPeriod(body?.period)
    const { periodStart, periodEnd } = aiPeriodRange(period, body?.date ?? null)

    await refreshAIRecommendations({ schoolId, period, periodStart, periodEnd })

    const recommendations = await prisma.aIRecommendation.findMany({
      where: { schoolId },
      include: aiRecommendationInclude,
      orderBy: [{ priority: 'desc' }, { generatedAt: 'desc' }],
      take: 50,
    })

    return Response.json({ recommendations })
  } catch (error) {
    return authResponseError(error)
  }
}
