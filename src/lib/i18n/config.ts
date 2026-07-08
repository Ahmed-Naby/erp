export const locales = ["ar", "en"] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "ar"
export const LOCALE_COOKIE = "locale"

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "ar" || value === "en"
}

export function dirFor(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr"
}
