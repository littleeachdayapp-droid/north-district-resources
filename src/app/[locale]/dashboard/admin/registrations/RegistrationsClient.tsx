"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

interface PendingChurch {
  id: string;
  name: string;
  city: string | null;
  pastor: string | null;
  createdAt: string | Date;
  users: { displayName: string; email: string | null }[];
}

interface RegistrationsClientProps {
  initialChurches: PendingChurch[];
}

export function RegistrationsClient({ initialChurches }: RegistrationsClientProps) {
  const t = useTranslations("admin");
  const router = useRouter();

  const [churches, setChurches] = useState(initialChurches);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/churches/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE" }),
      });

      if (res.ok) {
        setChurches((prev) => prev.filter((c) => c.id !== id));
        setSuccess(t("churchApproved"));
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Error");
      }
    } catch {
      setError("Error");
    }
    setProcessingId(null);
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/churches/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REJECT",
          rejectionReason: rejectionReason || undefined,
        }),
      });

      if (res.ok) {
        setChurches((prev) => prev.filter((c) => c.id !== id));
        setRejectingId(null);
        setRejectionReason("");
        setSuccess(t("churchRejected"));
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Error");
      }
    } catch {
      setError("Error");
    }
    setProcessingId(null);
  };

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

      <h1 className="text-2xl font-bold text-primary-800 mb-6">
        {t("pendingRegistrations")}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md text-sm">
          {success}
        </div>
      )}

      {churches.length === 0 ? (
        <p className="text-primary-500 py-8 text-center">
          {t("noPendingRegistrations")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary-200 text-left text-primary-600">
                <th className="py-3 pr-4 font-medium">{t("name")}</th>
                <th className="py-3 pr-4 font-medium hidden sm:table-cell">
                  {t("city")}
                </th>
                <th className="py-3 pr-4 font-medium hidden md:table-cell">
                  {t("pastor")}
                </th>
                <th className="py-3 pr-4 font-medium hidden lg:table-cell">
                  {t("primaryContact")}
                </th>
                <th className="py-3 pr-4 font-medium hidden lg:table-cell">
                  {t("registrationDate")}
                </th>
                <th className="py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {churches.map((church) => (
                <tr
                  key={church.id}
                  className="border-b border-primary-100 hover:bg-primary-50"
                >
                  <td className="py-3 pr-4 font-medium text-primary-800">
                    {church.name}
                  </td>
                  <td className="py-3 pr-4 text-primary-500 hidden sm:table-cell">
                    {church.city || "—"}
                  </td>
                  <td className="py-3 pr-4 text-primary-500 hidden md:table-cell">
                    {church.pastor || "—"}
                  </td>
                  <td className="py-3 pr-4 text-primary-500 hidden lg:table-cell">
                    {church.users[0] ? (
                      <div>
                        <div>{church.users[0].displayName}</div>
                        <div className="text-xs text-primary-400">
                          {church.users[0].email}
                        </div>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-3 pr-4 text-primary-500 hidden lg:table-cell">
                    {new Date(church.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 text-right">
                    {rejectingId === church.id ? (
                      <div className="flex flex-col items-end gap-2">
                        <input
                          type="text"
                          placeholder={t("rejectionReason")}
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-48 px-2 py-1 border border-primary-300 rounded text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReject(church.id)}
                            disabled={processingId === church.id}
                            className="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
                          >
                            {processingId === church.id
                              ? t("rejecting")
                              : t("rejectChurch")}
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(null);
                              setRejectionReason("");
                            }}
                            className="text-primary-500 hover:text-primary-700 font-medium text-sm"
                          >
                            {t("cancel")}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleApprove(church.id)}
                          disabled={processingId === church.id}
                          className="text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                        >
                          {processingId === church.id
                            ? t("approving")
                            : t("approveChurch")}
                        </button>
                        <button
                          onClick={() => setRejectingId(church.id)}
                          className="text-red-600 hover:text-red-700 font-medium"
                        >
                          {t("rejectChurch")}
                        </button>
                      </div>
                    )}
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
