import { Prisma } from '@prisma/client'
import { authResponseError } from '@/lib/auth/session'
import { getTenantFilter } from '@/lib/academic/access'
import { normalizeRFIDDirection, normalizeRFIDScanStatus, rfidScanEventInclude } from '@/lib/attendance/api'
import { processRFIDScan } from '@/lib/attendance/rfid'
import { paginationMeta, parsePagination } from '@/lib/people/api'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { auth, schoolId } = await getTenantFilter()
    const url = new URL(request.url)
    const requestedSchoolId = url.searchParams.get('schoolId')
    const whereSchoolId = auth.role === 'SUPER_ADMIN' ? requestedSchoolId : schoolId
    const classroomId = url.searchParams.get('classroomId')
    const classroomDeviceId = url.searchParams.get('classroomDeviceId')
    const scanStatus = normalizeRFIDScanStatus(url.searchParams.get('scanStatus'))
    const scanDirection = normalizeRFIDDirection(url.searchParams.get('scanDirection'))
    const search = url.searchParams.get('search')?.trim()
    const { page, pageSize, skip, take } = parsePagination(url)

    const where: Prisma.RFIDScanEventWhereInput = {
      ...(whereSchoolId ? { schoolId: whereSchoolId } : {}),
      ...(classroomId ? { classroomId } : {}),
      ...(classroomDeviceId ? { classroomDeviceId } : {}),
      ...(scanStatus ? { scanStatus } : {}),
      ...(scanDirection ? { scanDirection } : {}),
      ...(search
        ? {
            OR: [
              { cardCode: { contains: search, mode: 'insensitive' } },
              { sourceEventId: { contains: search, mode: 'insensitive' } },
              { notes: { contains: search, mode: 'insensitive' } },
              { classroom: { classroomCode: { contains: search, mode: 'insensitive' } } },
              { classroomDevice: { deviceCode: { contains: search, mode: 'insensitive' } } },
              { student: { fullNameAr: { contains: search, mode: 'insensitive' } } },
              { student: { fullNameEn: { contains: search, mode: 'insensitive' } } },
              { teacher: { fullNameAr: { contains: search, mode: 'insensitive' } } },
              { teacher: { fullNameEn: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    }

    const [events, total] = await Promise.all([
      prisma.rFIDScanEvent.findMany({
        where,
        include: rfidScanEventInclude,
        orderBy: { scannedAt: 'desc' },
        skip,
        take,
      }),
      prisma.rFIDScanEvent.count({ where }),
    ])

    return Response.json({ events, meta: paginationMeta(total, page, pageSize) })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { auth } = await getTenantFilter()
    const body = await request.json().catch(() => null)
    const result = await processRFIDScan({
      auth,
      classroomDeviceId: body?.classroomDeviceId ?? body?.classroom_device_id,
      deviceCode: body?.deviceCode ?? body?.device_code,
      cardCode: body?.cardCode ?? body?.card_code,
      scanDirection: body?.scanDirection ?? body?.scan_direction,
      scannedAt: body?.scannedAt ?? body?.scanned_at,
      sourceEventId: body?.sourceEventId ?? body?.source_event_id,
      notes: body?.notes,
    })

    return Response.json(result, { status: 201 })
  } catch (error) {
    return authResponseError(error)
  }
}
