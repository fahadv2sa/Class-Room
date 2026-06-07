import { assertSameSchool, getTenantFilter } from '@/lib/academic/access'
import { authResponseError } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ automationDefinitionId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { automationDefinitionId } = await params
    const automationDefinition = await prisma.automationDefinition.findUniqueOrThrow({
      where: { id: automationDefinitionId },
    })
    assertSameSchool(auth, automationDefinition.schoolId)
    return Response.json({ automationDefinition })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ automationDefinitionId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { automationDefinitionId } = await params
    const body = await request.json().catch(() => null)
    const existing = await prisma.automationDefinition.findUniqueOrThrow({
      where: { id: automationDefinitionId },
    })
    assertSameSchool(auth, existing.schoolId)

    const automationDefinition = await prisma.automationDefinition.update({
      where: { id: automationDefinitionId },
      data: {
        isActive: typeof body?.isActive === 'boolean' ? body.isActive : existing.isActive,
      },
    })

    return Response.json({ automationDefinition })
  } catch (error) {
    return authResponseError(error)
  }
}
