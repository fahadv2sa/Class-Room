import type { Prisma } from '@prisma/client'
import { getTenantFilter } from '@/lib/academic/access'
import { authResponseError } from '@/lib/auth/session'
import {
  communicationSchoolId,
  ensureReportDefinitions,
  normalizeReportDefinitionType,
  normalizeSummaryPeriod,
  reportInclude,
} from '@/lib/communication/api'
import { paginationMeta, parsePagination } from '@/lib/people/api'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { auth } = await getTenantFilter()
    const url = new URL(request.url)
    const schoolId = communicationSchoolId(auth, url.searchParams.get('schoolId'))
    const reportType = normalizeReportDefinitionType(url.searchParams.get('type'))
    const period = normalizeSummaryPeriod(url.searchParams.get('period'))
    const activeParam = url.searchParams.get('isActive')
    const isActive = activeParam === 'true' ? true : activeParam === 'false' ? false : undefined
    const { page, pageSize, skip, take } = parsePagination(url)

    if (schoolId) await ensureReportDefinitions(schoolId)

    const where: Prisma.ReportDefinitionWhereInput = {
      ...(schoolId ? { schoolId } : {}),
      ...(reportType ? { reportType } : {}),
      ...(period ? { period } : {}),
      ...(isActive === undefined ? {} : { isActive }),
    }

    const [reports, total] = await Promise.all([
      prisma.reportDefinition.findMany({
        where,
        include: reportInclude,
        orderBy: { period: 'asc' },
        skip,
        take,
      }),
      prisma.reportDefinition.count({ where }),
    ])

    return Response.json({ reports, meta: paginationMeta(total, page, pageSize) })
  } catch (error) {
    return authResponseError(error)
  }
}
