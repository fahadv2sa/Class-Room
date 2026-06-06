import { authResponseError } from '@/lib/auth/session'
import { assertSameSchool, getTenantFilter } from '@/lib/academic/access'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ classroomId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { classroomId } = await params

    const classroom = await prisma.classroom.findUniqueOrThrow({
      where: { id: classroomId },
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
            openedAt: true,
            teacherId: true,
            records: {
              include: {
                student: { select: { id: true, fullNameAr: true, fullNameEn: true, cardCode: true } },
              },
            },
            studentPresenceStates: {
              include: {
                student: { select: { id: true, fullNameAr: true, fullNameEn: true, cardCode: true } },
              },
            },
          },
        },
        teacherPresenceStates: {
          where: { currentState: 'INSIDE_CLASSROOM' },
          include: {
            teacher: { select: { id: true, fullNameAr: true, fullNameEn: true, cardCode: true } },
          },
        },
      },
    })
    assertSameSchool(auth, classroom.schoolId)

    const session = classroom.attendanceSessions[0]
    const records = session?.records ?? []
    const states = session?.studentPresenceStates ?? []

    return Response.json({
      classroom: {
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
        records,
        states,
        teachersInside: classroom.teacherPresenceStates,
      },
    })
  } catch (error) {
    return authResponseError(error)
  }
}
