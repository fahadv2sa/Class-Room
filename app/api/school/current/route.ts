import { authResponseError, requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const auth = await requireAuth()

    if (auth.role === 'SCHOOL_ADMIN') {
      const school = await prisma.school.findUniqueOrThrow({
        where: { id: auth.schoolId! },
        select: {
          id: true,
          schoolCode: true,
          name: true,
          logoUrl: true,
          city: true,
          country: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          status: true,
        },
      })

      return Response.json({
        scope: 'school',
        school,
        district: `${school.city}, ${school.country}`,
      })
    }

    const schools = await prisma.school.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
      take: 1,
      select: {
        id: true,
        schoolCode: true,
        name: true,
        logoUrl: true,
        city: true,
        country: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        status: true,
      },
    })

    const school = schools[0] ?? null

    return Response.json({
      scope: 'all',
      school,
      district: school ? `${school.city}, ${school.country}` : 'All schools',
    })
  } catch (error) {
    return authResponseError(error)
  }
}
