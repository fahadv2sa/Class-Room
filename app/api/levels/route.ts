import { authResponseError } from '@/lib/auth/session'
import {
  getTenantFilter,
  requireWritableSchoolId,
  requiredString,
} from '@/lib/academic/access'
import { prisma } from '@/lib/prisma'

const levelTypes = new Set(['PRIMARY', 'MIDDLE', 'HIGH'])

function parseLevelType(value: unknown) {
  const levelType = String(value ?? '').trim().toUpperCase()
  if (!levelTypes.has(levelType)) {
    throw new Response('levelType must be PRIMARY, MIDDLE, or HIGH', { status: 400 })
  }
  return levelType as 'PRIMARY' | 'MIDDLE' | 'HIGH'
}

export async function GET(request: Request) {
  try {
    const { auth, schoolId } = await getTenantFilter()
    const url = new URL(request.url)
    const requestedSchoolId = url.searchParams.get('schoolId')
    const academicYearId = url.searchParams.get('academicYearId')
    const whereSchoolId = auth.role === 'SUPER_ADMIN' ? requestedSchoolId : schoolId

    const levels = await prisma.schoolLevel.findMany({
      where: {
        ...(whereSchoolId ? { schoolId: whereSchoolId } : {}),
        ...(academicYearId ? { academicYearId } : {}),
      },
      orderBy: [{ academicYearId: 'desc' }, { levelType: 'asc' }],
    })

    return Response.json({ levels })
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
    const levelType = parseLevelType(body?.levelType ?? body?.level_type)
    const displayName = requiredString(body?.displayName ?? body?.display_name, 'displayName')

    const academicYear = await prisma.academicYear.findUniqueOrThrow({
      where: { id: academicYearId },
    })
    if (academicYear.schoolId !== schoolId) {
      return Response.json({ error: 'academicYearId does not belong to the selected school' }, { status: 400 })
    }

    const level = await prisma.schoolLevel.create({
      data: {
        schoolId,
        academicYearId,
        levelType,
        displayName,
        isActive: body?.isActive ?? body?.is_active ?? true,
      },
    })

    return Response.json({ level }, { status: 201 })
  } catch (error) {
    return authResponseError(error)
  }
}
