import { authResponseError } from '@/lib/auth/session'
import { getTenantFilter } from '@/lib/academic/access'
import { applyAlertVisibility, includeAlertRelations } from '@/lib/intelligence/api'
import { alertWhereFromUrl } from '@/lib/intelligence/rules'
import { paginationMeta, parsePagination } from '@/lib/people/api'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { auth } = await getTenantFilter()
    const url = new URL(request.url)
    const { page, pageSize, skip, take } = parsePagination(url)

    const includeDisabled = url.searchParams.get('includeDisabled') === 'true'
    const where = await applyAlertVisibility(alertWhereFromUrl(url, auth), auth, includeDisabled)
    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        include: includeAlertRelations,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      prisma.alert.count({ where }),
    ])

    return Response.json({ alerts, meta: paginationMeta(total, page, pageSize) })
  } catch (error) {
    return authResponseError(error)
  }
}
