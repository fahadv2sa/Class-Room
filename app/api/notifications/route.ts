import type { Prisma } from '@prisma/client'
import { getTenantFilter } from '@/lib/academic/access'
import { authResponseError } from '@/lib/auth/session'
import {
  communicationSchoolId,
  materializeCommunicationRecords,
  normalizeNotificationChannel,
  normalizeNotificationStatus,
  normalizeNotificationType,
  notificationInclude,
} from '@/lib/communication/api'
import { paginationMeta, parsePagination } from '@/lib/people/api'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { auth } = await getTenantFilter()
    const url = new URL(request.url)
    const requestedSchoolId = url.searchParams.get('schoolId')
    const schoolId = communicationSchoolId(auth, requestedSchoolId)
    const status = normalizeNotificationStatus(url.searchParams.get('status'))
    const channel = normalizeNotificationChannel(url.searchParams.get('channel'))
    const type = normalizeNotificationType(url.searchParams.get('type'))
    const alertId = url.searchParams.get('alertId')
    const insightId = url.searchParams.get('insightId')
    const { page, pageSize, skip, take } = parsePagination(url)

    if (schoolId) await materializeCommunicationRecords(schoolId)

    const where: Prisma.NotificationWhereInput = {
      ...(schoolId ? { schoolId } : {}),
      ...(status ? { status } : {}),
      ...(channel ? { notificationChannel: channel } : {}),
      ...(type ? { notificationType: type } : {}),
      ...(alertId ? { alertId } : {}),
      ...(insightId ? { insightId } : {}),
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: notificationInclude,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip,
        take,
      }),
      prisma.notification.count({ where }),
    ])

    return Response.json({ notifications, meta: paginationMeta(total, page, pageSize) })
  } catch (error) {
    return authResponseError(error)
  }
}
