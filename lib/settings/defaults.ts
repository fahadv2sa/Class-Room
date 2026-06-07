import type { Language } from '@prisma/client'

export const allAlertTypes = [
  'STUDENT_LATE',
  'STUDENT_ABSENT',
  'EXCESSIVE_STUDENT_EXITS',
  'HIGH_NOISE_EVENT',
  'DEVICE_OFFLINE',
] as const

export const allInsightTypes = [
  'RECURRING_STUDENT_LATENESS',
  'EXCESSIVE_STUDENT_MOVEMENT',
  'CHRONIC_CLASSROOM_NOISE',
  'DEVICE_RELIABILITY_ISSUE',
] as const

export const defaultSchoolSettings = {
  language: 'AR' as Language,
  noiseThresholdDb: 70,
  noiseDurationSeconds: 10,
  studentExitLimitMinutes: 10,
  lateThresholdMinutes: 10,
  lateStudentThreshold: 5,
  movementThreshold: 3,
  noiseEventThreshold: 3,
  deviceOfflineThreshold: 3,
  noiseAlertsEnabled: true,
  movementAlertsEnabled: true,
  attendanceAlertsEnabled: true,
  deviceAlertsEnabled: true,
  dailyReportEnabled: false,
  dashboardNotificationsEnabled: true,
  emailNotificationsEnabled: false,
  whatsappNotificationsEnabled: false,
  schoolNameOverride: null,
  contactPhone: '0112345678',
  enabledAlertTypes: [...allAlertTypes],
  enabledInsightTypes: [...allInsightTypes],
}

export function normalizeLanguage(value: unknown): Language | undefined {
  const language = String(value ?? '').trim().toUpperCase()
  if (language === 'AR' || language === 'EN') return language
  if (language === 'ar') return 'AR'
  if (language === 'en') return 'EN'
  return undefined
}

export function clampNumber(value: unknown, min: number, max: number) {
  if (value === undefined || value === null || value === '') return undefined
  const next = Number(value)
  if (!Number.isFinite(next)) return undefined
  return Math.min(max, Math.max(min, Math.round(next)))
}

export function optionalBoolean(value: unknown) {
  return typeof value === 'boolean' ? value : undefined
}

export function normalizeAlertTypes(value: unknown) {
  return normalizeStringArray(value, allAlertTypes)
}

export function normalizeInsightTypes(value: unknown) {
  return normalizeStringArray(value, allInsightTypes)
}

function normalizeStringArray<T extends string>(value: unknown, allowed: readonly T[]) {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) throw new Response('Value must be an array', { status: 400 })

  const normalized = value.map((item) => String(item ?? '').trim().toUpperCase())
  const unique = Array.from(new Set(normalized))
  const invalid = unique.filter((item) => !allowed.includes(item as T))
  if (invalid.length) throw new Response(`Unsupported type: ${invalid.join(', ')}`, { status: 400 })
  return unique as T[]
}
