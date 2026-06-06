import { authResponseError } from '@/lib/auth/session'
import { assertSameSchool, getTenantFilter } from '@/lib/academic/access'
import { prisma } from '@/lib/prisma'
import {
  dateOrNull,
  normalizeGender,
  normalizeStudentStatus,
  nullableText,
  requireCardCode,
  textOrUndefined,
} from '@/lib/people/api'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { studentId } = await params

    const student = await prisma.student.findUniqueOrThrow({
      where: { id: studentId },
      include: {
        classroom: {
          select: {
            id: true,
            classroomCode: true,
            classroomName: true,
            level: { select: { levelType: true, displayName: true } },
          },
        },
      },
    })
    assertSameSchool(auth, student.schoolId)

    return Response.json({ student })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ studentId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { studentId } = await params
    const body = await request.json().catch(() => null)

    const existing = await prisma.student.findUniqueOrThrow({
      where: { id: studentId },
    })
    assertSameSchool(auth, existing.schoolId)

    const nextClassroomId = body?.classroomId ?? body?.classroom_id
    if (nextClassroomId) {
      const classroom = await prisma.classroom.findUniqueOrThrow({
        where: { id: String(nextClassroomId) },
      })
      if (classroom.schoolId !== existing.schoolId) {
        return Response.json({ error: 'classroomId must belong to the same school' }, { status: 400 })
      }
    }

    const card = body?.cardCode ?? body?.card_code
    const student = await prisma.student.update({
      where: { id: studentId },
      data: {
        classroomId: nextClassroomId ? String(nextClassroomId) : undefined,
        studentNumber: textOrUndefined(body?.studentNumber ?? body?.student_number),
        fullNameAr: textOrUndefined(body?.fullNameAr ?? body?.full_name_ar),
        fullNameEn: textOrUndefined(body?.fullNameEn ?? body?.full_name_en),
        nationalId: nullableText(body?.nationalId ?? body?.national_id),
        gender: normalizeGender(body?.gender),
        birthDate: dateOrNull(body?.birthDate ?? body?.birth_date),
        guardianName: nullableText(body?.guardianName ?? body?.guardian_name),
        guardianPhone: nullableText(body?.guardianPhone ?? body?.guardian_phone),
        guardianEmail: nullableText(body?.guardianEmail ?? body?.guardian_email),
        profilePhotoUrl: nullableText(body?.profilePhotoUrl ?? body?.profile_photo_url),
        cardCode: card === undefined ? undefined : requireCardCode(card, 'STD'),
        status: normalizeStudentStatus(body?.status),
      },
      include: {
        classroom: {
          select: {
            id: true,
            classroomCode: true,
            classroomName: true,
            level: { select: { levelType: true, displayName: true } },
          },
        },
      },
    })

    return Response.json({ student })
  } catch (error) {
    return authResponseError(error)
  }
}
