import { authResponseError } from '@/lib/auth/session'
import { getTenantFilter } from '@/lib/academic/access'
import { dateFromQuery, noiseEventInclude } from '@/lib/noise/api'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ classroomId: string }> },
) {
  try {
    const { auth, schoolId } = await getTenantFilter()
    const { classroomId } = await params
    const url = new URL(request.url)
    const requestedSchoolId = url.searchParams.get('schoolId')
    const whereSchoolId = auth.role === 'SUPER_ADMIN' ? requestedSchoolId : schoolId
    const summaryDate = dateFromQuery(url.searchParams.get('date'))

    const classroom = await prisma.classroom.findFirstOrThrow({
      where: {
        id: classroomId,
        ...(whereSchoolId ? { schoolId: whereSchoolId } : {}),
      },
      select: {
        id: true,
        schoolId: true,
        classroomCode: true,
        classroomName: true,
        classroomDevices: {
          where: { status: 'ACTIVE' },
          orderBy: { installedAt: 'desc' },
          take: 1,
          select: { id: true, deviceCode: true, connectionStatus: true },
        },
        noiseStates: {
          take: 1,
          select: {
            id: true,
            currentDb: true,
            currentState: true,
            activeNoiseEventId: true,
            updatedAt: true,
            activeNoiseEvent: { include: noiseEventInclude },
          },
        },
        noiseSummaries: {
          where: { period: 'DAILY', summaryDate },
          take: 1,
        },
      },
    })

    const events = await prisma.noiseEvent.findMany({
      where: {
        schoolId: classroom.schoolId,
        classroomId: classroom.id,
      },
      include: noiseEventInclude,
      orderBy: { startedAt: 'desc' },
      take: 25,
    })

    return Response.json({
      classroom: {
        classroomId: classroom.id,
        schoolId: classroom.schoolId,
        classroomCode: classroom.classroomCode,
        classroomName: classroom.classroomName,
        device: classroom.classroomDevices[0] ?? null,
        state: classroom.noiseStates[0] ?? null,
        summary: classroom.noiseSummaries[0] ?? null,
      },
      events,
      summaryDate,
    })
  } catch (error) {
    return authResponseError(error)
  }
}
