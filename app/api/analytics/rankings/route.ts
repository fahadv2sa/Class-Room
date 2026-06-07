import { authResponseError } from '@/lib/auth/session'
import { getTenantFilter } from '@/lib/academic/access'
import {
  getManagementRankings,
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
    const take = Math.min(20, Math.max(1, Number(url.searchParams.get('take') ?? 5) || 5))
    const rankings = await getManagementRankings({ schoolId, period, periodStart, periodEnd, take })

    return Response.json({ rankings, meta: { period, periodStart, periodEnd, scoreVersion: 1 } })
  } catch (error) {
    return authResponseError(error)
  }
}
