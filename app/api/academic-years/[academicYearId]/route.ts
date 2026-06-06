import { authResponseError } from '@/lib/auth/session'
import { assertSameSchool, boolOrUndefined, dateOrUndefined, getTenantFilter } from '@/lib/academic/access'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ academicYearId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { academicYearId } = await params

    const academicYear = await prisma.academicYear.findUniqueOrThrow({
      where: { id: academicYearId },
    })
    assertSameSchool(auth, academicYear.schoolId)

    return Response.json({ academicYear })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ academicYearId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { academicYearId } = await params
    const body = await request.json().catch(() => null)

    const existing = await prisma.academicYear.findUniqueOrThrow({
      where: { id: academicYearId },
    })
    assertSameSchool(auth, existing.schoolId)

    const isActive = boolOrUndefined(body?.isActive ?? body?.is_active)

    const academicYear = await prisma.$transaction(async (tx) => {
      if (isActive === true) {
        await tx.academicYear.updateMany({
          where: { schoolId: existing.schoolId, id: { not: academicYearId } },
          data: { isActive: false },
        })
      }

      return tx.academicYear.update({
        where: { id: academicYearId },
        data: {
          name: body?.name,
          startDate: dateOrUndefined(body?.startDate ?? body?.start_date),
          endDate: dateOrUndefined(body?.endDate ?? body?.end_date),
          isActive,
        },
      })
    })

    return Response.json({ academicYear })
  } catch (error) {
    return authResponseError(error)
  }
}
