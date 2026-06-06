import type {
  AttendanceSessionStatus,
  RFIDScanDirection,
  RFIDScanStatus,
  StudentAttendanceStatus,
} from '@prisma/client'

export const attendanceSessionInclude = {
  classroom: {
    select: {
      id: true,
      classroomCode: true,
      classroomName: true,
      level: { select: { levelType: true, displayName: true } },
    },
  },
  classroomDevice: {
    select: { id: true, deviceCode: true },
  },
  teacher: {
    select: { id: true, fullNameAr: true, fullNameEn: true, cardCode: true },
  },
  _count: {
    select: { records: true },
  },
}

export const attendanceRecordInclude = {
  student: {
    select: {
      id: true,
      fullNameAr: true,
      fullNameEn: true,
      cardCode: true,
    },
  },
  classroom: {
    select: {
      id: true,
      classroomCode: true,
      classroomName: true,
      level: { select: { levelType: true, displayName: true } },
    },
  },
  attendanceSession: {
    select: {
      id: true,
      sessionDate: true,
      status: true,
      openedAt: true,
      closedAt: true,
    },
  },
}

export const rfidScanEventInclude = {
  classroom: {
    select: { id: true, classroomCode: true, classroomName: true },
  },
  classroomDevice: {
    select: { id: true, deviceCode: true },
  },
  cardCredential: {
    select: { id: true, holderType: true, status: true },
  },
  student: {
    select: { id: true, fullNameAr: true, fullNameEn: true, cardCode: true },
  },
  teacher: {
    select: { id: true, fullNameAr: true, fullNameEn: true, cardCode: true },
  },
}

export function normalizeAttendanceSessionStatus(value: unknown): AttendanceSessionStatus | undefined {
  const status = String(value ?? '').trim().toUpperCase()
  if (status === 'OPEN' || status === 'CLOSED') return status
  return undefined
}

export function normalizeAttendanceRecordStatus(value: unknown): StudentAttendanceStatus | undefined {
  const status = String(value ?? '').trim().toUpperCase()
  if (status === 'ABSENT' || status === 'PRESENT' || status === 'LATE' || status === 'EXCUSED') return status
  return undefined
}

export function normalizeRFIDScanStatus(value: unknown): RFIDScanStatus | undefined {
  const status = String(value ?? '').trim().toUpperCase()
  if (
    status === 'ACCEPTED' ||
    status === 'DUPLICATE_IGNORED' ||
    status === 'UNKNOWN_CARD' ||
    status === 'INACTIVE_CARD' ||
    status === 'WRONG_SCHOOL' ||
    status === 'WRONG_CLASSROOM' ||
    status === 'NO_ACTIVE_SESSION'
  ) {
    return status
  }
  return undefined
}

export function normalizeRFIDDirection(value: unknown): RFIDScanDirection | undefined {
  const direction = String(value ?? '').trim().toUpperCase()
  if (direction === 'ENTRY' || direction === 'EXIT' || direction === 'UNKNOWN') return direction
  return undefined
}

export function dateOnlyOrUndefined(value: unknown) {
  if (!value) return undefined
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) throw new Response('Invalid date value', { status: 400 })
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

export function dateOrUndefined(value: unknown) {
  if (!value) return undefined
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) throw new Response('Invalid date value', { status: 400 })
  return date
}
