"use client";

import { useState, type FormEvent } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

export function RegisterChurchClient() {
  const t = useTranslations("registration");
  const locale = useLocale();

  // Church fields
  const [churchName, setChurchName] = useState("");
  const [churchNameEs, setChurchNameEs] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("TX");
  const [zip, setZip] = useState("");
  const [phone, setPhone] = useState("");
  const [churchEmail, setChurchEmail] = useState("");
  const [pastor, setPastor] = useState("");

  // Account fields
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"));
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/register/church", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          churchName,
          churchNameEs: churchNameEs || undefined,
          address: address || undefined,
          city: city || undefined,
          state: state || undefined,
          zip: zip || undefined,
          phone: phone || undefined,
          churchEmail: churchEmail || undefined,
          pastor: pastor || undefined,
          displayName,
          email,
          username,
          password,
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
            <p className="text-green-700 text-sm">{t("churchSuccessMessage")}</p>
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

  const inputClass =
    "w-full px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent";

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-primary-800 text-center mb-6">
          {t("registerChurch")}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}

          {/* Church Info Section */}
          <fieldset className="border border-primary-200 rounded-lg p-4 space-y-4">
            <legend className="text-lg font-semibold text-primary-800 px-2">
              {t("churchInfo")}
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  {t("churchName")} *
                </label>
                <input
                  type="text"
                  required
                  value={churchName}
                  onChange={(e) => setChurchName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  {t("churchNameEs")}
                </label>
                <input
                  type="text"
                  value={churchNameEs}
                  onChange={(e) => setChurchNameEs(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  {t("address")}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  {t("city")}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    {t("state")}
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={state}
                    onChange={(e) => setState(e.target.value.toUpperCase())}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-700 mb-1">
                    {t("zip")}
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  {t("phone")}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  {t("churchEmail")}
                </label>
                <input
                  type="email"
                  value={churchEmail}
                  onChange={(e) => setChurchEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  {t("pastor")}
                </label>
                <input
                  type="text"
                  value={pastor}
                  onChange={(e) => setPastor(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </fieldset>

          {/* Account Section */}
          <fieldset className="border border-primary-200 rounded-lg p-4 space-y-4">
            <legend className="text-lg font-semibold text-primary-800 px-2">
              {t("yourAccount")}
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  {t("displayName")} *
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  {t("email")} *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  {t("username")} *
                </label>
                <input
                  type="text"
                  required
                  minLength={3}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClass}
                  autoComplete="username"
                />
              </div>
              <div>{/* spacer */}</div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  {t("password")} *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  {t("confirmPassword")} *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                  autoComplete="new-password"
                />
              </div>
            </div>
          </fieldset>

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
            {t("orJoinExisting")}{" "}
            <Link
              href={"/register" as never}
              className="text-accent-600 hover:text-accent-700 font-medium"
            >
              {t("individualSignup")}
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
