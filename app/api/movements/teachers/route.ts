import { Prisma } from '@prisma/client'
import { authResponseError } from '@/lib/auth/session'
import { getTenantFilter } from '@/lib/academic/access'
import { paginationMeta, parsePagination } from '@/lib/people/api'
import { normalizeLevel, normalizeTeacherMovementStatus, teacherMovementInclude } from '@/lib/presence/api'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { auth, schoolId } = await getTenantFilter()
    const url = new URL(request.url)
    const requestedSchoolId = url.searchParams.get('schoolId')
    const whereSchoolId = auth.role === 'SUPER_ADMIN' ? requestedSchoolId : schoolId
    const classroomId = url.searchParams.get('classroomId')
    const teacherId = url.searchParams.get('teacherId')
    const status = normalizeTeacherMovementStatus(url.searchParams.get('status'))
    const level = normalizeLevel(url.searchParams.get('level'))
    const search = url.searchParams.get('search')?.trim()
    const { page, pageSize, skip, take } = parsePagination(url)

    const where: Prisma.TeacherMovementRecordWhereInput = {
      ...(whereSchoolId ? { schoolId: whereSchoolId } : {}),
      ...(classroomId ? { classroomId } : {}),
      ...(teacherId ? { teacherId } : {}),
      ...(status ? { status } : {}),
      ...(level ? { classroom: { level: { levelType: level } } } : {}),
      ...(search
        ? {
            OR: [
              { teacher: { fullNameAr: { contains: search, mode: 'insensitive' } } },
              { teacher: { fullNameEn: { contains: search, mode: 'insensitive' } } },
              { classroom: { classroomCode: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    }

    const [movements, total] = await Promise.all([
      prisma.teacherMovementRecord.findMany({
        where,
        include: teacherMovementInclude,
        orderBy: [{ enteredAt: 'desc' }, { exitedAt: 'desc' }],
        skip,
        take,
      }),
      prisma.teacherMovementRecord.count({ where }),
    ])

    return Response.json({ movements, meta: paginationMeta(total, page, pageSize) })
  } catch (error) {
    return authResponseError(error)
  }
}
