import { authResponseError } from '@/lib/auth/session'
import { getTenantFilter } from '@/lib/academic/access'
import { processNoiseReading } from '@/lib/noise/api'

export async function POST(request: Request) {
  try {
    const { auth } = await getTenantFilter()
    const body = await request.json().catch(() => null)
    const result = await processNoiseReading({
      auth,
      classroomDeviceId: body?.classroomDeviceId ?? body?.classroom_device_id,
      deviceCode: body?.deviceCode ?? body?.device_code,
      currentDb: body?.currentDb ?? body?.current_db,
      measuredAt: body?.measuredAt ?? body?.measured_at,
    })

    return Response.json(result, { status: 201 })
  } catch (error) {
    return authResponseError(error)
  }
}
