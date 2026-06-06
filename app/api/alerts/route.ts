import { authResponseError } from '@/lib/auth/session'
import { getTenantFilter } from '@/lib/academic/access'
import { includeAlertRelations } from '@/lib/intelligence/api'
import { alertWhereFromUrl, runOperationalIntelligenceRules } from '@/lib/intelligence/rules'
import { paginationMeta, parsePagination } from '@/lib/people/api'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { auth } = await getTenantFilter()
    const url = new URL(request.url)
    const requestedSchoolId = url.searchParams.get('schoolId')
    const { page, pageSize, skip, take } = parsePagination(url)

    await runOperationalIntelligenceRules(auth, requestedSchoolId)

    const where = alertWhereFromUrl(url, auth)
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
