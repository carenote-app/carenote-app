"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Cookie-based locale switcher. Writes the chosen locale to the `cn_locale`
// cookie and refreshes the route tree so server components re-render with the
// new messages. URL is unchanged — locale routing is cookie-only in v1.
const LOCALE_COOKIE = "cn_locale";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export function LanguageSwitcher() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("languageSwitcher");

  const handleChange = (next: string) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
    router.refresh();
  };

  return (
    <Select value={locale} onValueChange={handleChange}>
      <SelectTrigger className="h-8 w-auto gap-1.5 px-2 text-xs" aria-label={t("label")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">{t("english")}</SelectItem>
        <SelectItem value="zh-TW">{t("traditionalChinese")}</SelectItem>
        <SelectItem value="vi">{t("vietnamese")}</SelectItem>
        <SelectItem value="id">{t("indonesian")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
