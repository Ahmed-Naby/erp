import "server-only"

import { cookies } from "next/headers"

import { defaultLocale, dirFor, isLocale, LOCALE_COOKIE, type Locale } from "@/lib/i18n/config"
import { getMessages } from "@/lib/i18n/messages"
import { translate, type TranslateVars } from "@/lib/i18n/translate"

export async function getLocale(): Promise<Locale> {
  const store = await cookies()
  const value = store.get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : defaultLocale
}

export async function getTranslations() {
  const locale = await getLocale()
  const messages = getMessages(locale)
  return {
    locale,
    dir: dirFor(locale),
    messages,
    t: (key: string, vars?: TranslateVars) => translate(messages, key, vars),
  }
}
