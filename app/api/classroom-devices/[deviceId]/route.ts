import { authResponseError } from '@/lib/auth/session'
import { assertSameSchool, getTenantFilter } from '@/lib/academic/access'
import { prisma } from '@/lib/prisma'
import {
  assertClassroomBelongsToSchool,
  assertNoOtherActiveDevice,
  dateOrUndefined,
  normalizeCapabilities,
  normalizeConnectionStatus,
  normalizeDeviceStatus,
} from '@/lib/devices/api'
import { runOperationalIntelligenceForSchool } from '@/lib/intelligence/rules'
import { nullableText, textOrUndefined } from '@/lib/people/api'

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { deviceId } = await params

    const device = await prisma.classroomDevice.findUniqueOrThrow({
      where: { id: deviceId },
      include: includeDeviceRelations,
    })
    assertSameSchool(auth, device.schoolId)

    return Response.json({ device })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ deviceId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { deviceId } = await params
    const body = await request.json().catch(() => null)

    if (body?.deviceCode !== undefined || body?.device_code !== undefined) {
      return Response.json({ error: 'deviceCode is immutable' }, { status: 400 })
    }

    const existing = await prisma.classroomDevice.findUniqueOrThrow({
      where: { id: deviceId },
    })
    assertSameSchool(auth, existing.schoolId)

    const nextClassroomId = textOrUndefined(body?.classroomId ?? body?.classroom_id) ?? existing.classroomId
    if (nextClassroomId !== existing.classroomId) {
      await assertClassroomBelongsToSchool(nextClassroomId, existing.schoolId)
    }

    const nextStatus = normalizeDeviceStatus(body?.status) ?? existing.status
    const nextConnectionStatus = normalizeConnectionStatus(body?.connectionStatus ?? body?.connection_status) ?? existing.connectionStatus
    if (nextStatus === 'ACTIVE') await assertNoOtherActiveDevice(nextClassroomId, existing.id)

    const device = await prisma.classroomDevice.update({
      where: { id: deviceId },
      data: {
        classroomId: nextClassroomId === existing.classroomId ? undefined : nextClassroomId,
        serialNumber: textOrUndefined(body?.serialNumber ?? body?.serial_number),
        firmwareVersion: textOrUndefined(body?.firmwareVersion ?? body?.firmware_version),
        hardwareVersion: textOrUndefined(body?.hardwareVersion ?? body?.hardware_version),
        status: normalizeDeviceStatus(body?.status),
        connectionStatus: normalizeConnectionStatus(body?.connectionStatus ?? body?.connection_status),
        capabilities: normalizeCapabilities(body?.capabilities),
        installedAt: dateOrUndefined(body?.installedAt ?? body?.installed_at) ?? undefined,
        lastSeenAt: dateOrUndefined(body?.lastSeenAt ?? body?.last_seen_at),
        retiredAt:
          body?.retiredAt !== undefined || body?.retired_at !== undefined
            ? dateOrUndefined(body?.retiredAt ?? body?.retired_at)
            : nextStatus === 'RETIRED' && existing.status !== 'RETIRED'
              ? new Date()
              : nextStatus !== 'RETIRED'
                ? null
                : undefined,
        notes: nullableText(body?.notes),
        provisionedAt: dateOrUndefined(body?.provisionedAt ?? body?.provisioned_at),
        provisionedBy: nullableText(body?.provisionedBy ?? body?.provisioned_by),
        pairingTokenHash: nullableText(body?.pairingTokenHash ?? body?.pairing_token_hash),
        pairingTokenExpiresAt: dateOrUndefined(body?.pairingTokenExpiresAt ?? body?.pairing_token_expires_at),
      },
      include: includeDeviceRelations,
    })

    if (nextStatus !== existing.status || nextConnectionStatus !== existing.connectionStatus) {
      await runOperationalIntelligenceForSchool(existing.schoolId)
    }

    return Response.json({ device })
  } catch (error) {
    return authResponseError(error)
  }
}
