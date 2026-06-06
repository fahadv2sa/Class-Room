import { type AuthContext, requireAuth } from '@/lib/auth/session'

export async function getTenantFilter() {
  const auth = await requireAuth()
  return {
    auth,
    schoolId: auth.role === 'SCHOOL_ADMIN' ? auth.schoolId : null,
  }
}

export function scopedSchoolId(auth: AuthContext, requestedSchoolId?: string | null) {
  if (auth.role === 'SCHOOL_ADMIN') return auth.schoolId!
  return requestedSchoolId ?? null
}

export function requireWritableSchoolId(auth: AuthContext, requestedSchoolId?: string | null) {
  const schoolId = scopedSchoolId(auth, requestedSchoolId)
  if (!schoolId) {
    throw new Response('schoolId is required for SuperAdmin requests', { status: 400 })
  }
  return schoolId
}

export function assertSameSchool(auth: AuthContext, schoolId: string) {
  if (auth.role === 'SCHOOL_ADMIN' && auth.schoolId !== schoolId) {
    throw new Response('Forbidden', { status: 403 })
  }
}

export function boolOrUndefined(value: unknown) {
  return typeof value === 'boolean' ? value : undefined
}

export function dateOrUndefined(value: unknown) {
  if (!value) return undefined
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) {
    throw new Response('Invalid date value', { status: 400 })
  }
  return date
}

export function requiredString(value: unknown, field: string) {
  const text = String(value ?? '').trim()
  if (!text) throw new Response(`${field} is required`, { status: 400 })
  return text
}
