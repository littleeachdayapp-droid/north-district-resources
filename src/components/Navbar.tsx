"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAuth } from "./AuthProvider";

export function Navbar() {
  const t = useTranslations("common");
  const tAuth = useTranslations("auth");
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/" as const, label: t("home") },
    { href: "/music" as const, label: t("music") },
    { href: "/study" as const, label: t("study") },
    { href: "/churches" as const, label: t("churches") },
  ];

  const handleLogout = async () => {
    await logout();
    router.push("/");
    setMenuOpen(false);
  };

  return (
    <nav className="bg-primary-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="font-bold text-lg tracking-tight">
            MinistryShare<span className="text-accent-300 ml-1">Austin</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-accent-300 ${
                  pathname === link.href
                    ? "text-accent-300 border-b-2 border-accent-400 pb-0.5"
                    : "text-primary-100"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-4">
                    <Link
                      href={"/dashboard" as never}
                      className={`text-sm font-medium transition-colors hover:text-accent-300 ${
                        pathname.startsWith("/dashboard")
                          ? "text-accent-300 border-b-2 border-accent-400 pb-0.5"
                          : "text-primary-100"
                      }`}
                    >
                      {tAuth("dashboard")}
                    </Link>
                    <span className="text-xs text-primary-300">
                      {user.displayName}
                    </span>
                    <button
                      onClick={handleLogout}
                      className="text-sm font-medium text-primary-200 hover:text-accent-300 transition-colors"
                    >
                      {tAuth("logout")}
                    </button>
                  </div>
                ) : (
                  <Link
                    href={"/login" as never}
                    className={`text-sm font-medium transition-colors hover:text-accent-300 ${
                      pathname === "/login"
                        ? "text-accent-300 border-b-2 border-accent-400 pb-0.5"
                        : "text-primary-100"
                    }`}
                  >
                    {tAuth("login")}
                  </Link>
                )}
              </>
            )}

            <LanguageSwitcher />
          </div>

          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center gap-3">
            <LanguageSwitcher />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-md hover:bg-primary-700"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === link.href
                    ? "bg-primary-700 text-accent-300"
                    : "text-primary-100 hover:bg-primary-700"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {!loading && (
              <>
                {user ? (
                  <>
                    <Link
                      href={"/dashboard" as never}
                      onClick={() => setMenuOpen(false)}
                      className={`block px-3 py-2 rounded-md text-sm font-medium ${
                        pathname.startsWith("/dashboard")
                          ? "bg-primary-700 text-accent-300"
                          : "text-primary-100 hover:bg-primary-700"
                      }`}
                    >
                      {tAuth("dashboard")}
                    </Link>
                    <div className="px-3 py-1 text-xs text-primary-300">
                      {user.displayName}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-primary-200 hover:bg-primary-700"
                    >
                      {tAuth("logout")}
                    </button>
                  </>
                ) : (
                  <Link
                    href={"/login" as never}
                    onClick={() => setMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-sm font-medium ${
                      pathname === "/login"
                        ? "bg-primary-700 text-accent-300"
                        : "text-primary-100 hover:bg-primary-700"
                    }`}
                  >
                    {tAuth("login")}
                  </Link>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
