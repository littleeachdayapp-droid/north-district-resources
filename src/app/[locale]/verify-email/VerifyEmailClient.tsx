"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

export function VerifyEmailClient() {
  const t = useTranslations("registration");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [churchPending, setChurchPending] = useState(false);
  const [errorCode, setErrorCode] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState<"" | "sending" | "sent" | "error">("");

  const verify = useCallback(async () => {
    if (!token) {
      setStatus("error");
      setErrorCode("INVALID_TOKEN");
      return;
    }

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorCode(data.code || "INVALID_TOKEN");
        return;
      }

      setStatus("success");
      setChurchPending(data.churchPending || false);
    } catch {
      setStatus("error");
      setErrorCode("INVALID_TOKEN");
    }
  }, [token]);

  useEffect(() => {
    verify();
  }, [verify]);

  const handleResend = async () => {
    if (!resendEmail) return;
    setResendStatus("sending");

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resendEmail, locale }),
      });

      if (res.status === 429) {
        setResendStatus("error");
        return;
      }

      setResendStatus("sent");
    } catch {
      setResendStatus("error");
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        {status === "loading" && (
          <div className="text-primary-600">
            <div className="animate-spin w-8 h-8 border-2 border-primary-300 border-t-primary-700 rounded-full mx-auto mb-4" />
            <p>{t("verifying")}</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-green-800 mb-2">
                {t("verifySuccess")}
              </h2>
              {churchPending ? (
                <p className="text-green-700 text-sm">
                  {t("churchPendingNote")}
                </p>
              ) : (
                <p className="text-green-700 text-sm">
                  {t("verifySuccessLogin")}
                </p>
              )}
            </div>
            {!churchPending && (
              <Link
                href={"/login" as never}
                className="inline-block bg-primary-700 text-white px-6 py-2 rounded-md font-medium hover:bg-primary-800 transition-colors"
              >
                {t("loginHere")}
              </Link>
            )}
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-red-800 mb-2">
                {t("verifyError")}
              </h2>
              <p className="text-red-700 text-sm">
                {errorCode === "TOKEN_EXPIRED"
                  ? t("tokenExpired")
                  : t("invalidToken")}
              </p>
            </div>

            {/* Resend form */}
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 space-y-3">
              <p className="text-sm text-primary-700 font-medium">
                {t("resendVerification")}
              </p>
              <input
                type="email"
                placeholder={t("email")}
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                className="w-full px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
              />
              <button
                onClick={handleResend}
                disabled={!resendEmail || resendStatus === "sending"}
                className="w-full bg-primary-700 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-primary-800 disabled:opacity-50 transition-colors"
              >
                {resendStatus === "sending" ? "..." : t("resendVerification")}
              </button>
              {resendStatus === "sent" && (
                <p className="text-green-700 text-sm">{t("resendSuccess")}</p>
              )}
              {resendStatus === "error" && (
                <p className="text-red-700 text-sm">{t("resendRateLimited")}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
