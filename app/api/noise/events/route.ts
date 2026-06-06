import { Prisma } from '@prisma/client'
import { authResponseError } from '@/lib/auth/session'
import { getTenantFilter } from '@/lib/academic/access'
import { paginationMeta, parsePagination } from '@/lib/people/api'
import { dateOnlyUTC, noiseEventInclude, normalizeNoiseEventStatus, normalizeNoiseSeverity } from '@/lib/noise/api'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { auth, schoolId } = await getTenantFilter()
    const url = new URL(request.url)
    const requestedSchoolId = url.searchParams.get('schoolId')
    const whereSchoolId = auth.role === 'SUPER_ADMIN' ? requestedSchoolId : schoolId
    const classroomId = url.searchParams.get('classroomId')
    const teacherId = url.searchParams.get('teacherId')
    const severity = normalizeNoiseSeverity(url.searchParams.get('severity'))
    const status = normalizeNoiseEventStatus(url.searchParams.get('status'))
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const { page, pageSize, skip, take } = parsePagination(url)

    const where: Prisma.NoiseEventWhereInput = {
      ...(whereSchoolId ? { schoolId: whereSchoolId } : {}),
      ...(classroomId ? { classroomId } : {}),
      ...(teacherId ? { teacherId } : {}),
      ...(severity ? { severity } : {}),
      ...(status ? { status } : {}),
      ...((from || to)
        ? {
            startedAt: {
              ...(from ? { gte: dateOnlyUTC(new Date(from)) } : {}),
              ...(to ? { lt: new Date(dateOnlyUTC(new Date(to)).getTime() + 24 * 60 * 60 * 1000) } : {}),
            },
          }
        : {}),
    }

    const [events, total] = await Promise.all([
      prisma.noiseEvent.findMany({
        where,
        include: noiseEventInclude,
        orderBy: { startedAt: 'desc' },
        skip,
        take,
      }),
      prisma.noiseEvent.count({ where }),
    ])

    return Response.json({ events, meta: paginationMeta(total, page, pageSize) })
  } catch (error) {
    return authResponseError(error)
  }
}
