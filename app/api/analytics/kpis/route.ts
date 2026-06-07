import { authResponseError } from '@/lib/auth/session'
import { getTenantFilter } from '@/lib/academic/access'
import {
  getManagementKpis,
  normalizeAnalyticsPeriod,
  periodRange,
  requireAnalyticsSchoolId,
} from '@/lib/analytics/management'

export async function GET(request: Request) {
  try {
    const { auth } = await getTenantFilter()
    const url = new URL(request.url)
    const schoolId = requireAnalyticsSchoolId(auth, url.searchParams.get('schoolId'))
    const period = normalizeAnalyticsPeriod(url.searchParams.get('period'))
    const { periodStart, periodEnd } = periodRange(period, url.searchParams.get('date'))
    const kpis = await getManagementKpis({ schoolId, period, periodStart, periodEnd })

    return Response.json({ kpis, meta: { period, periodStart, periodEnd, scoreVersion: 1 } })
  } catch (error) {
    return authResponseError(error)
  }
}
