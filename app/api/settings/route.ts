import { authResponseError, requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import {
  clampNumber,
  defaultSchoolSettings,
  normalizeLanguage,
  optionalBoolean,
} from '@/lib/settings/defaults'

function requestedSchoolId(auth: Awaited<ReturnType<typeof requireAuth>>, request: Request, body?: Record<string, unknown> | null) {
  if (auth.role === 'SCHOOL_ADMIN') return auth.schoolId!

  const url = new URL(request.url)
  const schoolId = String(body?.schoolId ?? body?.school_id ?? url.searchParams.get('schoolId') ?? '').trim()
  if (!schoolId) throw new Response('schoolId is required for SuperAdmin settings requests', { status: 400 })
  return schoolId
}

async function ensureSettings(schoolId: string) {
  return prisma.schoolSettings.upsert({
    where: { schoolId },
    update: {},
    create: {
      schoolId,
      ...defaultSchoolSettings,
    },
  })
}

export async function GET(request: Request) {
  try {
    const auth = await requireAuth()
    const schoolId = requestedSchoolId(auth, request)
    const settings = await ensureSettings(schoolId)

    return Response.json({ settings })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAuth()
    const body = await request.json().catch(() => null)
    const schoolId = requestedSchoolId(auth, request, body)

    await ensureSettings(schoolId)

    const language = normalizeLanguage(body?.language)
    const noiseThresholdDb = clampNumber(body?.noiseThresholdDb ?? body?.noise_threshold_db, 40, 100)
    const noiseDurationSeconds = clampNumber(
      body?.noiseDurationSeconds ?? body?.noise_duration_seconds,
      1,
      120,
    )
    const studentExitLimitMinutes = clampNumber(
      body?.studentExitLimitMinutes ?? body?.student_exit_limit_minutes,
      5,
      30,
    )
    const lateThresholdMinutes = clampNumber(
      body?.lateThresholdMinutes ?? body?.late_threshold_minutes,
      0,
      60,
    )
    const lateStudentThreshold = clampNumber(body?.lateStudentThreshold ?? body?.late_student_threshold, 1, 50)
    const movementThreshold = clampNumber(body?.movementThreshold ?? body?.movement_threshold, 1, 50)
    const noiseEventThreshold = clampNumber(body?.noiseEventThreshold ?? body?.noise_event_threshold, 1, 100)
    const deviceOfflineThreshold = clampNumber(body?.deviceOfflineThreshold ?? body?.device_offline_threshold, 1, 30)

    const settings = await prisma.schoolSettings.update({
      where: { schoolId },
      data: {
        language,
        noiseThresholdDb,
        noiseDurationSeconds,
        studentExitLimitMinutes,
        lateThresholdMinutes,
        lateStudentThreshold,
        movementThreshold,
        noiseEventThreshold,
        deviceOfflineThreshold,
        noiseAlertsEnabled: optionalBoolean(body?.noiseAlertsEnabled ?? body?.noise_alerts_enabled),
        movementAlertsEnabled: optionalBoolean(body?.movementAlertsEnabled ?? body?.movement_alerts_enabled),
        attendanceAlertsEnabled: optionalBoolean(body?.attendanceAlertsEnabled ?? body?.attendance_alerts_enabled),
        deviceAlertsEnabled: optionalBoolean(body?.deviceAlertsEnabled ?? body?.device_alerts_enabled),
        dailyReportEnabled: optionalBoolean(body?.dailyReportEnabled ?? body?.daily_report_enabled),
        schoolNameOverride:
          body?.schoolNameOverride === undefined && body?.school_name_override === undefined
            ? undefined
            : String(body?.schoolNameOverride ?? body?.school_name_override ?? '').trim() || null,
        contactPhone:
          body?.contactPhone === undefined && body?.contact_phone === undefined
            ? undefined
            : String(body?.contactPhone ?? body?.contact_phone ?? '').trim() || null,
      },
    })

    return Response.json({ settings })
  } catch (error) {
    return authResponseError(error)
  }
}
