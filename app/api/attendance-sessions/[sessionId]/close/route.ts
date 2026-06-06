import { authResponseError } from '@/lib/auth/session'
import { assertSameSchool, getTenantFilter } from '@/lib/academic/access'
import { attendanceSessionInclude, dateOrUndefined } from '@/lib/attendance/api'
import { prisma } from '@/lib/prisma'

export async function POST(
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

    const session = await prisma.classroomAttendanceSession.update({
      where: { id: sessionId },
      data: {
        status: 'CLOSED',
        closedAt: dateOrUndefined(body?.closedAt ?? body?.closed_at) ?? new Date(),
      },
      include: attendanceSessionInclude,
    })

    return Response.json({ session })
  } catch (error) {
    return authResponseError(error)
  }
}
