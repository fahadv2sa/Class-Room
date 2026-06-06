import type { AlertStatus, InsightStatus } from '@prisma/client'
import { normalizeEnum } from '@/lib/intelligence/rules'

export const includeAlertRelations = {
  school: { select: { id: true, schoolCode: true, name: true } },
  classroom: { select: { id: true, classroomCode: true, classroomName: true } },
  teacher: { select: { id: true, fullNameAr: true, fullNameEn: true } },
  student: { select: { id: true, fullNameAr: true, fullNameEn: true, studentNumber: true } },
  device: { select: { id: true, deviceCode: true, connectionStatus: true } },
}

export const includeInsightRelations = {
  school: { select: { id: true, schoolCode: true, name: true } },
  classroom: { select: { id: true, classroomCode: true, classroomName: true } },
  teacher: { select: { id: true, fullNameAr: true, fullNameEn: true } },
  student: { select: { id: true, fullNameAr: true, fullNameEn: true, studentNumber: true } },
}

export function normalizeAlertStatus(value: unknown): AlertStatus | undefined {
  return normalizeEnum(String(value ?? ''), ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'])
}

export function normalizeInsightStatus(value: unknown): InsightStatus | undefined {
  return normalizeEnum(String(value ?? ''), ['ACTIVE', 'DISMISSED', 'RESOLVED'])
}
