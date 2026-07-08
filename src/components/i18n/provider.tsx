"use client"

import { createContext, useContext, useMemo } from "react"

import type { Locale } from "@/lib/i18n/config"
import { translate, type Messages, type TranslateVars } from "@/lib/i18n/translate"

type I18nValue = {
  locale: Locale
  t: (key: string, vars?: TranslateVars) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: Locale
  messages: Messages
  children: React.ReactNode
}) {
  const value = useMemo<I18nValue>(
    () => ({
      locale,
      t: (key: string, vars?: TranslateVars) => translate(messages, key, vars),
    }),
    [locale, messages]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error("useI18n must be used within an I18nProvider")
  }
  return ctx
}

export function useTranslations() {
  return useI18n().t
}

export function useLocale() {
  return useI18n().locale
}
