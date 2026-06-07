import { assertSameSchool, getTenantFilter } from '@/lib/academic/access'
import { authResponseError } from '@/lib/auth/session'
import { reportInclude } from '@/lib/communication/api'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reportId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { reportId } = await params
    const report = await prisma.reportDefinition.findUniqueOrThrow({
      where: { id: reportId },
      include: reportInclude,
    })
    assertSameSchool(auth, report.schoolId)

    return Response.json({ report })
  } catch (error) {
    return authResponseError(error)
  }
}
