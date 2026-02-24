"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

interface ChurchItem {
  id: string;
  name: string;
  nameEs: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  phone: string | null;
  email: string | null;
  pastor: string | null;
  notes: string | null;
  isActive: boolean;
  registrationStatus: string;
  _count: { resources: number; users: number };
}

interface ChurchesClientProps {
  initialChurches: ChurchItem[];
}

const emptyForm = {
  name: "",
  nameEs: "",
  address: "",
  city: "",
  state: "TX",
  zip: "",
  phone: "",
  email: "",
  pastor: "",
  notes: "",
};

export function ChurchesClient({ initialChurches }: ChurchesClientProps) {
  const t = useTranslations("admin");
  const router = useRouter();

  const [churches, setChurches] = useState(initialChurches);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createForm, setCreateForm] = useState({ ...emptyForm });
  const [editForm, setEditForm] = useState({ ...emptyForm });

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setSaving(true);

    const payload: Record<string, unknown> = { name: createForm.name };
    if (createForm.nameEs) payload.nameEs = createForm.nameEs;
    if (createForm.address) payload.address = createForm.address;
    if (createForm.city) payload.city = createForm.city;
    if (createForm.state) payload.state = createForm.state;
    if (createForm.zip) payload.zip = createForm.zip;
    if (createForm.phone) payload.phone = createForm.phone;
    if (createForm.email) payload.email = createForm.email;
    if (createForm.pastor) payload.pastor = createForm.pastor;
    if (createForm.notes) payload.notes = createForm.notes;

    const res = await fetch("/api/admin/churches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const newChurch = await res.json();
      setChurches((prev) =>
        [...prev, newChurch].sort((a, b) => a.name.localeCompare(b.name))
      );
      setCreateForm({ ...emptyForm });
      setShowCreateForm(false);
      setSuccess(t("churchCreated"));
    } else {
      const data = await res.json();
      setError(data.error || "Error creating church");
    }
    setSaving(false);
  };

  const startEdit = (church: ChurchItem) => {
    setEditingId(church.id);
    setEditForm({
      name: church.name,
      nameEs: church.nameEs || "",
      address: church.address || "",
      city: church.city || "",
      state: church.state || "TX",
      zip: church.zip || "",
      phone: church.phone || "",
      email: church.email || "",
      pastor: church.pastor || "",
      notes: church.notes || "",
    });
    clearMessages();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    clearMessages();
    setSaving(true);

    const res = await fetch(`/api/admin/churches/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editForm.name,
        nameEs: editForm.nameEs || null,
        address: editForm.address || null,
        city: editForm.city || null,
        state: editForm.state || null,
        zip: editForm.zip || null,
        phone: editForm.phone || null,
        email: editForm.email || null,
        pastor: editForm.pastor || null,
        notes: editForm.notes || null,
      }),
    });

    if (res.ok) {
      const updated = await res.json();
      setChurches((prev) =>
        prev.map((c) => (c.id === editingId ? updated : c))
      );
      setEditingId(null);
      setSuccess(t("churchUpdated"));
    } else {
      const data = await res.json();
      setError(data.error || "Error updating church");
    }
    setSaving(false);
  };

  const toggleActive = async (church: ChurchItem) => {
    const action = church.isActive ? t("confirmDeactivateChurch") : null;
    if (action && !confirm(action)) return;
    clearMessages();

    const res = await fetch(`/api/admin/churches/${church.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !church.isActive }),
    });

    if (res.ok) {
      const updated = await res.json();
      setChurches((prev) =>
        prev.map((c) => (c.id === church.id ? updated : c))
      );
      setSuccess(church.isActive ? t("churchDeactivated") : t("churchActivated"));
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Error toggling church status");
    }
  };

  const renderFormFields = (
    form: typeof emptyForm,
    setForm: (f: typeof emptyForm) => void
  ) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-primary-700 mb-1">
          {t("name")} *
        </label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-primary-700 mb-1">
          {t("nameEs")}
        </label>
        <input
          type="text"
          value={form.nameEs}
          onChange={(e) => setForm({ ...form, nameEs: e.target.value })}
          className="w-full px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-primary-700 mb-1">
          {t("address")}
        </label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="w-full px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-primary-700 mb-1">
          {t("city")}
        </label>
        <input
          type="text"
          value={form.city}
          onChange={(e) => setForm({ ...form, city: e.target.value })}
          className="w-full px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
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
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
            className="w-full px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-primary-700 mb-1">
            {t("zip")}
          </label>
          <input
            type="text"
            maxLength={10}
            value={form.zip}
            onChange={(e) => setForm({ ...form, zip: e.target.value })}
            className="w-full px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-primary-700 mb-1">
          {t("phone")}
        </label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-primary-700 mb-1">
          {t("email")}
        </label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-primary-700 mb-1">
          {t("pastor")}
        </label>
        <input
          type="text"
          value={form.pastor}
          onChange={(e) => setForm({ ...form, pastor: e.target.value })}
          className="w-full px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-primary-700 mb-1">
          {t("notes")}
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={2}
          className="w-full px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
        />
      </div>
    </div>
  );

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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-primary-800">
          {t("manageChurches")}
        </h1>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setEditingId(null);
            clearMessages();
          }}
          className="inline-flex items-center gap-2 bg-primary-700 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-800 transition-colors text-sm"
        >
          + {t("addChurch")}
        </button>
      </div>

      {/* Messages */}
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

      {/* Create form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 p-4 border border-primary-200 rounded-lg bg-primary-50 space-y-4"
        >
          <h2 className="font-semibold text-primary-800">{t("addChurch")}</h2>
          {renderFormFields(createForm, setCreateForm)}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-800 disabled:opacity-50"
            >
              {saving ? t("creating") : t("create")}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 rounded-md text-sm font-medium text-primary-600 hover:bg-primary-100"
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      )}

      {/* Churches table */}
      {churches.length === 0 ? (
        <p className="text-primary-500 py-8 text-center">{t("noChurches")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary-200 text-left text-primary-600">
                <th className="py-3 pr-4 font-medium">{t("name")}</th>
                <th className="py-3 pr-4 font-medium hidden sm:table-cell">
                  {t("nameEs")}
                </th>
                <th className="py-3 pr-4 font-medium hidden md:table-cell">
                  {t("city")}
                </th>
                <th className="py-3 pr-4 font-medium hidden lg:table-cell">
                  {t("pastor")}
                </th>
                <th className="py-3 pr-4 font-medium">{t("resourceCount")}</th>
                <th className="py-3 pr-4 font-medium hidden sm:table-cell">
                  {t("userCount")}
                </th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 pr-4 font-medium hidden sm:table-cell">
                  {t("registrationStatus")}
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
                  {editingId === church.id ? (
                    <td colSpan={9} className="py-3">
                      <form
                        onSubmit={handleEdit}
                        className="space-y-4 p-3 bg-primary-50 rounded-lg"
                      >
                        {renderFormFields(editForm, setEditForm)}
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={saving}
                            className="bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-800 disabled:opacity-50"
                          >
                            {saving ? t("saving") : t("save")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="px-4 py-2 rounded-md text-sm font-medium text-primary-600 hover:bg-primary-100"
                          >
                            {t("cancel")}
                          </button>
                        </div>
                      </form>
                    </td>
                  ) : (
                    <>
                      <td className="py-3 pr-4 font-medium text-primary-800">
                        {church.name}
                      </td>
                      <td className="py-3 pr-4 text-primary-500 hidden sm:table-cell">
                        {church.nameEs || "—"}
                      </td>
                      <td className="py-3 pr-4 text-primary-500 hidden md:table-cell">
                        {church.city || "—"}
                      </td>
                      <td className="py-3 pr-4 text-primary-500 hidden lg:table-cell">
                        {church.pastor || "—"}
                      </td>
                      <td className="py-3 pr-4 text-primary-600">
                        {church._count.resources}
                      </td>
                      <td className="py-3 pr-4 text-primary-600 hidden sm:table-cell">
                        {church._count.users}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            church.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {church.isActive ? t("active") : t("inactive")}
                        </span>
                      </td>
                      <td className="py-3 pr-4 hidden sm:table-cell">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            church.registrationStatus === "APPROVED"
                              ? "bg-green-100 text-green-700"
                              : church.registrationStatus === "PENDING"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {t(church.registrationStatus as "PENDING" | "APPROVED" | "REJECTED")}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          onClick={() => startEdit(church)}
                          className="text-accent-600 hover:text-accent-700 font-medium"
                        >
                          {t("editChurch").split(" ")[0]}
                        </button>
                        <button
                          onClick={() => toggleActive(church)}
                          className={`font-medium ${
                            church.isActive
                              ? "text-red-600 hover:text-red-700"
                              : "text-green-600 hover:text-green-700"
                          }`}
                        >
                          {church.isActive ? t("deactivate") : t("activate")}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
