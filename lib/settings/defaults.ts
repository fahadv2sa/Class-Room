import type { Language } from '@prisma/client'

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
  schoolNameOverride: null,
  contactPhone: '0112345678',
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
