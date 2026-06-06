import { Prisma } from '@prisma/client'
import { authResponseError } from '@/lib/auth/session'
import { getTenantFilter, requireWritableSchoolId, requiredString } from '@/lib/academic/access'
import {
  attendanceSessionInclude,
  dateOnlyOrUndefined,
  dateOrUndefined,
  normalizeAttendanceSessionStatus,
} from '@/lib/attendance/api'
import { ensureAttendanceRecords, sessionDate } from '@/lib/attendance/rfid'
import { paginationMeta, parsePagination } from '@/lib/people/api'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { auth, schoolId } = await getTenantFilter()
    const url = new URL(request.url)
    const requestedSchoolId = url.searchParams.get('schoolId')
    const whereSchoolId = auth.role === 'SUPER_ADMIN' ? requestedSchoolId : schoolId
    const classroomId = url.searchParams.get('classroomId')
    const classroomDeviceId = url.searchParams.get('classroomDeviceId')
    const status = normalizeAttendanceSessionStatus(url.searchParams.get('status'))
    const date = dateOnlyOrUndefined(url.searchParams.get('date'))
    const { page, pageSize, skip, take } = parsePagination(url)

    const where: Prisma.ClassroomAttendanceSessionWhereInput = {
      ...(whereSchoolId ? { schoolId: whereSchoolId } : {}),
      ...(classroomId ? { classroomId } : {}),
      ...(classroomDeviceId ? { classroomDeviceId } : {}),
      ...(status ? { status } : {}),
      ...(date ? { sessionDate: date } : {}),
    }

    const [sessions, total] = await Promise.all([
      prisma.classroomAttendanceSession.findMany({
        where,
        include: attendanceSessionInclude,
        orderBy: [{ sessionDate: 'desc' }, { openedAt: 'desc' }],
        skip,
        take,
      }),
      prisma.classroomAttendanceSession.count({ where }),
    ])

    return Response.json({ sessions, meta: paginationMeta(total, page, pageSize) })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { auth } = await getTenantFilter()
    const body = await request.json().catch(() => null)
    const schoolId = requireWritableSchoolId(auth, body?.schoolId ?? body?.school_id)
    const classroomId = requiredString(body?.classroomId ?? body?.classroom_id, 'classroomId')
    const openedAt = dateOrUndefined(body?.openedAt ?? body?.opened_at) ?? new Date()
    const sessionDay = dateOnlyOrUndefined(body?.sessionDate ?? body?.session_date) ?? sessionDate(openedAt)

    const classroom = await prisma.classroom.findUniqueOrThrow({
      where: { id: classroomId },
      select: { id: true, schoolId: true, academicYearId: true },
    })
    if (classroom.schoolId !== schoolId) {
      return Response.json({ error: 'classroomId must belong to the selected school' }, { status: 400 })
    }

    const classroomDeviceId = body?.classroomDeviceId ?? body?.classroom_device_id
    const classroomDevice = classroomDeviceId
      ? await prisma.classroomDevice.findUniqueOrThrow({ where: { id: classroomDeviceId } })
      : await prisma.classroomDevice.findFirstOrThrow({
          where: { schoolId, classroomId, status: 'ACTIVE' },
          orderBy: { registeredAt: 'desc' },
        })

    if (classroomDevice.schoolId !== schoolId || classroomDevice.classroomId !== classroomId) {
      return Response.json({ error: 'classroomDeviceId must belong to the selected classroom and school' }, { status: 400 })
    }

    const teacherId = body?.teacherId ?? body?.teacher_id ?? null
    if (teacherId) {
      const teacher = await prisma.teacher.findUniqueOrThrow({
        where: { id: teacherId },
        select: { schoolId: true },
      })
      if (teacher.schoolId !== schoolId) {
        return Response.json({ error: 'teacherId must belong to the selected school' }, { status: 400 })
      }
    }

    const session = await prisma.classroomAttendanceSession.create({
      data: {
        schoolId,
        academicYearId: classroom.academicYearId,
        classroomId,
        classroomDeviceId: classroomDevice.id,
        teacherId,
        sessionDate: sessionDay,
        status: 'OPEN',
        openedAt,
      },
      include: attendanceSessionInclude,
    })

    await ensureAttendanceRecords(session.id, schoolId, classroomId)

    return Response.json({ session }, { status: 201 })
  } catch (error) {
    return authResponseError(error)
  }
}
