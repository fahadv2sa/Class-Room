import { authResponseError } from '@/lib/auth/session'
import { assertSameSchool, getTenantFilter } from '@/lib/academic/access'
import {
  attendanceSessionInclude,
  dateOrUndefined,
  normalizeAttendanceSessionStatus,
} from '@/lib/attendance/api'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { sessionId } = await params

    const session = await prisma.classroomAttendanceSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: attendanceSessionInclude,
    })
    assertSameSchool(auth, session.schoolId)

    return Response.json({ session })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { sessionId } = await params
    const body = await request.json().catch(() => null)

    const existing = await prisma.classroomAttendanceSession.findUniqueOrThrow({
      where: { id: sessionId },
    })
    assertSameSchool(auth, existing.schoolId)

    const teacherId = body?.teacherId ?? body?.teacher_id
    if (teacherId) {
      const teacher = await prisma.teacher.findUniqueOrThrow({
        where: { id: teacherId },
        select: { schoolId: true },
      })
      if (teacher.schoolId !== existing.schoolId) {
        return Response.json({ error: 'teacherId must belong to the session school' }, { status: 400 })
      }
    }

    const session = await prisma.classroomAttendanceSession.update({
      where: { id: sessionId },
      data: {
        teacherId: teacherId === undefined ? undefined : teacherId || null,
        status: normalizeAttendanceSessionStatus(body?.status),
        openedAt: dateOrUndefined(body?.openedAt ?? body?.opened_at),
        closedAt: dateOrUndefined(body?.closedAt ?? body?.closed_at),
      },
      include: attendanceSessionInclude,
    })

    return Response.json({ session })
  } catch (error) {
    return authResponseError(error)
  }
}
