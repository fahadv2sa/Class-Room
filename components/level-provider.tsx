'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import { type Level, levelMap, district, school } from '@/lib/mock-data'

type LevelContextValue = {
  level: Level | null
  ready: boolean
  setLevel: (l: Level) => void
  clearLevel: () => void
  district: string
  school: string
}

const LevelContext = createContext<LevelContextValue | null>(null)
const STORAGE_KEY = 'classpulse.level'

export function LevelProvider({ children }: { children: React.ReactNode }) {
  const [level, setLevelState] = useState<Level | null>(null)
  const [schoolName, setSchoolName] = useState(school)
  const [districtName, setDistrictName] = useState(district)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    async function loadContext() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY) as Level | null
        if (saved && saved in levelMap) setLevelState(saved)
      } catch {
        // ignore
      }

      try {
        const res = await fetch('/api/school/current', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data.school?.name) setSchoolName(data.school.name)
          if (data.district) setDistrictName(data.district)
        }
      } catch {
        // keep the existing mock labels as a non-authenticated fallback
      } finally {
        setReady(true)
      }
    }

    loadContext()
  }, [])

  const setLevel = useCallback((l: Level) => {
    setLevelState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      // ignore
    }
  }, [])

  const clearLevel = useCallback(() => {
    setLevelState(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  return (
    <LevelContext.Provider
      value={{
        level,
        ready,
        setLevel,
        clearLevel,
        district: districtName,
        school: schoolName,
      }}
    >
      {children}
    </LevelContext.Provider>
  )
}

export function useLevel() {
  const ctx = useContext(LevelContext)
  if (!ctx) throw new Error('useLevel must be used within LevelProvider')
  return ctx
}
