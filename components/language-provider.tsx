'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { type AppLanguage, translate } from '@/lib/i18n/translations'

type LanguageContextValue = {
  language: AppLanguage
  setLanguage: (language: AppLanguage) => void
  refreshLanguage: () => Promise<void>
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function normalizeLanguage(value: unknown): AppLanguage {
  return String(value).toUpperCase() === 'EN' ? 'EN' : 'AR'
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('AR')

  const refreshLanguage = useCallback(async () => {
    try {
      const res = await fetch('/api/settings', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setLanguageState(normalizeLanguage(data.settings?.language))
    } catch {
      // Keep the default Arabic language before authentication or when offline.
    }
  }, [])

  useEffect(() => {
    refreshLanguage()
  }, [refreshLanguage])

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage)
  }, [])

  const t = useCallback((key: string) => translate(language, key), [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, refreshLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
