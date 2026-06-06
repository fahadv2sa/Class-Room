import { authResponseError } from '@/lib/auth/session'
import { assertSameSchool, getTenantFilter } from '@/lib/academic/access'
import { prisma } from '@/lib/prisma'
import {
  dateOrNull,
  normalizeGender,
  normalizeTeacherStatus,
  nullableText,
  requireCardCode,
  textOrUndefined,
} from '@/lib/people/api'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teacherId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { teacherId } = await params

    const teacher = await prisma.teacher.findUniqueOrThrow({
      where: { id: teacherId },
    })
    assertSameSchool(auth, teacher.schoolId)

    return Response.json({ teacher })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ teacherId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { teacherId } = await params
    const body = await request.json().catch(() => null)

    const existing = await prisma.teacher.findUniqueOrThrow({
      where: { id: teacherId },
    })
    assertSameSchool(auth, existing.schoolId)

    const card = body?.cardCode ?? body?.card_code
    const teacher = await prisma.teacher.update({
      where: { id: teacherId },
      data: {
        employeeNumber: textOrUndefined(body?.employeeNumber ?? body?.employee_number),
        fullNameAr: textOrUndefined(body?.fullNameAr ?? body?.full_name_ar),
        fullNameEn: textOrUndefined(body?.fullNameEn ?? body?.full_name_en),
        nationalId: nullableText(body?.nationalId ?? body?.national_id),
        email: nullableText(body?.email),
        phone: nullableText(body?.phone),
        gender: normalizeGender(body?.gender),
        status: normalizeTeacherStatus(body?.status),
        hireDate: dateOrNull(body?.hireDate ?? body?.hire_date),
        profilePhotoUrl: nullableText(body?.profilePhotoUrl ?? body?.profile_photo_url),
        cardCode: card === undefined ? undefined : requireCardCode(card, 'TCH'),
      },
    })

    return Response.json({ teacher })
  } catch (error) {
    return authResponseError(error)
  }
}
