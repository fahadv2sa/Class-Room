import { authResponseError } from '@/lib/auth/session'
import { assertSameSchool, getTenantFilter } from '@/lib/academic/access'
import { paginationMeta, parsePagination } from '@/lib/people/api'
import { normalizeMovementStatus, studentMovementInclude } from '@/lib/presence/api'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { studentId } = await params
    const url = new URL(request.url)
    const status = normalizeMovementStatus(url.searchParams.get('status'))
    const { page, pageSize, skip, take } = parsePagination(url)

    const student = await prisma.student.findUniqueOrThrow({
      where: { id: studentId },
      select: { schoolId: true },
    })
    assertSameSchool(auth, student.schoolId)

    const where = {
      schoolId: student.schoolId,
      studentId,
      ...(status ? { status } : {}),
    }

    const [movements, total] = await Promise.all([
      prisma.studentMovementRecord.findMany({
        where,
        include: studentMovementInclude,
        orderBy: { exitedAt: 'desc' },
        skip,
        take,
      }),
      prisma.studentMovementRecord.count({ where }),
    ])

    return Response.json({ movements, meta: paginationMeta(total, page, pageSize) })
  } catch (error) {
    return authResponseError(error)
  }
}
