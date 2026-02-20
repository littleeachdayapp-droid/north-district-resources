"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface SettingsClientProps {
  initialSettings: {
    emailNotifications: boolean;
  };
}

export function SettingsClient({ initialSettings }: SettingsClientProps) {
  const t = useTranslations("admin");
  const [emailNotifications, setEmailNotifications] = useState(
    initialSettings.emailNotifications
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleToggle() {
    const newValue = !emailNotifications;
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailNotifications: newValue }),
      });

      if (res.ok) {
        setEmailNotifications(newValue);
        setMessage(t("settingsSaved"));
        setTimeout(() => setMessage(""), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={"/dashboard/admin" as never}
          className="text-sm text-accent-600 hover:text-accent-700 font-medium"
        >
          &larr; {t("backToAdmin")}
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-primary-800 mb-2">
        {t("settings")}
      </h1>
      <p className="text-primary-600 mb-8">{t("settingsDescription")}</p>

      {/* Email Notifications Toggle */}
      <div className="bg-white rounded-lg border border-primary-200 p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-primary-800">
              {t("emailNotifications")}
            </h2>
            <p className="text-sm text-primary-500 mt-1">
              {t("emailNotificationsDescription")}
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={saving}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 disabled:opacity-50 ${
              emailNotifications ? "bg-accent-600" : "bg-primary-300"
            }`}
            role="switch"
            aria-checked={emailNotifications}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                emailNotifications ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        <p className="text-sm font-medium mt-3">
          <span
            className={
              emailNotifications ? "text-green-600" : "text-primary-400"
            }
          >
            {emailNotifications ? t("enabled") : t("disabled")}
          </span>
        </p>
      </div>

      {message && (
        <p className="mt-4 text-sm text-green-600 font-medium">{message}</p>
      )}
    </div>
  );
}
