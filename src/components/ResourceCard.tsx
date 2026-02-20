"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AvailabilityBadge } from "./AvailabilityBadge";
import { localizedField } from "@/lib/locale-utils";

interface ResourceCardProps {
  resource: {
    id: string;
    title: string;
    titleEs?: string | null;
    category: string;
    subcategory?: string | null;
    authorComposer?: string | null;
    availabilityStatus: string;
    church: {
      id: string;
      name: string;
      nameEs?: string | null;
      city?: string | null;
    };
    tags: Array<{
      tag: { id: string; name: string; nameEs?: string | null };
    }>;
  };
}

export function ResourceCard({ resource }: ResourceCardProps) {
  const locale = useLocale();
  const t = useTranslations("categories");
  const tSub = useTranslations("subcategories");

  const categoryColor =
    resource.category === "MUSIC"
      ? "bg-music-100 text-music-800 border-music-200"
      : "bg-study-100 text-study-800 border-study-200";

  return (
    <div className="bg-white rounded-lg border border-primary-200 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded border ${categoryColor}`}
        >
          {t(resource.category as "MUSIC" | "STUDY")}
        </span>
        <AvailabilityBadge status={resource.availabilityStatus} />
      </div>

      <Link
        href={`/resources/${resource.id}`}
        className="text-lg font-semibold text-primary-800 hover:text-accent-600 transition-colors line-clamp-2 mb-1"
      >
        {localizedField(locale, resource.title, resource.titleEs)}
      </Link>

      {resource.authorComposer && (
        <p className="text-sm text-primary-500 mb-2">
          {resource.authorComposer}
        </p>
      )}

      <div className="mt-auto pt-2 flex items-center justify-between text-xs text-primary-500">
        <span>
          {localizedField(locale, resource.church.name, resource.church.nameEs)}
        </span>
        {resource.subcategory && (
          <span className="bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
            {tSub(resource.subcategory as never)}
          </span>
        )}
      </div>
    </div>
  );
}
