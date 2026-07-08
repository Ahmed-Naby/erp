import type { Locale } from "@/lib/i18n/config"
import type { Messages } from "@/lib/i18n/translate"
import { ar } from "@/lib/i18n/messages/ar"
import { en } from "@/lib/i18n/messages/en"

const messagesByLocale: Record<Locale, Messages> = { ar, en }

export function getMessages(locale: Locale): Messages {
  return messagesByLocale[locale]
}
