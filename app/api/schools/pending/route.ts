import { listPendingSchools } from '@/lib/schools/workflow'

export async function GET() {
  return listPendingSchools()
}
