import { assertSameSchool, getTenantFilter } from '@/lib/academic/access'
import { aiSummaryInclude } from '@/lib/ai/foundation'
import { authResponseError } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ summaryId: string }> },
) {
  try {
    const { auth } = await getTenantFilter()
    const { summaryId } = await params
    const summary = await prisma.aISummary.findUniqueOrThrow({
      where: { id: summaryId },
      include: aiSummaryInclude,
    })
    assertSameSchool(auth, summary.schoolId)
    return Response.json({ summary })
  } catch (error) {
    return authResponseError(error)
  }
}
