import { Prisma } from '@prisma/client'
import { authResponseError } from '@/lib/auth/session'
import { getTenantFilter } from '@/lib/academic/access'
import { paginationMeta, parsePagination } from '@/lib/people/api'
import { dateFromQuery } from '@/lib/noise/api'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { auth, schoolId } = await getTenantFilter()
    const url = new URL(request.url)
    const requestedSchoolId = url.searchParams.get('schoolId')
    const whereSchoolId = auth.role === 'SUPER_ADMIN' ? requestedSchoolId : schoolId
    const teacherId = url.searchParams.get('teacherId')
    const summaryDate = dateFromQuery(url.searchParams.get('date'))
    const { page, pageSize, skip, take } = parsePagination(url)

    const where: Prisma.TeacherNoiseSummaryWhereInput = {
      ...(whereSchoolId ? { schoolId: whereSchoolId } : {}),
      ...(teacherId ? { teacherId } : {}),
      summaryDate,
    }

    const [summaries, total] = await Promise.all([
      prisma.teacherNoiseSummary.findMany({
        where,
        include: {
          teacher: { select: { id: true, fullNameAr: true, fullNameEn: true, employeeNumber: true } },
        },
        orderBy: [{ quietScore: 'asc' }, { totalEvents: 'desc' }],
        skip,
        take,
      }),
      prisma.teacherNoiseSummary.count({ where }),
    ])

    return Response.json({ teachers: summaries, summaryDate, meta: paginationMeta(total, page, pageSize) })
  } catch (error) {
    return authResponseError(error)
  }
}
