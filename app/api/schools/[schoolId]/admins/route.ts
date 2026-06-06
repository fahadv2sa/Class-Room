import { hashPassword } from '@/lib/auth/password'
import { authResponseError, requireSchoolAccess, requireSuperAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  try {
    const { schoolId } = await params
    await requireSchoolAccess(schoolId)

    const admins = await prisma.schoolAdmin.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        schoolId: true,
        email: true,
        fullName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return Response.json({ admins })
  } catch (error) {
    return authResponseError(error)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  try {
    await requireSuperAdmin()
    const { schoolId } = await params
    const body = await request.json().catch(() => null)
    const email = String(body?.email ?? '').trim().toLowerCase()
    const fullName = String(body?.fullName ?? '').trim()
    const password = String(body?.password ?? '')

    if (!email || !fullName || !password) {
      return Response.json({ error: 'Email, fullName, and password are required' }, { status: 400 })
    }

    const admin = await prisma.schoolAdmin.create({
      data: {
        schoolId,
        email,
        fullName,
        passwordHash: hashPassword(password),
        isActive: body?.isActive ?? true,
      },
      select: {
        id: true,
        schoolId: true,
        email: true,
        fullName: true,
        isActive: true,
        createdAt: true,
      },
    })

    return Response.json({ admin }, { status: 201 })
  } catch (error) {
    return authResponseError(error)
  }
}
