"use client";

import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("common");

  return (
    <footer className="bg-primary-800 text-primary-200 py-6 mt-12">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm">
        <p>{t("footer")}</p>
        <p className="mt-1 text-primary-400">
          &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
