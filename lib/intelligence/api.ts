import { Prisma, type AlertStatus, type AlertType, type InsightStatus, type InsightType } from '@prisma/client'
import type { AuthContext } from '@/lib/auth/session'
import { normalizeEnum } from '@/lib/intelligence/rules'
import { prisma } from '@/lib/prisma'
import { allAlertTypes, allInsightTypes } from '@/lib/settings/defaults'

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

export async function applyAlertVisibility(
  where: Prisma.AlertWhereInput,
  auth: AuthContext,
  includeDisabled: boolean,
) {
  if (auth.role === 'SUPER_ADMIN' || includeDisabled || !auth.schoolId) return where

  const settings = await prisma.schoolSettings.findUnique({
    where: { schoolId: auth.schoolId },
    select: { enabledAlertTypes: true },
  })
  const enabled = (settings?.enabledAlertTypes.length ? settings.enabledAlertTypes : [...allAlertTypes]) as AlertType[]
  const requestedType = typeof where.alertType === 'string' ? where.alertType : null

  return {
    ...where,
    alertType: requestedType ? (enabled.includes(requestedType) ? requestedType : { in: [] }) : { in: enabled },
  } satisfies Prisma.AlertWhereInput
}

export async function applyInsightVisibility(
  where: Prisma.InsightWhereInput,
  auth: AuthContext,
  includeDisabled: boolean,
) {
  if (auth.role === 'SUPER_ADMIN' || includeDisabled || !auth.schoolId) return where

  const settings = await prisma.schoolSettings.findUnique({
    where: { schoolId: auth.schoolId },
    select: { enabledInsightTypes: true },
  })
  const enabled = (settings?.enabledInsightTypes.length ? settings.enabledInsightTypes : [...allInsightTypes]) as InsightType[]
  const requestedType = typeof where.insightType === 'string' ? where.insightType : null

  return {
    ...where,
    insightType: requestedType ? (enabled.includes(requestedType) ? requestedType : { in: [] }) : { in: enabled },
  } satisfies Prisma.InsightWhereInput
}
