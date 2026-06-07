import { getTenantFilter } from '@/lib/academic/access'
import { authResponseError } from '@/lib/auth/session'
import {
  deliveryPreferenceUpdate,
  ensureCommunicationSettings,
  requireCommunicationSchoolId,
} from '@/lib/communication/api'
import { prisma } from '@/lib/prisma'

const preferenceSelect = {
  schoolId: true,
  dashboardNotificationsEnabled: true,
  emailNotificationsEnabled: true,
  whatsappNotificationsEnabled: true,
  dailyReportEnabled: true,
  updatedAt: true,
}

export async function GET(request: Request) {
  try {
    const { auth } = await getTenantFilter()
    const url = new URL(request.url)
    const schoolId = requireCommunicationSchoolId(auth, url.searchParams.get('schoolId'))
    await ensureCommunicationSettings(schoolId)

    const preferences = await prisma.schoolSettings.findUniqueOrThrow({
      where: { schoolId },
      select: preferenceSelect,
    })

    return Response.json({ preferences })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const { auth } = await getTenantFilter()
    const body = await request.json().catch(() => null)
    const url = new URL(request.url)
    const schoolId = requireCommunicationSchoolId(
      auth,
      String(body?.schoolId ?? body?.school_id ?? url.searchParams.get('schoolId') ?? '').trim() || null,
    )
    await ensureCommunicationSettings(schoolId)

    const preferences = await prisma.schoolSettings.update({
      where: { schoolId },
      data: deliveryPreferenceUpdate(body),
      select: preferenceSelect,
    })

    return Response.json({ preferences })
  } catch (error) {
    return authResponseError(error)
  }
}
