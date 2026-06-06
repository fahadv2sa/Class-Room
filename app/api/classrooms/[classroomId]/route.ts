import { authResponseError } from '@/lib/auth/session'
import { assertSameSchool, boolOrUndefined, getTenantFilter } from '@/lib/academic/access'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ classroomId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { classroomId } = await params

    const classroom = await prisma.classroom.findUniqueOrThrow({
      where: { id: classroomId },
    })
    assertSameSchool(auth, classroom.schoolId)

    return Response.json({ classroom })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ classroomId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { classroomId } = await params
    const body = await request.json().catch(() => null)

    const existing = await prisma.classroom.findUniqueOrThrow({
      where: { id: classroomId },
    })
    assertSameSchool(auth, existing.schoolId)

    const classroom = await prisma.classroom.update({
      where: { id: classroomId },
      data: {
        classroomName: body?.classroomName ?? body?.classroom_name,
        isActive: boolOrUndefined(body?.isActive ?? body?.is_active),
      },
    })

    return Response.json({ classroom })
  } catch (error) {
    return authResponseError(error)
  }
}
