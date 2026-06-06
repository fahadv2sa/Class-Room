import type { MovementStatus, TeacherMovementStatus } from '@prisma/client'

export function normalizeLevel(value: unknown) {
  const level = String(value ?? '').trim().toUpperCase()
  if (level === 'PRIMARY' || level === 'MIDDLE' || level === 'HIGH') return level
  return undefined
}

export function normalizeMovementStatus(value: unknown): MovementStatus | undefined {
  const status = String(value ?? '').trim().toUpperCase()
  if (status === 'OPEN' || status === 'CLOSED') return status
  return undefined
}

export function normalizeTeacherMovementStatus(value: unknown): TeacherMovementStatus | undefined {
  const status = String(value ?? '').trim().toUpperCase()
  if (status === 'INSIDE' || status === 'OUTSIDE') return status
  return undefined
}

export const studentMovementInclude = {
  student: {
    select: { id: true, fullNameAr: true, fullNameEn: true, cardCode: true },
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
    select: { id: true, openedAt: true, sessionDate: true, status: true },
  },
}

export const teacherMovementInclude = {
  teacher: {
    select: { id: true, fullNameAr: true, fullNameEn: true, cardCode: true },
  },
  classroom: {
    select: {
      id: true,
      classroomCode: true,
      classroomName: true,
      level: { select: { levelType: true, displayName: true } },
    },
  },
}
