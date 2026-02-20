"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { localizedField } from "@/lib/locale-utils";

interface ChurchCardProps {
  church: {
    id: string;
    name: string;
    nameEs?: string | null;
    city?: string | null;
    pastor?: string | null;
    _count: { resources: number };
  };
}

export function ChurchCard({ church }: ChurchCardProps) {
  const locale = useLocale();
  const t = useTranslations("churches");

  return (
    <Link
      href={`/churches/${church.id}`}
      className="block bg-white rounded-lg border border-primary-200 shadow-sm hover:shadow-md transition-shadow p-5"
    >
      <h3 className="text-lg font-semibold text-primary-800 mb-1">
        {localizedField(locale, church.name, church.nameEs)}
      </h3>
      {church.city && (
        <p className="text-sm text-primary-500 mb-2">{church.city}, TX</p>
      )}
      {church.pastor && (
        <p className="text-sm text-primary-600">
          <span className="font-medium">{t("pastor")}:</span> {church.pastor}
        </p>
      )}
      <p className="text-sm text-accent-600 font-medium mt-3">
        {t("resourceCount", { count: church._count.resources })}
      </p>
    </Link>
  );
}
