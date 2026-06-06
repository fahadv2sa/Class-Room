import type { ClassroomDeviceStatus, ConnectionStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { nullableText } from '@/lib/people/api'

export const DEFAULT_DEVICE_CAPABILITIES = [
  'RFID',
  'NOISE_MONITORING',
  'LED_INDICATORS',
  'FIRMWARE_UPDATES',
]

export function normalizeDeviceCode(value: unknown) {
  return String(value ?? '').trim().toUpperCase()
}

export function requireDeviceCode(value: unknown) {
  const code = normalizeDeviceCode(value)
  if (!/^CRD-\d{8}$/.test(code)) {
    throw new Response('deviceCode must use CRD-######## format', { status: 400 })
  }
  return code
}

export function parseDeviceSequence(value: string) {
  const match = value.match(/^CRD-(\d{8})$/)
  return match ? Number(match[1]) : 0
}

export function deviceCode(sequence: number) {
  return `CRD-${String(sequence).padStart(8, '0')}`
}

export async function nextDeviceCode() {
  const latest = await prisma.classroomDevice.findFirst({
    orderBy: { deviceCode: 'desc' },
    select: { deviceCode: true },
  })
  return deviceCode(parseDeviceSequence(latest?.deviceCode ?? '') + 1)
}

export function normalizeDeviceStatus(value: unknown): ClassroomDeviceStatus | undefined {
  const status = String(value ?? '').trim().toUpperCase()
  if (status === 'ACTIVE' || status === 'MAINTENANCE' || status === 'RETIRED') return status
  return undefined
}

export function normalizeConnectionStatus(value: unknown): ConnectionStatus | undefined {
  const status = String(value ?? '').trim().toUpperCase()
  if (status === 'ONLINE' || status === 'OFFLINE' || status === 'UNKNOWN') return status
  return undefined
}

export function dateOrUndefined(value: unknown) {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) throw new Response('Invalid date value', { status: 400 })
  return date
}

export function normalizeCapabilities(value: unknown) {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) {
    throw new Response('capabilities must be an array of strings', { status: 400 })
  }
  return value
    .map((item) => String(item ?? '').trim().toUpperCase())
    .filter(Boolean)
}

export async function assertClassroomBelongsToSchool(classroomId: string, schoolId: string) {
  const classroom = await prisma.classroom.findUniqueOrThrow({
    where: { id: classroomId },
    select: { id: true, schoolId: true },
  })

  if (classroom.schoolId !== schoolId) {
    throw new Response('classroomId must belong to the selected school', { status: 400 })
  }

  return classroom
}

export async function assertNoOtherActiveDevice(classroomId: string, currentDeviceId?: string) {
  const activeDevice = await prisma.classroomDevice.findFirst({
    where: {
      classroomId,
      status: 'ACTIVE',
      ...(currentDeviceId ? { id: { not: currentDeviceId } } : {}),
    },
    select: { id: true },
  })

  if (activeDevice) {
    throw new Response('classroom already has an active Class-Room Device', { status: 409 })
  }
}

export function nullableProvisioningText(value: unknown) {
  return nullableText(value)
}
