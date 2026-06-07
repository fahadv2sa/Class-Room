import type { Prisma } from '@prisma/client'
import { getTenantFilter, scopedSchoolId } from '@/lib/academic/access'
import {
  ensureAutomationDefinitions,
  requireAISchoolId,
} from '@/lib/ai/foundation'
import { authResponseError } from '@/lib/auth/session'
import { paginationMeta, parsePagination } from '@/lib/people/api'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { auth } = await getTenantFilter()
    const url = new URL(request.url)
    const schoolId = scopedSchoolId(auth, url.searchParams.get('schoolId'))
    const { page, pageSize, skip, take } = parsePagination(url)

    const where: Prisma.AutomationDefinitionWhereInput = {
      ...(schoolId ? { schoolId } : {}),
    }
    const [automationDefinitions, total] = await Promise.all([
      prisma.automationDefinition.findMany({
        where,
        orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
        skip,
        take,
      }),
      prisma.automationDefinition.count({ where }),
    ])

    return Response.json({ automationDefinitions, meta: paginationMeta(total, page, pageSize) })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function POST(request: Request) {
  try {
    const { auth } = await getTenantFilter()
    const body = await request.json().catch(() => null)
    const schoolId = requireAISchoolId(auth, body?.schoolId)

    await ensureAutomationDefinitions(schoolId)

    const automationDefinitions = await prisma.automationDefinition.findMany({
      where: { schoolId },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
    })

    return Response.json({ automationDefinitions })
  } catch (error) {
    return authResponseError(error)
  }
}
