// Mock data layer for ClassPulse AI — منصة إدارة الفصول الذكية
// Hierarchy: District → School → School Level → Classroom
// All classroom identifiers use the unified international coding system
// (P1A, M2B, H3C ...). No long Arabic classroom names are used in the UI.

export type Level = 'primary' | 'middle' | 'high'

export type LevelInfo = {
  id: Level
  code: 'P' | 'M' | 'H'
  ar: string
  short: string
  adj: string
  en: string
  grades: number[]
  gradeAr: string[]
}

export const levels: LevelInfo[] = [
  {
    id: 'primary',
    code: 'P',
    ar: 'المرحلة الابتدائية',
    short: 'ابتدائي',
    adj: 'ابتدائي',
    en: 'Primary School',
    grades: [1, 2, 3, 4, 5, 6],
    gradeAr: ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'],
  },
  {
    id: 'middle',
    code: 'M',
    ar: 'المرحلة المتوسطة',
    short: 'متوسط',
    adj: 'متوسط',
    en: 'Middle School',
    grades: [1, 2, 3],
    gradeAr: ['الأول', 'الثاني', 'الثالث'],
  },
  {
    id: 'high',
    code: 'H',
    ar: 'المرحلة الثانوية',
    short: 'ثانوي',
    adj: 'ثانوي',
    en: 'High School',
    grades: [1, 2, 3],
    gradeAr: ['الأول', 'الثاني', 'الثالث'],
  },
]

export const levelMap = Object.fromEntries(
  levels.map((l) => [l.id, l]),
) as Record<Level, LevelInfo>

export const district = 'مدارس الجبيل الدولية'
export const school = 'مدرسة الجبيل الدولية'

const sections = ['A', 'B', 'C']
const sectionAr = ['أ', 'ب', 'ج']

// ---- Noise helpers -------------------------------------------------------
export type NoiseStatus = 'quiet' | 'medium' | 'loud'

export function noiseStatus(value: number): NoiseStatus {
  if (value <= 45) return 'quiet'
  if (value <= 70) return 'medium'
  return 'loud'
}

export const noiseStatusMeta: Record<
  NoiseStatus,
  { label: string; color: string; badge: 'success' | 'warning' | 'danger' }
> = {
  quiet: { label: 'هادئ', color: '#22c55e', badge: 'success' },
  medium: { label: 'متوسط', color: '#f59e0b', badge: 'warning' },
  loud: { label: 'مرتفع', color: '#ef4444', badge: 'danger' },
}

// ---- Deterministic pseudo-random ----------------------------------------
function seeded(n: number) {
  const x = Math.sin(n * 99.13) * 43758.5453
  return x - Math.floor(x)
}
function pick<T>(arr: T[], n: number): T {
  return arr[Math.floor(seeded(n) * arr.length) % arr.length]
}
function between(n: number, min: number, max: number) {
  return Math.floor(seeded(n) * (max - min + 1)) + min
}
const levelIndex: Record<Level, number> = { primary: 0, middle: 1, high: 2 }

// ---- Source pools --------------------------------------------------------
const teacherFirst = ['خالد', 'سعد', 'فهد', 'ناصر', 'عبدالله', 'ماجد', 'تركي', 'بندر', 'عمر', 'سلطان', 'يوسف', 'فيصل']
const teacherLast = ['الحربي', 'القحطاني', 'الدوسري', 'العتيبي', 'الشمري', 'الزهراني', 'المالكي', 'الغامدي', 'العنزي', 'السبيعي', 'الرشيدي', 'الجهني']
const studentFirst = ['محمد', 'عبدالعزيز', 'سلطان', 'فيصل', 'يوسف', 'عمر', 'ريان', 'تركي', 'بدر', 'نواف', 'ماجد', 'سعود', 'أنس', 'زياد', 'راكان', 'مهند', 'وليد', 'هاني']
const studentLast = teacherLast
const updates = ['الآن', 'قبل دقيقة', 'قبل دقيقتين', 'قبل 3 دقائق', 'قبل 4 دقائق']

const primarySubjects = ['القرآن الكريم', 'الرياضيات', 'العلوم', 'لغتي', 'الدراسات الاجتماعية', 'اللغة الإنجليزية', 'التربية الفنية']
const middleSubjects = ['الرياضيات', 'العلوم', 'اللغة العربية', 'الدراسات الاجتماعية', 'اللغة الإنجليزية', 'التربية الإسلامية']
const highSubjects = ['الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'اللغة العربية', 'اللغة الإنجليزية', 'الدراسات الإسلامية']

function subjectsFor(l: Level) {
  return l === 'primary' ? primarySubjects : l === 'middle' ? middleSubjects : highSubjects
}

// ---- Types ---------------------------------------------------------------
export type Teacher = {
  id: string
  name: string
  subject: string
  level: Level
  sessionsToday: number
  avgQuiet: number
  attendanceRate: number
  avgExits: number
  discipline: number
  rank: number
}

export type Classroom = {
  id: string
  name: string // unified code, e.g. P1A
  code: string
  level: Level
  grade: number
  section: string
  stage: string
  adminLabel: string
  teacher: string
  subject: string
  totalStudents: number
  present: number
  absent: number
  outside: number
  noise: number
  deviceStatus: 'online' | 'offline'
  lastUpdate: string
}

export type Student = {
  id: string
  name: string
  cardId: string
  classroom: string // classroom code
  level: Level
  attendanceRate: number
  exits: number
  avgExitDuration: number
  lastMovement: string
  status: 'inside' | 'outside' | 'absent'
}

export type Movement = {
  id: string
  student: string
  classroom: string
  level: Level
  teacher: string
  type: 'دخول' | 'خروج' | 'عودة'
  time: string
  duration: string
  status: 'بإذن' | 'متأخر' | 'لم يعد بعد'
}

export type Alert = {
  id: string
  title: string
  classroom: string
  level: Level
  type: string
  severity: 'low' | 'medium' | 'high' | 'urgent'
  time: string
  resolved: boolean
}

export type Device = {
  id: string
  name: string
  serial: string
  classroom: string
  level: Level
  status: 'online' | 'offline'
  lastData: string
  battery: number
  soundSensor: 'ok' | 'warn' | 'fail'
  cardReader: 'ok' | 'warn' | 'fail'
  firmware: string
}

// ---- Generation ----------------------------------------------------------
export const teachers: Teacher[] = []
let teacherSeq = 1
for (const lvl of levels) {
  const li = levelIndex[lvl.id]
  const count = lvl.id === 'primary' ? 10 : 6
  const pool: Teacher[] = []
  for (let i = 0; i < count; i++) {
    const seed = li * 100 + i + 1
    const name = `${pick(teacherFirst, seed)} ${pick(teacherLast, seed * 3 + 1)}`
    pool.push({
      id: `t${teacherSeq++}`,
      name,
      subject: pick(subjectsFor(lvl.id), seed * 5 + 2),
      level: lvl.id,
      sessionsToday: between(seed * 19, 3, 6),
      avgQuiet: between(seed * 7, 55, 95),
      attendanceRate: between(seed * 11, 82, 98),
      avgExits: Math.round((seeded(seed * 13) * 2 + 0.4) * 10) / 10,
      discipline: between(seed * 17, 55, 96),
      rank: 0,
    })
  }
  pool.sort(
    (a, b) =>
      b.avgQuiet + b.attendanceRate + b.discipline - b.avgExits * 10 -
      (a.avgQuiet + a.attendanceRate + a.discipline - a.avgExits * 10),
  )
  pool.forEach((t, i) => (t.rank = i + 1))
  teachers.push(...pool)
}

export const classrooms: Classroom[] = []
for (const lvl of levels) {
  const li = levelIndex[lvl.id]
  const levelTeachers = teachers.filter((t) => t.level === lvl.id)
  let ci = 0
  for (const g of lvl.grades) {
    sections.forEach((sec, si) => {
      const seed = li * 1000 + g * 10 + si + 1
      const code = `${lvl.code}${g}${sec}`
      const total = between(seed, 22, 30)
      const absent = between(seed * 3, 0, 4)
      const outside = between(seed * 5, 0, 3)
      const noise = between(seed * 7, 32, 88)
      const teacher = levelTeachers[ci % levelTeachers.length]
      classrooms.push({
        id: code.toLowerCase(),
        name: code,
        code,
        level: lvl.id,
        grade: g,
        section: sec,
        stage: lvl.ar,
        adminLabel: `الصف ${lvl.gradeAr[g - 1]} ${lvl.adj} · شعبة ${sectionAr[si]}`,
        teacher: teacher.name,
        subject: pick(subjectsFor(lvl.id), seed * 5),
        totalStudents: total,
        present: total - absent,
        absent,
        outside,
        noise,
        deviceStatus: seeded(seed * 9) > 0.9 ? 'offline' : 'online',
        lastUpdate: pick(updates, seed * 11),
      })
      ci++
    })
  }
}

export const students: Student[] = []
let cardSeq = 10000
classrooms.forEach((c, idx) => {
  for (let i = 0; i < 3; i++) {
    const seed = idx * 10 + i + 1
    const exits = between(seed * 7, 0, 5)
    const status: Student['status'] =
      seeded(seed * 9) > 0.85 ? 'absent' : seeded(seed * 11) > 0.8 ? 'outside' : 'inside'
    students.push({
      id: `s-${c.code}-${i}`,
      name: `${pick(studentFirst, seed)} ${pick(studentLast, seed * 3 + 1)}`,
      cardId: `RF-${cardSeq++}`,
      classroom: c.code,
      level: c.level,
      attendanceRate: between(seed * 5, 72, 99),
      exits,
      avgExitDuration: exits === 0 ? 0 : between(seed * 13, 3, 12),
      lastMovement:
        status === 'absent'
          ? 'غياب'
          : status === 'outside'
            ? `خروج · ${between(seed, 9, 11)}:${String(between(seed * 2, 10, 59)).padStart(2, '0')} ص`
            : `دخول · 07:${String(between(seed * 2, 15, 40)).padStart(2, '0')} ص`,
      status,
    })
  }
})

export const devices: Device[] = classrooms.map((c, idx) => {
  const seed = idx + 1
  const battery = c.deviceStatus === 'offline' ? between(seed * 7, 8, 24) : between(seed * 7, 35, 99)
  return {
    id: `d-${c.code}`,
    name: 'جهاز الفصل',
    serial: `CP-${c.code}-${between(seed * 3, 100, 999)}`,
    classroom: c.code,
    level: c.level,
    status: c.deviceStatus,
    lastData:
      c.deviceStatus === 'offline' ? 'قبل 22 دقيقة' : pick(['قبل ثوانٍ', 'قبل دقيقة', 'قبل دقيقتين', 'الآن'], seed),
    battery,
    soundSensor: battery < 25 ? 'warn' : 'ok',
    cardReader: c.deviceStatus === 'offline' ? 'fail' : seeded(seed * 5) > 0.85 ? 'warn' : 'ok',
    firmware: pick(['v2.4.1', 'v2.4.0', 'v2.3.9'], seed),
  }
})

export const movements: Movement[] = []
for (const lvl of levels) {
  const ss = students.filter((s) => s.level === lvl.id && s.exits > 0).slice(0, 8)
  ss.forEach((s, i) => {
    const cls = classrooms.find((c) => c.code === s.classroom)
    const type: Movement['type'] = s.status === 'outside' ? 'خروج' : i % 2 ? 'عودة' : 'دخول'
    movements.push({
      id: `m-${lvl.id}-${i}`,
      student: s.name,
      classroom: s.classroom,
      level: lvl.id,
      teacher: cls?.teacher ?? '',
      type,
      time: `${between(i + 1, 9, 12)}:${String(between(i + 2, 10, 59)).padStart(2, '0')} ص`,
      duration: type === 'خروج' ? '—' : `${between(i + 3, 4, 9)} د`,
      status: type === 'خروج' ? (i % 2 ? 'لم يعد بعد' : 'متأخر') : 'بإذن',
    })
  })
}

export const alerts: Alert[] = []
let alertSeq = 1
for (const lvl of levels) {
  const cs = classrooms.filter((c) => c.level === lvl.id)
  const loud = [...cs].sort((a, b) => b.noise - a.noise).slice(0, 2)
  const offline = cs.filter((c) => c.deviceStatus === 'offline').slice(0, 1)
  const highExit = [...cs].sort((a, b) => b.outside - a.outside).slice(0, 1)
  loud.forEach((c, i) =>
    alerts.push({
      id: `al${alertSeq++}`,
      title: 'وصل الفصل لمستوى ضوضاء مرتفع',
      classroom: c.code,
      level: lvl.id,
      type: 'ضوضاء',
      severity: i === 0 ? 'urgent' : 'medium',
      time: `${between(alertSeq, 9, 11)}:${String(between(alertSeq * 2, 10, 59)).padStart(2, '0')} ص`,
      resolved: false,
    }),
  )
  highExit.forEach((c) =>
    alerts.push({
      id: `al${alertSeq++}`,
      title: 'طالب خارج الفصل لمدة طويلة',
      classroom: c.code,
      level: lvl.id,
      type: 'حركة طلاب',
      severity: 'high',
      time: `${between(alertSeq, 9, 11)}:${String(between(alertSeq * 2, 10, 59)).padStart(2, '0')} ص`,
      resolved: false,
    }),
  )
  offline.forEach((c) =>
    alerts.push({
      id: `al${alertSeq++}`,
      title: 'جهاز غير متصل بالشبكة',
      classroom: c.code,
      level: lvl.id,
      type: 'جهاز',
      severity: 'high',
      time: '10:30 ص',
      resolved: false,
    }),
  )
  // a couple resolved ones
  alerts.push({
    id: `al${alertSeq++}`,
    title: 'انخفاض نسبة الحضور في الفصل',
    classroom: cs[2]?.code ?? cs[0].code,
    level: lvl.id,
    type: 'حضور',
    severity: 'low',
    time: '08:05 ص',
    resolved: true,
  })
}

export const severityMeta: Record<
  Alert['severity'],
  { label: string; badge: 'outline' | 'warning' | 'danger' | 'accent' }
> = {
  low: { label: 'منخفض', badge: 'outline' },
  medium: { label: 'متوسط', badge: 'warning' },
  high: { label: 'مرتفع', badge: 'danger' },
  urgent: { label: 'عاجل', badge: 'danger' },
}

// ---- Level-scoped getters ------------------------------------------------
export const getClassrooms = (l: Level) => classrooms.filter((c) => c.level === l)
export const getTeachers = (l: Level) => teachers.filter((t) => t.level === l)
export const getStudents = (l: Level) => students.filter((s) => s.level === l)
export const getDevices = (l: Level) => devices.filter((d) => d.level === l)
export const getMovements = (l: Level) => movements.filter((m) => m.level === l)
export const getAlerts = (l: Level) => alerts.filter((a) => a.level === l)

export function getKpis(l: Level) {
  const cs = getClassrooms(l)
  const ss = getStudents(l)
  const present = cs.reduce((s, c) => s + c.present, 0)
  const total = cs.reduce((s, c) => s + c.totalStudents, 0)
  return {
    totalStudents: total,
    totalClasses: cs.length,
    activeClasses: cs.filter((c) => c.deviceStatus === 'online').length,
    avgAttendance: total ? Math.round((present / total) * 100) : 0,
    avgNoise: cs.length ? Math.round(cs.reduce((s, c) => s + c.noise, 0) / cs.length) : 0,
    currentlyOutside: cs.reduce((s, c) => s + c.outside, 0),
    activeAlerts: getAlerts(l).filter((a) => !a.resolved).length,
    totalStudentRecords: ss.length,
  }
}

export function getAttendanceByClass(l: Level) {
  return getClassrooms(l).map((c) => ({
    name: c.code,
    حضور: Math.round((c.present / c.totalStudents) * 100),
  }))
}

export function getNoiseByClass(l: Level) {
  return getClassrooms(l)
    .map((c) => ({ name: c.code, noise: c.noise }))
    .sort((a, b) => b.noise - a.noise)
}

export function getNoiseByTeacher(l: Level) {
  return getTeachers(l).map((t) => ({ name: t.name, هدوء: t.avgQuiet }))
}

export function getNoiseByHour(l: Level) {
  const base = levelIndex[l] + 1
  return ['07', '08', '09', '10', '11', '12', '01', '02'].map((hour, i) => ({
    hour,
    noise: between(base * 50 + i * 3 + 1, 32, 82),
  }))
}

export function getMovementByHour(l: Level) {
  const base = levelIndex[l] + 1
  return ['07', '08', '09', '10', '11', '12', '01', '02'].map((hour, i) => ({
    hour,
    خروج: between(base * 70 + i * 2 + 1, 1, 14),
    عودة: between(base * 90 + i * 2 + 3, 0, 12),
  }))
}

export function getAiInsights(l: Level) {
  const cs = getClassrooms(l)
  const loudest = [...cs].sort((a, b) => b.noise - a.noise)[0]
  const ss = getStudents(l)
  const topExit = [...ss].sort((a, b) => b.exits - a.exits)[0]
  const topTeacher = getTeachers(l).find((t) => t.rank === 1)
  return [
    {
      id: 'ai1',
      type: 'trend',
      title: 'ارتفاع في مستوى الضوضاء',
      text: `سجّل الفصل ${loudest?.code} أعلى مستوى ضوضاء في المرحلة عند ${loudest?.noise} ديسيبل اليوم.`,
    },
    {
      id: 'ai2',
      type: 'risk',
      title: 'مؤشر يحتاج متابعة',
      text: `الطالب ${topExit?.name} في الفصل ${topExit?.classroom} لديه أعلى معدل خروج (${topExit?.exits} مرات) في المرحلة.`,
    },
    {
      id: 'ai3',
      type: 'pattern',
      title: 'نمط زمني متكرر',
      text: 'الفترة بعد الفسحة الثانية تسجل أعلى حركة خروج للطلاب خلال اليوم في هذه المرحلة.',
    },
    {
      id: 'ai4',
      type: 'opportunity',
      title: 'أداء متميز',
      text: `المعلم ${topTeacher?.name} يتصدّر مؤشرات الهدوء والحضور في المرحلة هذا الأسبوع.`,
    },
  ]
}

// Per-classroom timelines (used in classroom detail) ----------------------
export function getEntryExitTimeline(code: string) {
  const ss = students.filter((s) => s.classroom === code).slice(0, 6)
  const types: Array<'دخول' | 'خروج' | 'عودة'> = ['دخول', 'دخول', 'عودة', 'خروج', 'عودة', 'خروج']
  return ss.map((s, i) => ({
    time: `${between(i + 2, 7, 11)}:${String(between(i + 5, 10, 59)).padStart(2, '0')} ص`,
    student: s.name,
    type: types[i % types.length],
  }))
}

export function getNoiseHistory(code: string) {
  const seed = code.split('').reduce((a, ch) => a + ch.charCodeAt(0), 0)
  return ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00'].map((time, i) => ({
    time,
    noise: between(seed + i * 4, 30, 80),
  }))
}

// Reports are generated per level (content scoped by selected level) -------
export function getReports(l: Level) {
  const label = levelMap[l].ar
  return [
    { id: 'r1', title: 'تقرير الحضور اليومي', desc: `ملخص حضور وغياب فصول ${label} لليوم الحالي.`, updated: 'اليوم · 11:00 ص' },
    { id: 'r2', title: 'تقرير الغياب الأسبوعي', desc: `تحليل اتجاهات الغياب في ${label} خلال الأسبوع.`, updated: 'أمس · 02:30 م' },
    { id: 'r3', title: 'تقرير حركة الطلاب', desc: 'سجل الدخول والخروج والعودة لكل فصل.', updated: 'اليوم · 10:15 ص' },
    { id: 'r4', title: 'تقرير الضوضاء', desc: 'قراءات مستوى الصوت وتجاوزات الحد الأقصى.', updated: 'اليوم · 09:45 ص' },
    { id: 'r5', title: 'تقرير أداء الفصول', desc: 'مؤشرات الانضباط والهدوء والحضور لكل فصل.', updated: 'أمس · 04:00 م' },
    { id: 'r6', title: 'تقرير أداء المعلمين', desc: `ترتيب معلمي ${label} حسب مؤشرات الفصل.`, updated: 'الأحد · 08:00 ص' },
    { id: 'r7', title: 'تقرير الطلاب الأكثر خروجاً', desc: 'قائمة الطلاب بأعلى معدلات الخروج المتكرر.', updated: 'اليوم · 11:10 ص' },
  ]
}
