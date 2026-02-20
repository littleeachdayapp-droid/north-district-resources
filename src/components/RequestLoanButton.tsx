"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";

interface RequestLoanButtonProps {
  resourceId: string;
  resourceChurchId: string;
  availabilityStatus: string;
}

export function RequestLoanButton({
  resourceId,
  resourceChurchId,
  availabilityStatus,
}: RequestLoanButtonProps) {
  const { user, loading } = useAuth();
  const tL = useTranslations("loans");
  const [expanded, setExpanded] = useState(false);
  const [neededByDate, setNeededByDate] = useState("");
  const [returnByDate, setReturnByDate] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (loading) return null;

  // Not logged in
  if (!user) {
    return (
      <p className="text-sm text-primary-400 italic mt-4">
        {tL("loginToRequest")}
      </p>
    );
  }

  // Own church's resource
  if (user.churchId === resourceChurchId) {
    return null;
  }

  // Not available
  if (availabilityStatus !== "AVAILABLE") {
    return (
      <p className="text-sm text-primary-400 italic mt-4">
        {tL("resourceUnavailable")}
      </p>
    );
  }

  // Already submitted
  if (success) {
    return (
      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm font-medium text-green-700">
          {tL("requestSent")}
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const res = await fetch("/api/loan-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resourceId,
        neededByDate: neededByDate || null,
        returnByDate: returnByDate || null,
        message: message || null,
      }),
    });

    if (res.ok) {
      setSuccess(true);
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong");
    }
    setSubmitting(false);
  };

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="mt-4 inline-flex items-center gap-2 bg-accent-500 text-white px-4 py-2 rounded-md font-medium hover:bg-accent-600 transition-colors text-sm"
      >
        {tL("requestLoan")}
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 bg-primary-50 border border-primary-200 rounded-lg p-4 space-y-3"
    >
      <h3 className="text-sm font-semibold text-primary-800">
        {tL("requestLoan")}
      </h3>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-primary-600 mb-1">
            {tL("neededBy")}
          </label>
          <input
            type="date"
            value={neededByDate}
            onChange={(e) => setNeededByDate(e.target.value)}
            className="w-full px-3 py-1.5 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-primary-600 mb-1">
            {tL("returnBy")}
          </label>
          <input
            type="date"
            value={returnByDate}
            onChange={(e) => setReturnByDate(e.target.value)}
            className="w-full px-3 py-1.5 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-primary-600 mb-1">
          {tL("message")}
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          maxLength={1000}
          className="w-full px-3 py-1.5 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400 resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-accent-500 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-accent-600 transition-colors disabled:opacity-50"
        >
          {submitting ? tL("submitting") : tL("submitRequest")}
        </button>
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="text-primary-500 hover:text-primary-700 px-4 py-1.5 rounded-md text-sm font-medium"
        >
          {tL("cancel")}
        </button>
      </div>
    </form>
  );
}
