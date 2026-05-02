import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

// Cookie-based locale resolution. Locale is read from the `cn_locale` cookie
// (set by the language switcher); the URL is not refactored to include a
// locale segment in this iteration. URL-segment routing is a future TODO.
//
// Supported locales for v1: en, zh-TW, vi, id. Add new locales by:
//   1) creating messages/{locale}.json
//   2) updating SUPPORTED_LOCALES below and the language switcher options
export const SUPPORTED_LOCALES = ["en", "zh-TW", "vi", "id"] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = "en";
export const LOCALE_COOKIE = "cn_locale";

function resolveLocale(value: string | undefined): SupportedLocale {
  if (!value) return DEFAULT_LOCALE;
  return (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as SupportedLocale)
    : DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = resolveLocale(store.get(LOCALE_COOKIE)?.value);
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return { locale, messages };
});
