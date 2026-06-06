import type { Gender, StudentStatus, TeacherStatus } from '@prisma/client'

export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

export function parsePagination(url: URL) {
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(url.searchParams.get('pageSize') ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE),
  )

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  }
}

export function paginationMeta(total: number, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  }
}

export function textOrUndefined(value: unknown) {
  const text = String(value ?? '').trim()
  return text || undefined
}

export function nullableText(value: unknown) {
  if (value === undefined) return undefined
  const text = String(value ?? '').trim()
  return text || null
}

export function normalizeGender(value: unknown): Gender | undefined {
  const gender = String(value ?? '').trim().toUpperCase()
  if (gender === 'MALE' || gender === 'FEMALE') return gender
  return undefined
}

export function requireGender(value: unknown): Gender {
  const gender = normalizeGender(value)
  if (!gender) throw new Response('gender must be MALE or FEMALE', { status: 400 })
  return gender
}

export function normalizeTeacherStatus(value: unknown): TeacherStatus | undefined {
  const status = String(value ?? '').trim().toUpperCase()
  if (status === 'ACTIVE' || status === 'INACTIVE') return status
  return undefined
}

export function normalizeStudentStatus(value: unknown): StudentStatus | undefined {
  const status = String(value ?? '').trim().toUpperCase()
  if (status === 'ACTIVE' || status === 'INACTIVE' || status === 'GRADUATED' || status === 'TRANSFERRED') {
    return status
  }
  return undefined
}

export function cardCode(prefix: 'STD' | 'TCH', sequence: number) {
  return `${prefix}-${String(sequence).padStart(8, '0')}`
}

export function parseCardSequence(value: string, prefix: 'STD' | 'TCH') {
  const match = value.match(new RegExp(`^${prefix}-(\\d{8})$`))
  return match ? Number(match[1]) : 0
}

export function requireCardCode(value: unknown, prefix: 'STD' | 'TCH') {
  const code = String(value ?? '').trim().toUpperCase()
  if (!new RegExp(`^${prefix}-\\d{8}$`).test(code)) {
    throw new Response(`cardCode must use ${prefix}-######## format`, { status: 400 })
  }
  return code
}

export function dateOrNull(value: unknown) {
  if (value === undefined) return undefined
  if (value === null || value === '') return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) throw new Response('Invalid date value', { status: 400 })
  return date
}
