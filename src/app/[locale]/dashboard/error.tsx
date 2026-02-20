"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-primary-800 mb-4">
        {t("notFound")}
      </h1>
      <p className="text-primary-500 mb-6">
        Something went wrong loading this page.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary-700 text-white rounded-md text-sm font-medium hover:bg-primary-800 transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-4 py-2 border border-primary-300 text-primary-700 rounded-md text-sm font-medium hover:bg-primary-50 transition-colors"
        >
          {t("goHome")}
        </Link>
      </div>
    </div>
  );
}
