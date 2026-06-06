import { Prisma } from '@prisma/client'
import { authResponseError } from '@/lib/auth/session'
import { getTenantFilter } from '@/lib/academic/access'
import { attendanceRecordInclude, normalizeAttendanceRecordStatus } from '@/lib/attendance/api'
import { paginationMeta, parsePagination } from '@/lib/people/api'
import { prisma } from '@/lib/prisma'

function normalizeLevel(value: unknown) {
  const level = String(value ?? '').trim().toUpperCase()
  if (level === 'PRIMARY' || level === 'MIDDLE' || level === 'HIGH') return level
  if (level === 'PRIMARY SCHOOL') return 'PRIMARY'
  return undefined
}

export async function GET(request: Request) {
  try {
    const { auth, schoolId } = await getTenantFilter()
    const url = new URL(request.url)
    const requestedSchoolId = url.searchParams.get('schoolId')
    const whereSchoolId = auth.role === 'SUPER_ADMIN' ? requestedSchoolId : schoolId
    const attendanceSessionId = url.searchParams.get('attendanceSessionId')
    const classroomId = url.searchParams.get('classroomId')
    const level = normalizeLevel(url.searchParams.get('level'))
    const status = normalizeAttendanceRecordStatus(url.searchParams.get('status'))
    const search = url.searchParams.get('search')?.trim()
    const { page, pageSize, skip, take } = parsePagination(url)

    const where: Prisma.StudentAttendanceRecordWhereInput = {
      ...(whereSchoolId ? { schoolId: whereSchoolId } : {}),
      ...(attendanceSessionId ? { attendanceSessionId } : {}),
      ...(classroomId ? { classroomId } : {}),
      ...(status ? { status } : {}),
      ...(level ? { classroom: { level: { levelType: level } } } : {}),
      ...(search
        ? {
            OR: [
              { student: { fullNameAr: { contains: search, mode: 'insensitive' } } },
              { student: { fullNameEn: { contains: search, mode: 'insensitive' } } },
              { student: { cardCode: { contains: search, mode: 'insensitive' } } },
              { classroom: { classroomCode: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    }

    const [records, total] = await Promise.all([
      prisma.studentAttendanceRecord.findMany({
        where,
        include: attendanceRecordInclude,
        orderBy: [
          { attendanceSession: { sessionDate: 'desc' } },
          { classroom: { classroomCode: 'asc' } },
          { student: { fullNameAr: 'asc' } },
        ],
        skip,
        take,
      }),
      prisma.studentAttendanceRecord.count({ where }),
    ])

    return Response.json({ records, meta: paginationMeta(total, page, pageSize) })
  } catch (error) {
    return authResponseError(error)
  }
}
