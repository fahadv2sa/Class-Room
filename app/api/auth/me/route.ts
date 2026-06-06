import { getAuthContext } from '@/lib/auth/session'

export async function GET() {
  const auth = await getAuthContext()

  if (!auth) {
    return Response.json({ user: null }, { status: 401 })
  }

  return Response.json({
    user: {
      id: auth.userId,
      email: auth.email,
      fullName: auth.fullName,
      role: auth.role,
      schoolId: auth.schoolId,
    },
  })
}
