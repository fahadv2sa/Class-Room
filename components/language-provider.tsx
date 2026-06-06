'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { type AppLanguage, translate } from '@/lib/i18n/translations'
import { translateDomText } from '@/lib/i18n/dom-translations'

type LanguageContextValue = {
  language: AppLanguage
  setLanguage: (language: AppLanguage) => void
  refreshLanguage: () => Promise<void>
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)
const originalText = new WeakMap<Node, string>()
const originalAttributes = new WeakMap<HTMLElement, Map<string, string>>()

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

  useEffect(() => {
    const root = document.documentElement
    root.lang = language === 'EN' ? 'en' : 'ar'
    root.dir = language === 'EN' ? 'ltr' : 'rtl'

    const translateNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const parent = node.parentElement
        if (!parent || ['SCRIPT', 'STYLE', 'TEXTAREA'].includes(parent.tagName)) return
        const current = node.textContent ?? ''
        if (!originalText.has(node)) originalText.set(node, current)
        const source = originalText.get(node) ?? current
        const next = language === 'AR' ? source : translateDomText(language, source)
        if (next !== current) node.textContent = next
        return
      }

      if (node instanceof HTMLElement) {
        for (const attr of ['placeholder', 'aria-label', 'title']) {
          const current = node.getAttribute(attr)
          if (!current) continue
          let originals = originalAttributes.get(node)
          if (!originals) {
            originals = new Map()
            originalAttributes.set(node, originals)
          }
          if (!originals.has(attr)) originals.set(attr, current)
          const source = originals.get(attr) ?? current
          const next = language === 'AR' ? source : translateDomText(language, source)
          if (next !== current) node.setAttribute(attr, next)
        }
        node.childNodes.forEach(translateNode)
      }
    }

    translateNode(document.body)

    if (language === 'AR') return

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(translateNode)
        if (mutation.type === 'characterData') translateNode(mutation.target)
        if (mutation.type === 'attributes') translateNode(mutation.target)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'aria-label', 'title'],
    })

    return () => observer.disconnect()
  }, [language])

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
