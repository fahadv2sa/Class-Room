export type Level = 'primary' | 'middle' | 'high'

export type NoiseStatus = 'quiet' | 'medium' | 'loud'

export const levels: Array<{
  id: Level
  ar: string
  en: string
  code: 'P' | 'M' | 'H'
  short: string
  grades: number[]
}> = [
  { id: 'primary', ar: 'المرحلة الابتدائية', en: 'Primary School', code: 'P', short: 'ابتدائي', grades: [1, 2, 3, 4, 5, 6] },
  { id: 'middle', ar: 'المرحلة المتوسطة', en: 'Middle School', code: 'M', short: 'متوسط', grades: [1, 2, 3] },
  { id: 'high', ar: 'المرحلة الثانوية', en: 'High School', code: 'H', short: 'ثانوي', grades: [1, 2, 3] },
]

export const levelMap = Object.fromEntries(levels.map((level) => [level.id, level])) as Record<Level, (typeof levels)[number]>

export const fallbackSchool = 'مدرسة الملك فهد'
export const fallbackDistrict = 'إدارة تعليم الرياض'

export function levelType(level: Level) {
  return level === 'primary' ? 'PRIMARY' : level === 'middle' ? 'MIDDLE' : 'HIGH'
}

export function noiseStatus(value: number): NoiseStatus {
  if (value < 50) return 'quiet'
  if (value < 70) return 'medium'
  return 'loud'
}

export const noiseStatusMeta: Record<NoiseStatus, { label: string; color: string }> = {
  quiet: { label: 'هادئ', color: '#22c55e' },
  medium: { label: 'متوسط', color: '#f59e0b' },
  loud: { label: 'مرتفع', color: '#ef4444' },
}
