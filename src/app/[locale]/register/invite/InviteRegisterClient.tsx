"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";

interface InviteInfo {
  churchName: string;
  email: string;
}

export function InviteRegisterClient() {
  const t = useTranslations("registration");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokenError, setTokenError] = useState("");

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setTokenError(t("inviteInvalid"));
      setLoading(false);
      return;
    }

    fetch(`/api/auth/register/invite/validate?token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setTokenError(data.error);
        } else {
          setInviteInfo(data);
        }
      })
      .catch(() => setTokenError("Failed to validate invite"))
      .finally(() => setLoading(false));
  }, [token, t]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/register/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, displayName, username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "USERNAME_TAKEN") {
          setError(t("usernameTaken"));
        } else if (data.code === "EMAIL_EXISTS") {
          setError(t("emailTaken"));
        } else {
          setError(data.error || "Registration failed");
        }
        setSubmitting(false);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Registration failed");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-primary-500">{t("validatingInvite")}</p>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">
              {t("inviteInvalid")}
            </h2>
            <p className="text-red-700 text-sm">{tokenError}</p>
          </div>
          <p className="mt-4 text-sm text-primary-600">
            <Link
              href={"/login" as never}
              className="text-accent-600 hover:text-accent-700 font-medium"
            >
              {t("loginHere")}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-green-800 mb-2">
              {t("inviteSuccessTitle")}
            </h2>
            <p className="text-green-700 text-sm">
              {t("inviteSuccessMessage", { church: inviteInfo?.churchName ?? "" })}
            </p>
          </div>
          <p className="mt-4">
            <Link
              href={"/login" as never}
              className="text-accent-600 hover:text-accent-700 font-medium"
            >
              {t("loginHere")}
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-primary-800 text-center mb-2">
          {t("inviteTitle")}
        </h1>
        <p className="text-center text-primary-600 mb-6">
          {t("inviteSubtitle", { church: inviteInfo?.churchName ?? "" })}
        </p>

        <div className="bg-primary-50 border border-primary-200 rounded-md px-4 py-3 mb-6 text-sm">
          <span className="font-medium text-primary-700">{t("email")}:</span>{" "}
          <span className="text-primary-600">{inviteInfo?.email}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-primary-700 mb-1"
            >
              {t("displayName")} *
            </label>
            <input
              id="displayName"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-primary-700 mb-1"
            >
              {t("username")} *
            </label>
            <input
              id="username"
              type="text"
              required
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
              autoComplete="username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-primary-700 mb-1"
            >
              {t("password")} *
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-primary-700 mb-1"
            >
              {t("confirmPassword")} *
            </label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary-700 text-white py-2 px-4 rounded-md font-medium hover:bg-primary-800 transition-colors disabled:opacity-50"
          >
            {submitting ? t("submitting") : t("inviteAccept")}
          </button>
        </form>
      </div>
    </div>
  );
}
