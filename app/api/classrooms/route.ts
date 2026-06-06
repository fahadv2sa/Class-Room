import { authResponseError } from '@/lib/auth/session'
import {
  getTenantFilter,
  requireWritableSchoolId,
  requiredString,
} from '@/lib/academic/access'
import { prisma } from '@/lib/prisma'

function normalizeClassroomCode(value: unknown) {
  return String(value ?? '').trim().toUpperCase()
}

function validateClassroomCode(code: string) {
  if (!/^[PMH][1-9][A-Z]$/.test(code)) {
    throw new Response('classroomCode must use the platform format, such as P1A, M2B, or H3A', { status: 400 })
  }
}

export async function GET(request: Request) {
  try {
    const { auth, schoolId } = await getTenantFilter()
    const url = new URL(request.url)
    const requestedSchoolId = url.searchParams.get('schoolId')
    const academicYearId = url.searchParams.get('academicYearId')
    const levelId = url.searchParams.get('levelId')
    const whereSchoolId = auth.role === 'SUPER_ADMIN' ? requestedSchoolId : schoolId

    const classrooms = await prisma.classroom.findMany({
      where: {
        ...(whereSchoolId ? { schoolId: whereSchoolId } : {}),
        ...(academicYearId ? { academicYearId } : {}),
        ...(levelId ? { levelId } : {}),
      },
      orderBy: [{ classroomCode: 'asc' }],
    })

    return Response.json({ classrooms })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { auth } = await getTenantFilter()
    const body = await request.json().catch(() => null)
    const schoolId = requireWritableSchoolId(auth, body?.schoolId ?? body?.school_id)
    const academicYearId = requiredString(body?.academicYearId ?? body?.academic_year_id, 'academicYearId')
    const levelId = requiredString(body?.levelId ?? body?.level_id, 'levelId')
    const classroomCode = normalizeClassroomCode(body?.classroomCode ?? body?.classroom_code)
    const classroomName = String(body?.classroomName ?? body?.classroom_name ?? classroomCode).trim()
    validateClassroomCode(classroomCode)

    const [academicYear, level] = await Promise.all([
      prisma.academicYear.findUniqueOrThrow({ where: { id: academicYearId } }),
      prisma.schoolLevel.findUniqueOrThrow({ where: { id: levelId } }),
    ])

    if (academicYear.schoolId !== schoolId || level.schoolId !== schoolId) {
      return Response.json({ error: 'academicYearId and levelId must belong to the selected school' }, { status: 400 })
    }

    if (level.academicYearId !== academicYearId) {
      return Response.json({ error: 'levelId must belong to the selected academic year' }, { status: 400 })
    }

    const classroom = await prisma.classroom.create({
      data: {
        schoolId,
        academicYearId,
        levelId,
        classroomCode,
        classroomName,
        isActive: body?.isActive ?? body?.is_active ?? true,
      },
    })

    return Response.json({ classroom }, { status: 201 })
  } catch (error) {
    return authResponseError(error)
  }
}
