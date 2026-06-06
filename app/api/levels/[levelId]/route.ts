import { authResponseError } from '@/lib/auth/session'
import { assertSameSchool, boolOrUndefined, getTenantFilter } from '@/lib/academic/access'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ levelId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { levelId } = await params

    const level = await prisma.schoolLevel.findUniqueOrThrow({
      where: { id: levelId },
    })
    assertSameSchool(auth, level.schoolId)

    return Response.json({ level })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ levelId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { levelId } = await params
    const body = await request.json().catch(() => null)

    const existing = await prisma.schoolLevel.findUniqueOrThrow({
      where: { id: levelId },
    })
    assertSameSchool(auth, existing.schoolId)

    const level = await prisma.schoolLevel.update({
      where: { id: levelId },
      data: {
        displayName: body?.displayName ?? body?.display_name,
        isActive: boolOrUndefined(body?.isActive ?? body?.is_active),
      },
    })

    return Response.json({ level })
  } catch (error) {
    return authResponseError(error)
  }
}
