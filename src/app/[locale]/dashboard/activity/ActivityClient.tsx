"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string | null;
  createdAt: string | Date;
  user: { id: string; displayName: string; role: string };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ActivityClientProps {
  initialLogs: ActivityLog[];
  initialPagination: Pagination;
  isAdmin: boolean;
}

const ACTIONS = [
  "CREATE_RESOURCE",
  "UPDATE_RESOURCE",
  "DELETE_RESOURCE",
  "CREATE_LOAN_REQUEST",
  "APPROVE_REQUEST",
  "DENY_REQUEST",
  "CANCEL_REQUEST",
  "RETURN_LOAN",
  "MARK_OVERDUE",
  "MARK_LOST",
  "CREATE_USER",
  "UPDATE_USER",
  "CREATE_CHURCH",
  "UPDATE_CHURCH",
  "UPDATE_SETTINGS",
] as const;

const ENTITY_TYPES = [
  "Resource",
  "LoanRequest",
  "Loan",
  "User",
  "Church",
  "SiteSettings",
] as const;

const ACTION_COLORS: Record<string, string> = {
  CREATE_RESOURCE: "bg-blue-100 text-blue-800",
  UPDATE_RESOURCE: "bg-blue-100 text-blue-800",
  DELETE_RESOURCE: "bg-blue-100 text-blue-800",
  CREATE_LOAN_REQUEST: "bg-orange-100 text-orange-800",
  APPROVE_REQUEST: "bg-orange-100 text-orange-800",
  DENY_REQUEST: "bg-orange-100 text-orange-800",
  CANCEL_REQUEST: "bg-orange-100 text-orange-800",
  RETURN_LOAN: "bg-orange-100 text-orange-800",
  MARK_OVERDUE: "bg-orange-100 text-orange-800",
  MARK_LOST: "bg-orange-100 text-orange-800",
  CREATE_USER: "bg-purple-100 text-purple-800",
  UPDATE_USER: "bg-purple-100 text-purple-800",
  CREATE_CHURCH: "bg-purple-100 text-purple-800",
  UPDATE_CHURCH: "bg-purple-100 text-purple-800",
  UPDATE_SETTINGS: "bg-purple-100 text-purple-800",
};

function formatDate(dateVal: string | Date): string {
  const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityClient({
  initialLogs,
  initialPagination,
  isAdmin,
}: ActivityClientProps) {
  const t = useTranslations("activity");
  const tCommon = useTranslations("common");

  const [logs, setLogs] = useState<ActivityLog[]>(initialLogs);
  const [pagination, setPagination] = useState<Pagination>(initialPagination);
  const [filterAction, setFilterAction] = useState("");
  const [filterEntityType, setFilterEntityType] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchLogs = async (page: number, action: string, entityType: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (action) params.set("action", action);
      if (entityType) params.set("entityType", entityType);

      const res = await fetch(`/api/activity?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (action: string, entityType: string) => {
    setFilterAction(action);
    setFilterEntityType(entityType);
    fetchLogs(1, action, entityType);
  };

  const handlePage = (page: number) => {
    fetchLogs(page, filterAction, filterEntityType);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={"/dashboard" as never}
          className="text-sm text-accent-600 hover:text-accent-700 font-medium"
        >
          &larr; {tCommon("back")}
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-primary-800 mb-6">
        {t("activityLog")}
      </h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={filterAction}
          onChange={(e) => handleFilterChange(e.target.value, filterEntityType)}
          className="px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
        >
          <option value="">{t("allActions")}</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {t(a)}
            </option>
          ))}
        </select>
        <select
          value={filterEntityType}
          onChange={(e) => handleFilterChange(filterAction, e.target.value)}
          className="px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
        >
          <option value="">{t("allTypes")}</option>
          {ENTITY_TYPES.map((et) => (
            <option key={et} value={et}>
              {et}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-primary-500 py-8 text-center">{tCommon("loading")}</p>
      ) : logs.length === 0 ? (
        <p className="text-primary-500 py-8 text-center">{t("noActivity")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary-200 text-left text-primary-600">
                <th className="py-3 pr-4 font-medium">{t("date")}</th>
                {isAdmin && (
                  <th className="py-3 pr-4 font-medium hidden sm:table-cell">
                    {t("user")}
                  </th>
                )}
                <th className="py-3 pr-4 font-medium">{t("action")}</th>
                <th className="py-3 pr-4 font-medium hidden md:table-cell">
                  {t("details")}
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-primary-100 hover:bg-primary-50"
                >
                  <td className="py-3 pr-4 text-primary-500 whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>
                  {isAdmin && (
                    <td className="py-3 pr-4 text-primary-700 hidden sm:table-cell">
                      {log.user.displayName}
                    </td>
                  )}
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${ACTION_COLORS[log.action] || "bg-gray-100 text-gray-700"}`}
                    >
                      {t(log.action as "CREATE_RESOURCE")}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-primary-600 hidden md:table-cell">
                    {log.details || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-primary-500">
            {tCommon("page")} {pagination.page} {tCommon("of")}{" "}
            {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handlePage(pagination.page - 1)}
              disabled={pagination.page <= 1 || loading}
              className="px-3 py-1.5 text-sm border border-primary-300 rounded-md hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {tCommon("previous")}
            </button>
            <button
              onClick={() => handlePage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages || loading}
              className="px-3 py-1.5 text-sm border border-primary-300 rounded-md hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {tCommon("next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
