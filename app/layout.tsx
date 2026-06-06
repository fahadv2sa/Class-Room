import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { LevelProvider } from '@/components/level-provider'
import { LanguageProvider } from '@/components/language-provider'
import './globals.css'

const cairo = Cairo({
  variable: '--font-cairo',
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'ClassPulse AI | منصة إدارة الفصول الذكية',
  description:
    'منصة ذكية لإدارة الفصول والانضباط المدرسي — مراقبة الضوضاء، الحضور الإلكتروني، وحركة الطلاب.',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="bg-background font-sans antialiased">
        <LanguageProvider>
          <LevelProvider>{children}</LevelProvider>
        </LanguageProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
