import { authResponseError } from '@/lib/auth/session'
import {
  dateOrUndefined,
  getTenantFilter,
  requireWritableSchoolId,
  requiredString,
} from '@/lib/academic/access'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { auth, schoolId } = await getTenantFilter()
    const url = new URL(request.url)
    const requestedSchoolId = url.searchParams.get('schoolId')
    const whereSchoolId = auth.role === 'SUPER_ADMIN' ? requestedSchoolId : schoolId

    const academicYears = await prisma.academicYear.findMany({
      where: {
        ...(whereSchoolId ? { schoolId: whereSchoolId } : {}),
      },
      orderBy: [{ isActive: 'desc' }, { startDate: 'desc' }],
    })

    return Response.json({ academicYears })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { auth } = await getTenantFilter()
    const body = await request.json().catch(() => null)
    const schoolId = requireWritableSchoolId(auth, body?.schoolId ?? body?.school_id)
    const name = requiredString(body?.name, 'name')
    const startDate = dateOrUndefined(body?.startDate ?? body?.start_date)
    const endDate = dateOrUndefined(body?.endDate ?? body?.end_date)
    const isActive = body?.isActive ?? body?.is_active ?? false

    if (!startDate || !endDate) {
      return Response.json({ error: 'startDate and endDate are required' }, { status: 400 })
    }

    const academicYear = await prisma.$transaction(async (tx) => {
      if (isActive) {
        await tx.academicYear.updateMany({
          where: { schoolId },
          data: { isActive: false },
        })
      }

      return tx.academicYear.create({
        data: {
          schoolId,
          name,
          startDate,
          endDate,
          isActive,
        },
      })
    })

    return Response.json({ academicYear }, { status: 201 })
  } catch (error) {
    return authResponseError(error)
  }
}
