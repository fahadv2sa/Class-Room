import type { Level, NoiseStatus } from '@/lib/levels'

export type TFunction = (key: string) => string

export const levelNameKey: Record<Level, string> = {
  primary: 'level.primary',
  middle: 'level.middle',
  high: 'level.high',
}

export const levelShortKey: Record<Level, string> = {
  primary: 'level.primary',
  middle: 'level.middle',
  high: 'level.high',
}

export const noiseStatusKey: Record<NoiseStatus, string> = {
  quiet: 'noise.quiet',
  medium: 'noise.medium',
  loud: 'noise.loud',
}

export function percent(value: number | string, t: TFunction) {
  return `${value}${t('common.percent')}`
}

export function minutes(value: number | string, t: TFunction) {
  return `${value} ${t('common.minutesShort')}`
}

export function sectionLabel(section: string, t: TFunction) {
  return `${t('classrooms.gradeSection')} ${section}`
}

export function classroomCount(count: number, level: Level, t: TFunction) {
  return `${count} ${t('classrooms.subtitle')} ${t(levelNameKey[level])}`
}

export function withLevel(prefixKey: string, level: Level, t: TFunction) {
  return `${t(prefixKey)} · ${t(levelNameKey[level])}`
}
