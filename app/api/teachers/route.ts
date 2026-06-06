import { Prisma } from '@prisma/client'
import { authResponseError } from '@/lib/auth/session'
import { getTenantFilter, requireWritableSchoolId, requiredString } from '@/lib/academic/access'
import { prisma } from '@/lib/prisma'
import {
  dateOrNull,
  normalizeTeacherStatus,
  paginationMeta,
  parseCardSequence,
  parsePagination,
  requireCardCode,
  requireGender,
  nullableText,
  cardCode,
} from '@/lib/people/api'

async function nextTeacherCardCode() {
  const latest = await prisma.teacher.findFirst({
    orderBy: { cardCode: 'desc' },
    select: { cardCode: true },
  })
  return cardCode('TCH', parseCardSequence(latest?.cardCode ?? '', 'TCH') + 1)
}

export async function GET(request: Request) {
  try {
    const { auth, schoolId } = await getTenantFilter()
    const url = new URL(request.url)
    const requestedSchoolId = url.searchParams.get('schoolId')
    const whereSchoolId = auth.role === 'SUPER_ADMIN' ? requestedSchoolId : schoolId
    const search = url.searchParams.get('search')?.trim()
    const status = normalizeTeacherStatus(url.searchParams.get('status'))
    const gender = url.searchParams.get('gender')?.trim().toUpperCase()
    const { page, pageSize, skip, take } = parsePagination(url)

    const where: Prisma.TeacherWhereInput = {
      ...(whereSchoolId ? { schoolId: whereSchoolId } : {}),
      ...(status ? { status } : {}),
      ...(gender === 'MALE' || gender === 'FEMALE' ? { gender } : {}),
      ...(search
        ? {
            OR: [
              { fullNameAr: { contains: search, mode: 'insensitive' } },
              { fullNameEn: { contains: search, mode: 'insensitive' } },
              { employeeNumber: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { cardCode: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    }

    const [teachers, total] = await Promise.all([
      prisma.teacher.findMany({
        where,
        orderBy: [{ fullNameAr: 'asc' }, { employeeNumber: 'asc' }],
        skip,
        take,
      }),
      prisma.teacher.count({ where }),
    ])

    return Response.json({ teachers, meta: paginationMeta(total, page, pageSize) })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { auth } = await getTenantFilter()
    const body = await request.json().catch(() => null)
    const schoolId = requireWritableSchoolId(auth, body?.schoolId ?? body?.school_id)
    const employeeNumber = requiredString(body?.employeeNumber ?? body?.employee_number, 'employeeNumber')
    const fullNameAr = requiredString(body?.fullNameAr ?? body?.full_name_ar, 'fullNameAr')
    const fullNameEn = requiredString(body?.fullNameEn ?? body?.full_name_en, 'fullNameEn')
    const gender = requireGender(body?.gender)
    const card = body?.cardCode ?? body?.card_code
    const cardCodeValue = card ? requireCardCode(card, 'TCH') : await nextTeacherCardCode()
    const status = normalizeTeacherStatus(body?.status) ?? 'ACTIVE'

    const teacher = await prisma.teacher.create({
      data: {
        schoolId,
        employeeNumber,
        fullNameAr,
        fullNameEn,
        gender,
        status,
        cardCode: cardCodeValue,
        nationalId: nullableText(body?.nationalId ?? body?.national_id),
        email: nullableText(body?.email),
        phone: nullableText(body?.phone),
        hireDate: dateOrNull(body?.hireDate ?? body?.hire_date),
        profilePhotoUrl: nullableText(body?.profilePhotoUrl ?? body?.profile_photo_url),
      },
    })

    return Response.json({ teacher }, { status: 201 })
  } catch (error) {
    return authResponseError(error)
  }
}
