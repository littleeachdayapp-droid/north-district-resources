"use client";

import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { useRef, useEffect, useCallback } from "react";

export function SearchBar() {
  const t = useTranslations("common");
  const searchParams = useSearchParams();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>(null);

  const currentSearch = searchParams.get("search") || "";

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = currentSearch;
    }
  }, [currentSearch]);

  const updateSearch = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      params.delete("page");
      router.push(`?${params.toString()}`);
    },
    [searchParams, router]
  );

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => updateSearch(e.target.value), 300);
  }

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        ref={inputRef}
        type="text"
        defaultValue={currentSearch}
        onChange={handleInput}
        placeholder={t("searchPlaceholder")}
        className="w-full pl-10 pr-4 py-2.5 border border-primary-200 rounded-lg bg-white text-primary-800 placeholder-primary-400 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-400"
      />
    </div>
  );
}
