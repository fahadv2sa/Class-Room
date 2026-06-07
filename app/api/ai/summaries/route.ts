import type { Prisma } from '@prisma/client'
import { getTenantFilter, scopedSchoolId } from '@/lib/academic/access'
import {
  aiPeriodRange,
  aiSummaryInclude,
  normalizeAISummaryPeriod,
  normalizeAISummaryType,
  refreshAISummaries,
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
    const summaryType = normalizeAISummaryType(url.searchParams.get('summaryType'))
    const period = url.searchParams.has('period') ? normalizeAISummaryPeriod(url.searchParams.get('period')) : undefined
    const { page, pageSize, skip, take } = parsePagination(url)

    const where: Prisma.AISummaryWhereInput = {
      ...(schoolId ? { schoolId } : {}),
      ...(summaryType ? { summaryType } : {}),
      ...(period ? { period } : {}),
    }

    const [summaries, total] = await Promise.all([
      prisma.aISummary.findMany({
        where,
        include: aiSummaryInclude,
        orderBy: { generatedAt: 'desc' },
        skip,
        take,
      }),
      prisma.aISummary.count({ where }),
    ])

    return Response.json({ summaries, meta: paginationMeta(total, page, pageSize) })
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

    await refreshAISummaries({ schoolId, period, periodStart, periodEnd })

    const summaries = await prisma.aISummary.findMany({
      where: { schoolId },
      include: aiSummaryInclude,
      orderBy: { generatedAt: 'desc' },
      take: 20,
    })

    return Response.json({ summaries })
  } catch (error) {
    return authResponseError(error)
  }
}
