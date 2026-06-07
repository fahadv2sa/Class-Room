import { authResponseError } from '@/lib/auth/session'
import { getTenantFilter } from '@/lib/academic/access'
import {
  getManagementComparisons,
  normalizeAnalyticsPeriod,
  normalizeManagementKpi,
  normalizeManagementSubject,
  periodRange,
  requireAnalyticsSchoolId,
} from '@/lib/analytics/management'

export async function GET(request: Request) {
  try {
    const { auth } = await getTenantFilter()
    const url = new URL(request.url)
    const schoolId = requireAnalyticsSchoolId(auth, url.searchParams.get('schoolId'))
    const period = normalizeAnalyticsPeriod(url.searchParams.get('period'))
    const subjectType = normalizeManagementSubject(url.searchParams.get('subjectType'))
    const kpiType = normalizeManagementKpi(url.searchParams.get('kpiType'))
    const subjectIds = url.searchParams.getAll('subjectId').flatMap((value) => value.split(',')).map((value) => value.trim()).filter(Boolean)
    const { periodStart, periodEnd } = periodRange(period, url.searchParams.get('date'))

    if (!subjectIds.length) {
      return Response.json({ comparisons: [], meta: { period, periodStart, periodEnd, subjectType, kpiType, scoreVersion: 1 } })
    }

    const comparisons = await getManagementComparisons({ schoolId, period, periodStart, periodEnd, subjectType, subjectIds, kpiType })

    return Response.json({ comparisons, meta: { period, periodStart, periodEnd, subjectType, kpiType, scoreVersion: 1 } })
  } catch (error) {
    return authResponseError(error)
  }
}
