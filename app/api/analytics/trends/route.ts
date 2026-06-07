import { authResponseError } from '@/lib/auth/session'
import { getTenantFilter } from '@/lib/academic/access'
import {
  getManagementTrends,
  normalizeAnalyticsPeriod,
  normalizeManagementKpi,
  periodRange,
  requireAnalyticsSchoolId,
} from '@/lib/analytics/management'

export async function GET(request: Request) {
  try {
    const { auth } = await getTenantFilter()
    const url = new URL(request.url)
    const schoolId = requireAnalyticsSchoolId(auth, url.searchParams.get('schoolId'))
    const period = normalizeAnalyticsPeriod(url.searchParams.get('period'))
    const kpiType = normalizeManagementKpi(url.searchParams.get('kpiType'))
    const { periodStart, periodEnd } = periodRange(period, url.searchParams.get('date'))
    const trends = await getManagementTrends({ schoolId, period, periodStart, periodEnd, kpiType })

    return Response.json({ trends, meta: { period, periodStart, periodEnd, kpiType, scoreVersion: 1 } })
  } catch (error) {
    return authResponseError(error)
  }
}
