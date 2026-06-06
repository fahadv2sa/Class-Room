'use client'

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useLanguage } from '@/components/language-provider'

const axisStyle = {
  fontSize: 12,
  fontFamily: 'var(--font-cairo)',
  fill: '#64748b',
}

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  fontSize: 12,
  fontFamily: 'var(--font-cairo)',
  boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
}

export function NoiseAreaChart({
  data,
}: {
  data: { hour?: string; time?: string; noise: number }[]
}) {
  const { language, t } = useLanguage()
  const key = data[0]?.hour !== undefined ? 'hour' : 'time'
  const direction = language === 'EN' ? 'ltr' : 'rtl'
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="noiseFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey={key} tick={axisStyle} axisLine={false} tickLine={false} reversed={language === 'AR'} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip contentStyle={{ ...tooltipStyle, direction }} labelStyle={{ fontWeight: 700 }} />
        <Area
          type="monotone"
          dataKey="noise"
          name={t('noise.title')}
          stroke="#2563eb"
          strokeWidth={2.5}
          fill="url(#noiseFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function AttendanceBarChart({
  data,
}: {
  data: { name: string; حضور: number }[]
}) {
  const { language, t } = useLanguage()
  const direction = language === 'EN' ? 'ltr' : 'rtl'
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="name" tick={{ ...axisStyle, fontSize: 10 }} axisLine={false} tickLine={false} reversed={language === 'AR'} interval={0} angle={0} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} domain={[0, 100]} />
        <Tooltip contentStyle={{ ...tooltipStyle, direction }} cursor={{ fill: '#f8fafc' }} />
        <Bar dataKey="حضور" name={t('attendance.title')} fill="#22c55e" radius={[6, 6, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function NoiseRankBarChart({
  data,
}: {
  data: { name: string; noise: number }[]
}) {
  const { language, t } = useLanguage()
  const direction = language === 'EN' ? 'ltr' : 'rtl'
  const color = (n: number) =>
    n <= 45 ? '#22c55e' : n <= 70 ? '#f59e0b' : '#ef4444'
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} domain={[0, 100]} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ ...axisStyle, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={90}
          orientation="right"
        />
        <Tooltip contentStyle={{ ...tooltipStyle, direction }} cursor={{ fill: '#f8fafc' }} />
        <Bar dataKey="noise" name={t('classrooms.noise')} radius={[0, 6, 6, 0]} maxBarSize={24}>
          {data.map((d, i) => (
            <Cell key={i} fill={color(d.noise)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function MovementLineChart({
  data,
}: {
  data: { hour: string; خروج: number; عودة: number }[]
}) {
  const { language, t } = useLanguage()
  const direction = language === 'EN' ? 'ltr' : 'rtl'
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis dataKey="hour" tick={axisStyle} axisLine={false} tickLine={false} reversed={language === 'AR'} />
        <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ ...tooltipStyle, direction }} />
        <Line type="monotone" dataKey="خروج" name={t('movement.exit')} stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="عودة" name={t('movement.return')} stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function TeacherQuietBarChart({
  data,
}: {
  data: { name: string; هدوء: number }[]
}) {
  const { language, t } = useLanguage()
  const direction = language === 'EN' ? 'ltr' : 'rtl'
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
        <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} domain={[0, 100]} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ ...axisStyle, fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={90}
          orientation="right"
        />
        <Tooltip contentStyle={{ ...tooltipStyle, direction }} cursor={{ fill: '#f8fafc' }} />
        <Bar dataKey="هدوء" name={t('teachers.classQuiet')} fill="#2563eb" radius={[0, 6, 6, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  )
}
