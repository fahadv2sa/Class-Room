import { authResponseError } from '@/lib/auth/session'
import { getTenantFilter } from '@/lib/academic/access'
import { normalizeLevel } from '@/lib/presence/api'
import { dateFromQuery } from '@/lib/noise/api'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { auth, schoolId } = await getTenantFilter()
    const url = new URL(request.url)
    const requestedSchoolId = url.searchParams.get('schoolId')
    const whereSchoolId = auth.role === 'SUPER_ADMIN' ? requestedSchoolId : schoolId
    const level = normalizeLevel(url.searchParams.get('level'))
    const summaryDate = dateFromQuery(url.searchParams.get('date'))

    const classrooms = await prisma.classroom.findMany({
      where: {
        ...(whereSchoolId ? { schoolId: whereSchoolId } : {}),
        ...(level ? { level: { levelType: level } } : {}),
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
            activeNoiseEvent: {
              select: {
                id: true,
                startedAt: true,
                averageDb: true,
                peakDb: true,
                severity: true,
                teacher: { select: { id: true, fullNameAr: true, fullNameEn: true } },
              },
            },
          },
        },
        noiseSummaries: {
          where: { summaryDate },
          take: 1,
        },
      },
      orderBy: { classroomCode: 'asc' },
    })

    const data = classrooms.map((classroom) => {
      const device = classroom.classroomDevices[0] ?? null
      const state = classroom.noiseStates[0] ?? null
      const summary = classroom.noiseSummaries[0] ?? null

      return {
        classroomId: classroom.id,
        schoolId: classroom.schoolId,
        classroomCode: classroom.classroomCode,
        classroomName: classroom.classroomName,
        device,
        state: state ?? {
          currentDb: 0,
          currentState: 'QUIET',
          activeNoiseEventId: null,
          updatedAt: null,
          activeNoiseEvent: null,
        },
        summary: summary ?? {
          summaryDate,
          totalEvents: 0,
          totalNoiseSeconds: 0,
          averageEventDb: 0,
          peakDb: 0,
          lowEvents: 0,
          mediumEvents: 0,
          highEvents: 0,
          quietScore: 100,
        },
      }
    })

    return Response.json({ classrooms: data, summaryDate })
  } catch (error) {
    return authResponseError(error)
  }
}
