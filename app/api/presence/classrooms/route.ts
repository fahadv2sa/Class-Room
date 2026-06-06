import { authResponseError } from '@/lib/auth/session'
import { getTenantFilter } from '@/lib/academic/access'
import { normalizeLevel } from '@/lib/presence/api'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { auth, schoolId } = await getTenantFilter()
    const url = new URL(request.url)
    const requestedSchoolId = url.searchParams.get('schoolId')
    const whereSchoolId = auth.role === 'SUPER_ADMIN' ? requestedSchoolId : schoolId
    const level = normalizeLevel(url.searchParams.get('level'))

    const classrooms = await prisma.classroom.findMany({
      where: {
        ...(whereSchoolId ? { schoolId: whereSchoolId } : {}),
        ...(level ? { level: { levelType: level } } : {}),
      },
      select: {
        id: true,
        classroomCode: true,
        classroomName: true,
        schoolId: true,
        students: { where: { status: 'ACTIVE' }, select: { id: true } },
        attendanceSessions: {
          where: { status: 'OPEN' },
          orderBy: { openedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            teacherId: true,
            records: { select: { status: true } },
            studentPresenceStates: { select: { currentState: true } },
          },
        },
        teacherPresenceStates: {
          where: { currentState: 'INSIDE_CLASSROOM' },
          select: { id: true },
        },
      },
      orderBy: { classroomCode: 'asc' },
    })

    const presence = classrooms.map((classroom) => {
      const session = classroom.attendanceSessions[0]
      const records = session?.records ?? []
      const states = session?.studentPresenceStates ?? []
      return {
        classroomId: classroom.id,
        classroomCode: classroom.classroomCode,
        classroomName: classroom.classroomName,
        attendanceSessionId: session?.id ?? null,
        totalStudents: classroom.students.length,
        presentStudents: records.filter((record) => record.status === 'PRESENT').length,
        absentStudents: records.filter((record) => record.status === 'ABSENT').length,
        lateStudents: records.filter((record) => record.status === 'LATE').length,
        studentsInside: states.filter((state) => state.currentState === 'INSIDE_CLASSROOM').length,
        studentsOutside: states.filter((state) => state.currentState === 'OUTSIDE_CLASSROOM').length,
        teacherInside: classroom.teacherPresenceStates.length > 0,
      }
    })

    return Response.json({ classrooms: presence })
  } catch (error) {
    return authResponseError(error)
  }
}
