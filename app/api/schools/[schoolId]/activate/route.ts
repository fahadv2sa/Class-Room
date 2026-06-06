import { updateSchoolStatus } from '@/lib/schools/workflow'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const { schoolId } = await params
  return updateSchoolStatus(schoolId, 'activate')
}
