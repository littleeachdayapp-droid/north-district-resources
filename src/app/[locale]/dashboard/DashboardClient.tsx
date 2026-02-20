"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";

interface Resource {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  availabilityStatus: string;
  church: { id: string; name: string; nameEs: string | null };
}

interface DashboardClientProps {
  user: {
    displayName: string;
    role: string;
    churchId: string | null;
    churchName: string | null;
  };
  resources: Resource[];
  churches: { id: string; name: string; nameEs: string | null }[];
}

export function DashboardClient({
  user,
  resources,
  churches,
}: DashboardClientProps) {
  const t = useTranslations("auth");
  const tCat = useTranslations("categories");
  const tSub = useTranslations("subcategories");
  const router = useRouter();
  const isAdmin = user.role === "ADMIN";

  const [filterChurchId, setFilterChurchId] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = filterChurchId
    ? resources.filter((r) => r.church.id === filterChurchId)
    : resources;

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    setDeleting(id);
    const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    }
    setDeleting(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-800">
            {t("dashboard")}
          </h1>
          <p className="text-sm text-primary-500">
            {t("welcome", { name: user.displayName })}
            {user.churchName && (
              <span className="ml-1">— {user.churchName}</span>
            )}
          </p>
        </div>
        <Link
          href={"/dashboard/resources/new" as never}
          className="inline-flex items-center gap-2 bg-primary-700 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-800 transition-colors text-sm"
        >
          + {t("addResource")}
        </Link>
      </div>

      {/* Admin church filter */}
      {isAdmin && churches.length > 0 && (
        <div className="mb-4">
          <select
            value={filterChurchId}
            onChange={(e) => setFilterChurchId(e.target.value)}
            className="px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
          >
            <option value="">{t("allResources")}</option>
            {churches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-primary-500 py-8 text-center">{t("noResources")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary-200 text-left text-primary-600">
                <th className="py-3 pr-4 font-medium">{t("title")}</th>
                <th className="py-3 pr-4 font-medium hidden sm:table-cell">
                  {tCat("MUSIC")}/{tCat("STUDY")}
                </th>
                <th className="py-3 pr-4 font-medium hidden md:table-cell">
                  {tSub("HYMNAL").split(" ")[0]}
                </th>
                {isAdmin && (
                  <th className="py-3 pr-4 font-medium hidden lg:table-cell">
                    {t("church")}
                  </th>
                )}
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 font-medium text-right">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((resource) => (
                <tr
                  key={resource.id}
                  className="border-b border-primary-100 hover:bg-primary-50"
                >
                  <td className="py-3 pr-4 font-medium text-primary-800">
                    {resource.title}
                  </td>
                  <td className="py-3 pr-4 hidden sm:table-cell">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        resource.category === "MUSIC"
                          ? "bg-music-100 text-music-700"
                          : "bg-study-100 text-study-700"
                      }`}
                    >
                      {tCat(resource.category as "MUSIC" | "STUDY")}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-primary-500 hidden md:table-cell">
                    {resource.subcategory
                      ? tSub(resource.subcategory as never)
                      : "—"}
                  </td>
                  {isAdmin && (
                    <td className="py-3 pr-4 text-primary-500 hidden lg:table-cell">
                      {resource.church.name}
                    </td>
                  )}
                  <td className="py-3 pr-4">
                    <AvailabilityBadge status={resource.availabilityStatus} />
                  </td>
                  <td className="py-3 text-right space-x-2">
                    <Link
                      href={`/dashboard/resources/${resource.id}/edit` as never}
                      className="text-accent-600 hover:text-accent-700 font-medium"
                    >
                      {t("edit")}
                    </Link>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      disabled={deleting === resource.id}
                      className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                    >
                      {deleting === resource.id ? "..." : t("delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
