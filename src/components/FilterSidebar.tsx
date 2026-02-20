"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { localizedField } from "@/lib/locale-utils";
import {
  AVAILABILITY_STATUSES,
  SUBCATEGORIES_BY_CATEGORY,
  type Category,
} from "@/lib/constants";

interface Tag {
  id: string;
  name: string;
  nameEs?: string | null;
}

interface Church {
  id: string;
  name: string;
  nameEs?: string | null;
}

interface FilterSidebarProps {
  category?: Category;
  tags: Tag[];
  churches: Church[];
}

export function FilterSidebar({ category, tags, churches }: FilterSidebarProps) {
  const t = useTranslations("common");
  const tSub = useTranslations("subcategories");
  const tAvail = useTranslations("availability");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const selectedSubcategories =
    searchParams.get("subcategory")?.split(",").filter(Boolean) || [];
  const selectedTags =
    searchParams.get("tags")?.split(",").filter(Boolean) || [];
  const selectedChurch = searchParams.get("churchId") || "";
  const selectedAvailability =
    searchParams.get("availability")?.split(",").filter(Boolean) || [];

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [searchParams, router]
  );

  function toggleArrayParam(key: string, value: string, current: string[]) {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(key, next.join(","));
  }

  function clearAll() {
    const params = new URLSearchParams();
    const search = searchParams.get("search");
    if (search) params.set("search", search);
    router.push(`?${params.toString()}`);
  }

  const subcategories = category
    ? SUBCATEGORIES_BY_CATEGORY[category]
    : [];

  const hasFilters =
    selectedSubcategories.length > 0 ||
    selectedTags.length > 0 ||
    selectedChurch ||
    selectedAvailability.length > 0;

  const filterContent = (
    <div className="space-y-6">
      {hasFilters && (
        <button
          onClick={clearAll}
          className="text-sm text-accent-600 hover:text-accent-700 font-medium"
        >
          {t("clearFilters")}
        </button>
      )}

      {/* Subcategory */}
      {subcategories.length > 0 && (
        <div>
          <h4 className="font-semibold text-primary-700 mb-2 text-sm">
            {t("subcategory")}
          </h4>
          <div className="space-y-1.5">
            {subcategories.map((sub) => (
              <label
                key={sub}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedSubcategories.includes(sub)}
                  onChange={() =>
                    toggleArrayParam("subcategory", sub, selectedSubcategories)
                  }
                  className="rounded border-primary-300 text-accent-500 focus:ring-accent-400"
                />
                <span className="text-primary-600">
                  {tSub(sub as never)}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Availability */}
      <div>
        <h4 className="font-semibold text-primary-700 mb-2 text-sm">
          {t("filter")}
        </h4>
        <div className="space-y-1.5">
          {AVAILABILITY_STATUSES.map((status) => (
            <label
              key={status}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedAvailability.includes(status)}
                onChange={() =>
                  toggleArrayParam("availability", status, selectedAvailability)
                }
                className="rounded border-primary-300 text-accent-500 focus:ring-accent-400"
              />
              <span className="text-primary-600">
                {tAvail(status as "AVAILABLE" | "ON_LOAN" | "UNAVAILABLE")}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <h4 className="font-semibold text-primary-700 mb-2 text-sm">
            {t("tags")}
          </h4>
          <div className="space-y-1.5">
            {tags.map((tag) => (
              <label
                key={tag.id}
                className="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag.id)}
                  onChange={() =>
                    toggleArrayParam("tags", tag.id, selectedTags)
                  }
                  className="rounded border-primary-300 text-accent-500 focus:ring-accent-400"
                />
                <span className="text-primary-600">
                  {localizedField(locale, tag.name, tag.nameEs)}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Church */}
      {churches.length > 0 && (
        <div>
          <h4 className="font-semibold text-primary-700 mb-2 text-sm">
            {t("church")}
          </h4>
          <select
            value={selectedChurch}
            onChange={(e) => updateFilter("churchId", e.target.value)}
            className="w-full text-sm border border-primary-200 rounded-lg px-3 py-2 bg-white text-primary-700 focus:outline-none focus:ring-2 focus:ring-accent-400"
          >
            <option value="">{t("allChurches")}</option>
            {churches.map((church) => (
              <option key={church.id} value={church.id}>
                {localizedField(locale, church.name, church.nameEs)}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden mb-4 flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-800"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        {mobileOpen ? t("hideFilters") : t("showFilters")}
        {hasFilters && (
          <span className="bg-accent-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {selectedSubcategories.length +
              selectedTags.length +
              selectedAvailability.length +
              (selectedChurch ? 1 : 0)}
          </span>
        )}
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden mb-6 p-4 bg-white rounded-lg border border-primary-200">
          {filterContent}
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-4 p-4 bg-white rounded-lg border border-primary-200">
          <h3 className="font-semibold text-primary-800 mb-4">{t("filters")}</h3>
          {filterContent}
        </div>
      </aside>
    </>
  );
}
