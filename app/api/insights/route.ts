import { authResponseError } from '@/lib/auth/session'
import { getTenantFilter } from '@/lib/academic/access'
import { includeInsightRelations } from '@/lib/intelligence/api'
import { insightWhereFromUrl, runOperationalIntelligenceRules } from '@/lib/intelligence/rules'
import { paginationMeta, parsePagination } from '@/lib/people/api'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { auth } = await getTenantFilter()
    const url = new URL(request.url)
    const requestedSchoolId = url.searchParams.get('schoolId')
    const { page, pageSize, skip, take } = parsePagination(url)

    await runOperationalIntelligenceRules(auth, requestedSchoolId)

    const where = insightWhereFromUrl(url, auth)
    const [insights, total] = await Promise.all([
      prisma.insight.findMany({
        where,
        include: includeInsightRelations,
        orderBy: [{ status: 'asc' }, { lastDetectedAt: 'desc' }],
        skip,
        take,
      }),
      prisma.insight.count({ where }),
    ])

    return Response.json({ insights, meta: paginationMeta(total, page, pageSize) })
  } catch (error) {
    return authResponseError(error)
  }
}
