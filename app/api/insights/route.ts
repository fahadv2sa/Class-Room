import { authResponseError } from '@/lib/auth/session'
import { getTenantFilter } from '@/lib/academic/access'
import { applyInsightVisibility, includeInsightRelations } from '@/lib/intelligence/api'
import { insightWhereFromUrl } from '@/lib/intelligence/rules'
import { paginationMeta, parsePagination } from '@/lib/people/api'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { auth } = await getTenantFilter()
    const url = new URL(request.url)
    const { page, pageSize, skip, take } = parsePagination(url)

    const includeDisabled = url.searchParams.get('includeDisabled') === 'true'
    const where = await applyInsightVisibility(insightWhereFromUrl(url, auth), auth, includeDisabled)
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
