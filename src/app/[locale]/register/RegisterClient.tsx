"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

interface Church {
  id: string;
  name: string;
  nameEs: string | null;
}

export function RegisterClient() {
  const t = useTranslations("registration");
  const tAuth = useTranslations("auth");
  const locale = useLocale();

  const [churches, setChurches] = useState<Church[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [churchId, setChurchId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/churches")
      .then((res) => res.json())
      .then((data) => setChurches(data))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          email,
          username,
          password,
          churchId,
          locale,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "USERNAME_TAKEN") {
          setError(t("usernameTaken"));
        } else if (data.code === "EMAIL_TAKEN") {
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

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-green-800 mb-2">
              {t("successTitle")}
            </h2>
            <p className="text-green-700 text-sm">{t("successMessage")}</p>
          </div>
          <p className="mt-4 text-sm text-primary-600">
            {t("alreadyHaveAccount")}{" "}
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
        <h1 className="text-2xl font-bold text-primary-800 text-center mb-6">
          {t("registerAccount")}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="churchId"
              className="block text-sm font-medium text-primary-700 mb-1"
            >
              {t("selectChurch")} *
            </label>
            <select
              id="churchId"
              required
              value={churchId}
              onChange={(e) => setChurchId(e.target.value)}
              className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
            >
              <option value="">{t("selectChurch")}</option>
              {churches.map((c) => (
                <option key={c.id} value={c.id}>
                  {locale === "es" && c.nameEs ? c.nameEs : c.name}
                </option>
              ))}
            </select>
          </div>

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
              htmlFor="email"
              className="block text-sm font-medium text-primary-700 mb-1"
            >
              {t("email")} *
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-primary-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent"
              autoComplete="email"
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
            {submitting ? t("submitting") : t("submit")}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-primary-600">
            {t("orRegisterChurch")}{" "}
            <Link
              href={"/register/church" as never}
              className="text-accent-600 hover:text-accent-700 font-medium"
            >
              {t("churchSignup")}
            </Link>
          </p>
          <p className="text-sm text-primary-600">
            {t("alreadyHaveAccount")}{" "}
            <Link
              href={"/login" as never}
              className="text-accent-600 hover:text-accent-700 font-medium"
            >
              {t("loginHere")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
