"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface AdminDashboardClientProps {
  user: { displayName: string };
  stats: {
    churches: number;
    users: number;
    resources: number;
    activeLoans: number;
    pendingRequests: number;
    pendingRegistrations: number;
  };
}

export function AdminDashboardClient({ stats }: AdminDashboardClientProps) {
  const t = useTranslations("admin");
  const tActivity = useTranslations("activity");

  const statCards = [
    { label: t("totalChurches"), value: stats.churches, color: "bg-blue-50 text-blue-700" },
    { label: t("totalUsers"), value: stats.users, color: "bg-green-50 text-green-700" },
    { label: t("totalResources"), value: stats.resources, color: "bg-purple-50 text-purple-700" },
    { label: t("activeLoans"), value: stats.activeLoans, color: "bg-orange-50 text-orange-700" },
    { label: t("pendingRequests"), value: stats.pendingRequests, color: "bg-yellow-50 text-yellow-700" },
    { label: t("pendingRegistrations"), value: stats.pendingRegistrations, color: "bg-red-50 text-red-700" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={"/dashboard" as never}
          className="text-sm text-accent-600 hover:text-accent-700 font-medium"
        >
          &larr; {t("backToDashboard")}
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-primary-800 mb-6">
        {t("adminPanel")}
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-lg p-4 ${card.color}`}
          >
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-sm font-medium mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href={"/dashboard/admin/users" as never}
          className="inline-flex items-center justify-center gap-2 bg-primary-700 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-800 transition-colors"
        >
          {t("manageUsers")}
        </Link>
        <Link
          href={"/dashboard/admin/churches" as never}
          className="inline-flex items-center justify-center gap-2 bg-primary-700 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-800 transition-colors"
        >
          {t("manageChurches")}
        </Link>
        <Link
          href={"/dashboard/admin/registrations" as never}
          className="inline-flex items-center justify-center gap-2 bg-primary-700 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-800 transition-colors"
        >
          {t("pendingRegistrations")}
          {stats.pendingRegistrations > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {stats.pendingRegistrations}
            </span>
          )}
        </Link>
        <Link
          href={"/dashboard/admin/settings" as never}
          className="inline-flex items-center justify-center gap-2 bg-primary-700 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-800 transition-colors"
        >
          {t("settings")}
        </Link>
        <Link
          href={"/dashboard/activity" as never}
          className="inline-flex items-center justify-center gap-2 bg-primary-700 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-800 transition-colors"
        >
          {tActivity("viewActivityLog")}
        </Link>
      </div>
    </div>
  );
}
