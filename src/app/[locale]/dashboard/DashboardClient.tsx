"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";

interface Resource {
  id: string;
  title: string;
  category: string;
  subcategory: string | null;
  availabilityStatus: string;
  church: { id: string; name: string; nameEs: string | null };
}

interface LoanRequestItem {
  id: string;
  status: string;
  requestDate: string | Date;
  neededByDate: string | Date | null;
  returnByDate: string | Date | null;
  message: string | null;
  responseMessage: string | null;
  resource: {
    id: string;
    title: string;
    churchId: string;
    church: { id: string; name: string; nameEs: string | null };
  };
  requestingChurch: { id: string; name: string; nameEs: string | null };
}

interface LoanItem {
  id: string;
  status: string;
  startDate: string | Date;
  dueDate: string | Date | null;
  returnDate: string | Date | null;
  notes: string | null;
  resource: { id: string; title: string };
  borrowingChurch: { id: string; name: string; nameEs: string | null };
  lendingChurch: { id: string; name: string; nameEs: string | null };
}

interface DashboardClientProps {
  user: {
    displayName: string;
    role: string;
    churchId: string | null;
    churchName: string | null;
  };
  resources: Resource[];
  churches: { id: string; name: string; nameEs: string | null }[];
  incomingRequests: LoanRequestItem[];
  outgoingRequests: LoanRequestItem[];
  lentLoans: LoanItem[];
  borrowedLoans: LoanItem[];
}

type Tab = "resources" | "requests" | "loans";

const REQUEST_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  DENIED: "bg-red-100 text-red-800",
  CANCELLED: "bg-gray-100 text-gray-600",
};

const LOAN_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-800",
  RETURNED: "bg-green-100 text-green-800",
  OVERDUE: "bg-orange-100 text-orange-800",
  LOST: "bg-red-100 text-red-800",
};

function formatDate(dateVal: string | Date | null): string {
  if (!dateVal) return "—";
  const d = typeof dateVal === "string" ? new Date(dateVal) : dateVal;
  return d.toLocaleDateString();
}

export function DashboardClient({
  user,
  resources,
  churches,
  incomingRequests,
  outgoingRequests,
  lentLoans,
  borrowedLoans,
}: DashboardClientProps) {
  const t = useTranslations("auth");
  const tL = useTranslations("loans");
  const tCat = useTranslations("categories");
  const tSub = useTranslations("subcategories");
  const router = useRouter();
  const isAdmin = user.role === "ADMIN";

  const [tab, setTab] = useState<Tab>("resources");
  const [filterChurchId, setFilterChurchId] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filtered = filterChurchId
    ? resources.filter((r) => r.church.id === filterChurchId)
    : resources;

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    setDeleting(id);
    const res = await fetch(`/api/resources/${id}`, { method: "DELETE" });
    if (res.ok) {
      router.refresh();
    }
    setDeleting(null);
  };

  const handleRequestAction = async (
    requestId: string,
    status: "APPROVED" | "DENIED" | "CANCELLED"
  ) => {
    setActionLoading(requestId);
    const res = await fetch(`/api/loan-requests/${requestId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      router.refresh();
    }
    setActionLoading(null);
  };

  const handleLoanAction = async (
    loanId: string,
    status: "RETURNED" | "OVERDUE" | "LOST"
  ) => {
    setActionLoading(loanId);
    const res = await fetch(`/api/loans/${loanId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      router.refresh();
    }
    setActionLoading(null);
  };

  const pendingIncoming = incomingRequests.filter((r) => r.status === "PENDING");
  const pendingOutgoing = outgoingRequests.filter((r) => r.status === "PENDING");
  const activeLoansLent = lentLoans.filter(
    (l) => l.status === "ACTIVE" || l.status === "OVERDUE"
  );
  const activeLoansBorrowed = borrowedLoans.filter(
    (l) => l.status === "ACTIVE" || l.status === "OVERDUE"
  );

  const requestBadge =
    pendingIncoming.length > 0
      ? ` (${pendingIncoming.length})`
      : "";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-800">
            {t("dashboard")}
          </h1>
          <p className="text-sm text-primary-500">
            {t("welcome", { name: user.displayName })}
            {user.churchName && (
              <span className="ml-1">— {user.churchName}</span>
            )}
          </p>
        </div>
        <Link
          href={"/dashboard/resources/new" as never}
          className="inline-flex items-center gap-2 bg-primary-700 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-800 transition-colors text-sm"
        >
          + {t("addResource")}
        </Link>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-primary-200 mb-6">
        <button
          onClick={() => setTab("resources")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "resources"
              ? "border-accent-500 text-accent-700"
              : "border-transparent text-primary-500 hover:text-primary-700"
          }`}
        >
          {isAdmin ? t("allResources") : t("myResources")}
        </button>
        <button
          onClick={() => setTab("requests")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "requests"
              ? "border-accent-500 text-accent-700"
              : "border-transparent text-primary-500 hover:text-primary-700"
          }`}
        >
          {tL("loanRequests")}{requestBadge}
        </button>
        <button
          onClick={() => setTab("loans")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "loans"
              ? "border-accent-500 text-accent-700"
              : "border-transparent text-primary-500 hover:text-primary-700"
          }`}
        >
          {tL("activeLoans")}
        </button>
      </div>

      {/* Resources tab */}
      {tab === "resources" && (
        <>
          {isAdmin && churches.length > 0 && (
            <div className="mb-4">
              <select
                value={filterChurchId}
                onChange={(e) => setFilterChurchId(e.target.value)}
                className="px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
              >
                <option value="">{t("allResources")}</option>
                {churches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {filtered.length === 0 ? (
            <p className="text-primary-500 py-8 text-center">
              {t("noResources")}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary-200 text-left text-primary-600">
                    <th className="py-3 pr-4 font-medium">{t("title")}</th>
                    <th className="py-3 pr-4 font-medium hidden sm:table-cell">
                      {tCat("MUSIC")}/{tCat("STUDY")}
                    </th>
                    <th className="py-3 pr-4 font-medium hidden md:table-cell">
                      {tSub("HYMNAL").split(" ")[0]}
                    </th>
                    {isAdmin && (
                      <th className="py-3 pr-4 font-medium hidden lg:table-cell">
                        {t("church")}
                      </th>
                    )}
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 font-medium text-right">
                      {t("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((resource) => (
                    <tr
                      key={resource.id}
                      className="border-b border-primary-100 hover:bg-primary-50"
                    >
                      <td className="py-3 pr-4 font-medium text-primary-800">
                        {resource.title}
                      </td>
                      <td className="py-3 pr-4 hidden sm:table-cell">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            resource.category === "MUSIC"
                              ? "bg-music-100 text-music-700"
                              : "bg-study-100 text-study-700"
                          }`}
                        >
                          {tCat(resource.category as "MUSIC" | "STUDY")}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-primary-500 hidden md:table-cell">
                        {resource.subcategory
                          ? tSub(resource.subcategory as never)
                          : "—"}
                      </td>
                      {isAdmin && (
                        <td className="py-3 pr-4 text-primary-500 hidden lg:table-cell">
                          {resource.church.name}
                        </td>
                      )}
                      <td className="py-3 pr-4">
                        <AvailabilityBadge
                          status={resource.availabilityStatus}
                        />
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <Link
                          href={
                            `/dashboard/resources/${resource.id}/edit` as never
                          }
                          className="text-accent-600 hover:text-accent-700 font-medium"
                        >
                          {t("edit")}
                        </Link>
                        <button
                          onClick={() => handleDelete(resource.id)}
                          disabled={deleting === resource.id}
                          className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                        >
                          {deleting === resource.id ? "..." : t("delete")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Loan Requests tab */}
      {tab === "requests" && (
        <div className="space-y-8">
          {/* Incoming requests */}
          <section>
            <h2 className="text-lg font-semibold text-primary-800 mb-3">
              {tL("incomingRequests")}
            </h2>
            {incomingRequests.length === 0 ? (
              <p className="text-primary-500 py-4 text-center text-sm">
                {tL("noRequests")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-primary-200 text-left text-primary-600">
                      <th className="py-3 pr-4 font-medium">
                        {tL("resourceTitle")}
                      </th>
                      <th className="py-3 pr-4 font-medium hidden sm:table-cell">
                        {tL("requestingChurch")}
                      </th>
                      <th className="py-3 pr-4 font-medium hidden md:table-cell">
                        {tL("date")}
                      </th>
                      <th className="py-3 pr-4 font-medium">{tL("status")}</th>
                      <th className="py-3 font-medium text-right">
                        {tL("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomingRequests.map((req) => (
                      <tr
                        key={req.id}
                        className="border-b border-primary-100 hover:bg-primary-50"
                      >
                        <td className="py-3 pr-4 font-medium text-primary-800">
                          {req.resource.title}
                        </td>
                        <td className="py-3 pr-4 text-primary-500 hidden sm:table-cell">
                          {req.requestingChurch.name}
                        </td>
                        <td className="py-3 pr-4 text-primary-500 hidden md:table-cell">
                          {formatDate(req.requestDate)}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${REQUEST_STATUS_COLORS[req.status] || ""}`}
                          >
                            {tL(req.status.toLowerCase() as "pending")}
                          </span>
                        </td>
                        <td className="py-3 text-right space-x-2">
                          {req.status === "PENDING" && (
                            <>
                              <button
                                onClick={() =>
                                  handleRequestAction(req.id, "APPROVED")
                                }
                                disabled={actionLoading === req.id}
                                className="text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                              >
                                {actionLoading === req.id
                                  ? tL("approving")
                                  : tL("approve")}
                              </button>
                              <button
                                onClick={() =>
                                  handleRequestAction(req.id, "DENIED")
                                }
                                disabled={actionLoading === req.id}
                                className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                              >
                                {tL("deny")}
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Outgoing requests (editors only — admin sees all in incoming) */}
          {!isAdmin && (
            <section>
              <h2 className="text-lg font-semibold text-primary-800 mb-3">
                {tL("outgoingRequests")}
              </h2>
              {outgoingRequests.length === 0 ? (
                <p className="text-primary-500 py-4 text-center text-sm">
                  {tL("noRequests")}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-primary-200 text-left text-primary-600">
                        <th className="py-3 pr-4 font-medium">
                          {tL("resourceTitle")}
                        </th>
                        <th className="py-3 pr-4 font-medium hidden sm:table-cell">
                          {tL("owningChurch")}
                        </th>
                        <th className="py-3 pr-4 font-medium hidden md:table-cell">
                          {tL("date")}
                        </th>
                        <th className="py-3 pr-4 font-medium">
                          {tL("status")}
                        </th>
                        <th className="py-3 font-medium text-right">
                          {tL("actions")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {outgoingRequests.map((req) => (
                        <tr
                          key={req.id}
                          className="border-b border-primary-100 hover:bg-primary-50"
                        >
                          <td className="py-3 pr-4 font-medium text-primary-800">
                            {req.resource.title}
                          </td>
                          <td className="py-3 pr-4 text-primary-500 hidden sm:table-cell">
                            {req.resource.church.name}
                          </td>
                          <td className="py-3 pr-4 text-primary-500 hidden md:table-cell">
                            {formatDate(req.requestDate)}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${REQUEST_STATUS_COLORS[req.status] || ""}`}
                            >
                              {tL(req.status.toLowerCase() as "pending")}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {req.status === "PENDING" && (
                              <button
                                onClick={() =>
                                  handleRequestAction(req.id, "CANCELLED")
                                }
                                disabled={actionLoading === req.id}
                                className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                              >
                                {tL("cancel")}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* Active Loans tab */}
      {tab === "loans" && (
        <div className="space-y-8">
          {/* Lent out */}
          <section>
            <h2 className="text-lg font-semibold text-primary-800 mb-3">
              {tL("lentItems")}
            </h2>
            {lentLoans.length === 0 ? (
              <p className="text-primary-500 py-4 text-center text-sm">
                {tL("noLoans")}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-primary-200 text-left text-primary-600">
                      <th className="py-3 pr-4 font-medium">
                        {tL("resourceTitle")}
                      </th>
                      <th className="py-3 pr-4 font-medium hidden sm:table-cell">
                        {tL("borrowingChurch")}
                      </th>
                      <th className="py-3 pr-4 font-medium hidden md:table-cell">
                        {tL("startDate")}
                      </th>
                      <th className="py-3 pr-4 font-medium hidden md:table-cell">
                        {tL("dueDate")}
                      </th>
                      <th className="py-3 pr-4 font-medium">{tL("status")}</th>
                      <th className="py-3 font-medium text-right">
                        {tL("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lentLoans.map((loan) => (
                      <tr
                        key={loan.id}
                        className="border-b border-primary-100 hover:bg-primary-50"
                      >
                        <td className="py-3 pr-4 font-medium text-primary-800">
                          {loan.resource.title}
                        </td>
                        <td className="py-3 pr-4 text-primary-500 hidden sm:table-cell">
                          {loan.borrowingChurch.name}
                        </td>
                        <td className="py-3 pr-4 text-primary-500 hidden md:table-cell">
                          {formatDate(loan.startDate)}
                        </td>
                        <td className="py-3 pr-4 text-primary-500 hidden md:table-cell">
                          {formatDate(loan.dueDate)}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${LOAN_STATUS_COLORS[loan.status] || ""}`}
                          >
                            {tL(loan.status.toLowerCase() as "active")}
                          </span>
                        </td>
                        <td className="py-3 text-right space-x-2">
                          {(loan.status === "ACTIVE" ||
                            loan.status === "OVERDUE") && (
                            <>
                              <button
                                onClick={() =>
                                  handleLoanAction(loan.id, "RETURNED")
                                }
                                disabled={actionLoading === loan.id}
                                className="text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
                              >
                                {actionLoading === loan.id
                                  ? tL("returning")
                                  : tL("markReturned")}
                              </button>
                              {loan.status === "ACTIVE" && (
                                <button
                                  onClick={() =>
                                    handleLoanAction(loan.id, "OVERDUE")
                                  }
                                  disabled={actionLoading === loan.id}
                                  className="text-orange-600 hover:text-orange-700 font-medium disabled:opacity-50"
                                >
                                  {tL("markOverdue")}
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  handleLoanAction(loan.id, "LOST")
                                }
                                disabled={actionLoading === loan.id}
                                className="text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                              >
                                {tL("markLost")}
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Borrowed */}
          {!isAdmin && (
            <section>
              <h2 className="text-lg font-semibold text-primary-800 mb-3">
                {tL("borrowedItems")}
              </h2>
              {borrowedLoans.length === 0 ? (
                <p className="text-primary-500 py-4 text-center text-sm">
                  {tL("noLoans")}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-primary-200 text-left text-primary-600">
                        <th className="py-3 pr-4 font-medium">
                          {tL("resourceTitle")}
                        </th>
                        <th className="py-3 pr-4 font-medium hidden sm:table-cell">
                          {tL("lendingChurch")}
                        </th>
                        <th className="py-3 pr-4 font-medium hidden md:table-cell">
                          {tL("startDate")}
                        </th>
                        <th className="py-3 pr-4 font-medium hidden md:table-cell">
                          {tL("dueDate")}
                        </th>
                        <th className="py-3 pr-4 font-medium">
                          {tL("status")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {borrowedLoans.map((loan) => (
                        <tr
                          key={loan.id}
                          className="border-b border-primary-100 hover:bg-primary-50"
                        >
                          <td className="py-3 pr-4 font-medium text-primary-800">
                            {loan.resource.title}
                          </td>
                          <td className="py-3 pr-4 text-primary-500 hidden sm:table-cell">
                            {loan.lendingChurch.name}
                          </td>
                          <td className="py-3 pr-4 text-primary-500 hidden md:table-cell">
                            {formatDate(loan.startDate)}
                          </td>
                          <td className="py-3 pr-4 text-primary-500 hidden md:table-cell">
                            {formatDate(loan.dueDate)}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${LOAN_STATUS_COLORS[loan.status] || ""}`}
                            >
                              {tL(loan.status.toLowerCase() as "active")}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
