"use client";

import { useTranslations } from "next-intl";

const BADGE_STYLES: Record<string, string> = {
  AVAILABLE: "bg-available/15 text-available border-available/30",
  ON_LOAN: "bg-on-loan/15 text-on-loan border-on-loan/30",
  UNAVAILABLE: "bg-unavailable/15 text-unavailable border-unavailable/30",
};

export function AvailabilityBadge({ status }: { status: string }) {
  const t = useTranslations("availability");
  const key = status as "AVAILABLE" | "ON_LOAN" | "UNAVAILABLE";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${
        BADGE_STYLES[status] || BADGE_STYLES.UNAVAILABLE
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
          status === "AVAILABLE"
            ? "bg-available"
            : status === "ON_LOAN"
              ? "bg-on-loan"
              : "bg-unavailable"
        }`}
      />
      {t(key)}
    </span>
  );
}
