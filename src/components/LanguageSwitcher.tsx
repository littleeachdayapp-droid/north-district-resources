"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const otherLocale = locale === "en" ? "es" : "en";

  function switchLocale() {
    router.replace(pathname, { locale: otherLocale });
  }

  return (
    <button
      onClick={switchLocale}
      className="px-2.5 py-1 text-xs font-semibold rounded-full border border-primary-400 hover:bg-primary-700 transition-colors"
      title={otherLocale === "es" ? "Cambiar a español" : "Switch to English"}
    >
      {otherLocale === "es" ? "ES" : "EN"}
    </button>
  );
}
