import { Prisma } from '@prisma/client'
import { authResponseError } from '@/lib/auth/session'
import { getTenantFilter, requireWritableSchoolId, requiredString } from '@/lib/academic/access'
import { prisma } from '@/lib/prisma'
import {
  cardCode,
  dateOrNull,
  normalizeStudentStatus,
  paginationMeta,
  parseCardSequence,
  parsePagination,
  requireCardCode,
  requireGender,
  nullableText,
} from '@/lib/people/api'

async function nextStudentCardCode() {
  const latest = await prisma.student.findFirst({
    orderBy: { cardCode: 'desc' },
    select: { cardCode: true },
  })
  return cardCode('STD', parseCardSequence(latest?.cardCode ?? '', 'STD') + 1)
}

export async function GET(request: Request) {
  try {
    const { auth, schoolId } = await getTenantFilter()
    const url = new URL(request.url)
    const requestedSchoolId = url.searchParams.get('schoolId')
    const whereSchoolId = auth.role === 'SUPER_ADMIN' ? requestedSchoolId : schoolId
    const search = url.searchParams.get('search')?.trim()
    const status = normalizeStudentStatus(url.searchParams.get('status'))
    const classroomId = url.searchParams.get('classroomId')
    const classroomCode = url.searchParams.get('classroomCode')?.trim().toUpperCase()
    const levelType = url.searchParams.get('level')?.trim().toUpperCase()
    const { page, pageSize, skip, take } = parsePagination(url)
    const classroomFilter: Prisma.ClassroomWhereInput = {
      ...(classroomCode ? { classroomCode } : {}),
      ...(levelType === 'PRIMARY' || levelType === 'MIDDLE' || levelType === 'HIGH'
        ? { level: { levelType } }
        : {}),
    }
    const hasClassroomFilter = Object.keys(classroomFilter).length > 0

    const where: Prisma.StudentWhereInput = {
      ...(whereSchoolId ? { schoolId: whereSchoolId } : {}),
      ...(status ? { status } : {}),
      ...(classroomId ? { classroomId } : {}),
      ...(hasClassroomFilter ? { classroom: classroomFilter } : {}),
      ...(search
        ? {
            OR: [
              { fullNameAr: { contains: search, mode: 'insensitive' } },
              { fullNameEn: { contains: search, mode: 'insensitive' } },
              { studentNumber: { contains: search, mode: 'insensitive' } },
              { guardianName: { contains: search, mode: 'insensitive' } },
              { guardianPhone: { contains: search, mode: 'insensitive' } },
              { cardCode: { contains: search, mode: 'insensitive' } },
              { classroom: { classroomCode: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
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
        orderBy: [{ classroom: { classroomCode: 'asc' } }, { studentNumber: 'asc' }],
        skip,
        take,
      }),
      prisma.student.count({ where }),
    ])

    return Response.json({ students, meta: paginationMeta(total, page, pageSize) })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { auth } = await getTenantFilter()
    const body = await request.json().catch(() => null)
    const schoolId = requireWritableSchoolId(auth, body?.schoolId ?? body?.school_id)
    const classroomId = requiredString(body?.classroomId ?? body?.classroom_id, 'classroomId')
    const studentNumber = requiredString(body?.studentNumber ?? body?.student_number, 'studentNumber')
    const fullNameAr = requiredString(body?.fullNameAr ?? body?.full_name_ar, 'fullNameAr')
    const fullNameEn = requiredString(body?.fullNameEn ?? body?.full_name_en, 'fullNameEn')
    const gender = requireGender(body?.gender)
    const card = body?.cardCode ?? body?.card_code
    const cardCodeValue = card ? requireCardCode(card, 'STD') : await nextStudentCardCode()
    const status = normalizeStudentStatus(body?.status) ?? 'ACTIVE'

    const classroom = await prisma.classroom.findUniqueOrThrow({
      where: { id: classroomId },
    })

    if (classroom.schoolId !== schoolId) {
      return Response.json({ error: 'classroomId must belong to the selected school' }, { status: 400 })
    }

    const student = await prisma.student.create({
      data: {
        schoolId,
        classroomId,
        studentNumber,
        fullNameAr,
        fullNameEn,
        gender,
        status,
        cardCode: cardCodeValue,
        nationalId: nullableText(body?.nationalId ?? body?.national_id),
        birthDate: dateOrNull(body?.birthDate ?? body?.birth_date),
        guardianName: nullableText(body?.guardianName ?? body?.guardian_name),
        guardianPhone: nullableText(body?.guardianPhone ?? body?.guardian_phone),
        guardianEmail: nullableText(body?.guardianEmail ?? body?.guardian_email),
        profilePhotoUrl: nullableText(body?.profilePhotoUrl ?? body?.profile_photo_url),
      },
    })

    return Response.json({ student }, { status: 201 })
  } catch (error) {
    return authResponseError(error)
  }
}
