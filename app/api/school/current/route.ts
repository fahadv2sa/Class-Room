import { authResponseError, requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const auth = await requireAuth()

    if (auth.role === 'SCHOOL_ADMIN') {
      const school = await prisma.school.findUniqueOrThrow({
        where: { id: auth.schoolId! },
        include: {
          settings: true,
        },
      })
      const effectiveName = school.settings?.schoolNameOverride || school.name

      return Response.json({
        scope: 'school',
        school: {
          id: school.id,
          schoolCode: school.schoolCode,
          name: effectiveName,
          logoUrl: school.logoUrl,
          city: school.city,
          country: school.country,
          subscriptionPlan: school.subscriptionPlan,
          subscriptionStatus: school.subscriptionStatus,
          status: school.status,
        },
        district: `${school.city}, ${school.country}`,
      })
    }

    const schools = await prisma.school.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
      take: 1,
      include: {
        settings: true,
      },
    })

    const firstSchool = schools[0] ?? null
    const school = firstSchool
      ? {
          id: firstSchool.id,
          schoolCode: firstSchool.schoolCode,
          name: firstSchool.settings?.schoolNameOverride || firstSchool.name,
          logoUrl: firstSchool.logoUrl,
          city: firstSchool.city,
          country: firstSchool.country,
          subscriptionPlan: firstSchool.subscriptionPlan,
          subscriptionStatus: firstSchool.subscriptionStatus,
          status: firstSchool.status,
        }
      : null

    return Response.json({
      scope: 'all',
      school,
      district: firstSchool ? `${firstSchool.city}, ${firstSchool.country}` : 'All schools',
    })
  } catch (error) {
    return authResponseError(error)
  }
}
