import { Prisma } from '@prisma/client'
import { authResponseError } from '@/lib/auth/session'
import { getTenantFilter } from '@/lib/academic/access'
import { paginationMeta, parsePagination } from '@/lib/people/api'
import { normalizeLevel, normalizeMovementStatus, studentMovementInclude } from '@/lib/presence/api'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { auth, schoolId } = await getTenantFilter()
    const url = new URL(request.url)
    const requestedSchoolId = url.searchParams.get('schoolId')
    const whereSchoolId = auth.role === 'SUPER_ADMIN' ? requestedSchoolId : schoolId
    const classroomId = url.searchParams.get('classroomId')
    const studentId = url.searchParams.get('studentId')
    const status = normalizeMovementStatus(url.searchParams.get('status'))
    const level = normalizeLevel(url.searchParams.get('level'))
    const search = url.searchParams.get('search')?.trim()
    const { page, pageSize, skip, take } = parsePagination(url)

    const where: Prisma.StudentMovementRecordWhereInput = {
      ...(whereSchoolId ? { schoolId: whereSchoolId } : {}),
      ...(classroomId ? { classroomId } : {}),
      ...(studentId ? { studentId } : {}),
      ...(status ? { status } : {}),
      ...(level ? { classroom: { level: { levelType: level } } } : {}),
      ...(search
        ? {
            OR: [
              { student: { fullNameAr: { contains: search, mode: 'insensitive' } } },
              { student: { fullNameEn: { contains: search, mode: 'insensitive' } } },
              { classroom: { classroomCode: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
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
