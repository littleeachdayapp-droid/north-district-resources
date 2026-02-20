"use client";

import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";

interface PaginationProps {
  page: number;
  totalPages: number;
}

export function Pagination({ page, totalPages }: PaginationProps) {
  const t = useTranslations("common");
  const searchParams = useSearchParams();
  const router = useRouter();

  if (totalPages <= 1) return null;

  function goTo(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <button
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 text-sm font-medium rounded-lg border border-primary-200 text-primary-600 hover:bg-primary-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {t("previous")}
      </button>
      <span className="text-sm text-primary-500">
        {t("page")} {page} {t("of")} {totalPages}
      </span>
      <button
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 text-sm font-medium rounded-lg border border-primary-200 text-primary-600 hover:bg-primary-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {t("next")}
      </button>
    </div>
  );
}
