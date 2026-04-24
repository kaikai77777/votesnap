'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { zh, en } from './translations'

type Lang = 'zh' | 'en'

const dict = { zh, en }

const LangContext = createContext<{
  lang: Lang
  t: (key: string, vars?: Record<string, string | number>) => string
  toggle: () => void
}>({
  lang: 'zh',
  t: (k) => k,
  toggle: () => {},
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('zh')

  useEffect(() => {
    const saved = localStorage.getItem('vs-lang') as Lang
    if (saved === 'en' || saved === 'zh') setLang(saved)
  }, [])

  function toggle() {
    const next: Lang = lang === 'zh' ? 'en' : 'zh'
    setLang(next)
    localStorage.setItem('vs-lang', next)
  }

  function t(key: string, vars?: Record<string, string | number>): string {
    let str = (dict[lang] as Record<string, string>)[key] ?? key
    if (vars) {
      Object.entries(vars).forEach(([k, v]) => {
        str = str.replace(`{${k}}`, String(v))
      })
    }
    return str
  }

  return (
    <LangContext.Provider value={{ lang, t, toggle }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
