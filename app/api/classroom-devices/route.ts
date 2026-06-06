import { Prisma } from '@prisma/client'
import { authResponseError } from '@/lib/auth/session'
import { getTenantFilter, requireWritableSchoolId, requiredString } from '@/lib/academic/access'
import { prisma } from '@/lib/prisma'
import {
  DEFAULT_DEVICE_CAPABILITIES,
  assertClassroomBelongsToSchool,
  assertNoOtherActiveDevice,
  dateOrUndefined,
  nextDeviceCode,
  normalizeCapabilities,
  normalizeConnectionStatus,
  normalizeDeviceStatus,
  requireDeviceCode,
} from '@/lib/devices/api'
import { nullableText, paginationMeta, parsePagination } from '@/lib/people/api'

const includeDeviceRelations = {
  classroom: {
    select: {
      id: true,
      classroomCode: true,
      classroomName: true,
      level: {
        select: {
          id: true,
          levelType: true,
          displayName: true,
        },
      },
    },
  },
  school: {
    select: {
      id: true,
      schoolCode: true,
      name: true,
    },
  },
}

export async function GET(request: Request) {
  try {
    const { auth, schoolId } = await getTenantFilter()
    const url = new URL(request.url)
    const requestedSchoolId = url.searchParams.get('schoolId')
    const classroomId = url.searchParams.get('classroomId')
    const status = normalizeDeviceStatus(url.searchParams.get('status'))
    const connectionStatus = normalizeConnectionStatus(url.searchParams.get('connectionStatus'))
    const search = url.searchParams.get('search')?.trim()
    const whereSchoolId = auth.role === 'SUPER_ADMIN' ? requestedSchoolId : schoolId
    const { page, pageSize, skip, take } = parsePagination(url)

    const where: Prisma.ClassroomDeviceWhereInput = {
      ...(whereSchoolId ? { schoolId: whereSchoolId } : {}),
      ...(classroomId ? { classroomId } : {}),
      ...(status ? { status } : {}),
      ...(connectionStatus ? { connectionStatus } : {}),
      ...(search
        ? {
            OR: [
              { deviceCode: { contains: search, mode: 'insensitive' } },
              { serialNumber: { contains: search, mode: 'insensitive' } },
              { firmwareVersion: { contains: search, mode: 'insensitive' } },
              { hardwareVersion: { contains: search, mode: 'insensitive' } },
              { notes: { contains: search, mode: 'insensitive' } },
              { classroom: { classroomCode: { contains: search, mode: 'insensitive' } } },
              { classroom: { classroomName: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    }

    const [devices, total] = await Promise.all([
      prisma.classroomDevice.findMany({
        where,
        include: includeDeviceRelations,
        orderBy: [{ classroom: { classroomCode: 'asc' } }, { deviceCode: 'asc' }],
        skip,
        take,
      }),
      prisma.classroomDevice.count({ where }),
    ])

    return Response.json({ devices, meta: paginationMeta(total, page, pageSize) })
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
    const serialNumber = requiredString(body?.serialNumber ?? body?.serial_number, 'serialNumber')
    const firmwareVersion = requiredString(body?.firmwareVersion ?? body?.firmware_version, 'firmwareVersion')
    const hardwareVersion = requiredString(body?.hardwareVersion ?? body?.hardware_version, 'hardwareVersion')
    const status = normalizeDeviceStatus(body?.status) ?? 'ACTIVE'
    const connectionStatus = normalizeConnectionStatus(body?.connectionStatus ?? body?.connection_status) ?? 'UNKNOWN'
    const requestedDeviceCode = body?.deviceCode ?? body?.device_code
    const deviceCodeValue = requestedDeviceCode
      ? requireDeviceCode(requestedDeviceCode)
      : await nextDeviceCode()

    await assertClassroomBelongsToSchool(classroomId, schoolId)
    if (status === 'ACTIVE') await assertNoOtherActiveDevice(classroomId)

    const installedAt = dateOrUndefined(body?.installedAt ?? body?.installed_at) ?? new Date()
    const registeredAt = dateOrUndefined(body?.registeredAt ?? body?.registered_at) ?? new Date()
    if (installedAt === null || registeredAt === null) {
      return Response.json({ error: 'installedAt and registeredAt cannot be null' }, { status: 400 })
    }

    const device = await prisma.classroomDevice.create({
      data: {
        schoolId,
        classroomId,
        deviceCode: deviceCodeValue,
        serialNumber,
        firmwareVersion,
        hardwareVersion,
        status,
        connectionStatus,
        capabilities: normalizeCapabilities(body?.capabilities) ?? DEFAULT_DEVICE_CAPABILITIES,
        installedAt,
        registeredAt,
        lastSeenAt: dateOrUndefined(body?.lastSeenAt ?? body?.last_seen_at),
        retiredAt: status === 'RETIRED' ? (dateOrUndefined(body?.retiredAt ?? body?.retired_at) ?? new Date()) : null,
        notes: nullableText(body?.notes),
        provisionedAt: dateOrUndefined(body?.provisionedAt ?? body?.provisioned_at),
        provisionedBy: nullableText(body?.provisionedBy ?? body?.provisioned_by),
        pairingTokenHash: nullableText(body?.pairingTokenHash ?? body?.pairing_token_hash),
        pairingTokenExpiresAt: dateOrUndefined(body?.pairingTokenExpiresAt ?? body?.pairing_token_expires_at),
      },
      include: includeDeviceRelations,
    })

    return Response.json({ device }, { status: 201 })
  } catch (error) {
    return authResponseError(error)
  }
}
