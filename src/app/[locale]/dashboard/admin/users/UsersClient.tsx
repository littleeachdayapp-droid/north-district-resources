"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";

interface UserItem {
  id: string;
  username: string;
  displayName: string;
  role: string;
  isActive: boolean;
  churchId: string | null;
  church: { id: string; name: string; nameEs: string | null } | null;
  createdAt: string | Date;
}

interface Church {
  id: string;
  name: string;
  nameEs: string | null;
}

interface UsersClientProps {
  initialUsers: UserItem[];
  churches: Church[];
}

export function UsersClient({ initialUsers, churches }: UsersClientProps) {
  const t = useTranslations("admin");
  const router = useRouter();

  const [users, setUsers] = useState(initialUsers);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create form state
  const [createForm, setCreateForm] = useState({
    username: "",
    password: "",
    displayName: "",
    role: "EDITOR",
    churchId: "",
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    displayName: "",
    password: "",
    role: "",
    churchId: "",
  });

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setSaving(true);

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...createForm,
        churchId: createForm.churchId || null,
      }),
    });

    if (res.ok) {
      const newUser = await res.json();
      setUsers((prev) => [...prev, newUser].sort((a, b) => a.displayName.localeCompare(b.displayName)));
      setCreateForm({ username: "", password: "", displayName: "", role: "EDITOR", churchId: "" });
      setShowCreateForm(false);
      setSuccess(t("userCreated"));
    } else {
      const data = await res.json();
      setError(data.error || "Error creating user");
    }
    setSaving(false);
  };

  const startEdit = (user: UserItem) => {
    setEditingId(user.id);
    setEditForm({
      displayName: user.displayName,
      password: "",
      role: user.role,
      churchId: user.churchId || "",
    });
    clearMessages();
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    clearMessages();
    setSaving(true);

    const payload: Record<string, unknown> = {
      displayName: editForm.displayName,
      role: editForm.role,
      churchId: editForm.churchId || null,
    };
    if (editForm.password) {
      payload.password = editForm.password;
    }

    const res = await fetch(`/api/admin/users/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === editingId ? updated : u)));
      setEditingId(null);
      setSuccess(t("userUpdated"));
    } else {
      const data = await res.json();
      setError(data.error || "Error updating user");
    }
    setSaving(false);
  };

  const toggleActive = async (user: UserItem) => {
    const action = user.isActive ? t("confirmDeactivate") : null;
    if (action && !confirm(action)) return;
    clearMessages();

    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });

    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      setSuccess(user.isActive ? t("userDeactivated") : t("userActivated"));
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Error toggling user status");
    }
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-primary-800">
          {t("manageUsers")}
        </h1>
        <button
          onClick={() => {
            setShowCreateForm(!showCreateForm);
            setEditingId(null);
            clearMessages();
          }}
          className="inline-flex items-center gap-2 bg-primary-700 text-white px-4 py-2 rounded-md font-medium hover:bg-primary-800 transition-colors text-sm"
        >
          + {t("addUser")}
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
          <h2 className="font-semibold text-primary-800">{t("addUser")}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                {t("username")}
              </label>
              <input
                type="text"
                required
                value={createForm.username}
                onChange={(e) =>
                  setCreateForm({ ...createForm, username: e.target.value.toLowerCase() })
                }
                pattern="^[a-z0-9_]+$"
                className="w-full px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                {t("password")}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm({ ...createForm, password: e.target.value })
                }
                className="w-full px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                {t("displayName")}
              </label>
              <input
                type="text"
                required
                value={createForm.displayName}
                onChange={(e) =>
                  setCreateForm({ ...createForm, displayName: e.target.value })
                }
                className="w-full px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary-700 mb-1">
                {t("role")}
              </label>
              <select
                value={createForm.role}
                onChange={(e) =>
                  setCreateForm({ ...createForm, role: e.target.value })
                }
                className="w-full px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
              >
                <option value="EDITOR">Editor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            {createForm.role === "EDITOR" && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-primary-700 mb-1">
                  {t("selectChurch")}
                </label>
                <select
                  value={createForm.churchId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, churchId: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
                >
                  <option value="">{t("selectChurch")}</option>
                  {churches.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
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

      {/* Users table */}
      {users.length === 0 ? (
        <p className="text-primary-500 py-8 text-center">{t("noUsers")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary-200 text-left text-primary-600">
                <th className="py-3 pr-4 font-medium">{t("username")}</th>
                <th className="py-3 pr-4 font-medium hidden sm:table-cell">
                  {t("displayName")}
                </th>
                <th className="py-3 pr-4 font-medium">{t("role")}</th>
                <th className="py-3 pr-4 font-medium hidden md:table-cell">
                  {t("selectChurch")}
                </th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-primary-100 hover:bg-primary-50"
                >
                  {editingId === u.id ? (
                    <td colSpan={6} className="py-3">
                      <form onSubmit={handleEdit} className="space-y-4 p-3 bg-primary-50 rounded-lg">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-primary-700 mb-1">
                              {t("displayName")}
                            </label>
                            <input
                              type="text"
                              required
                              value={editForm.displayName}
                              onChange={(e) =>
                                setEditForm({ ...editForm, displayName: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-primary-700 mb-1">
                              {t("newPassword")}
                            </label>
                            <input
                              type="password"
                              minLength={6}
                              value={editForm.password}
                              onChange={(e) =>
                                setEditForm({ ...editForm, password: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-primary-700 mb-1">
                              {t("role")}
                            </label>
                            <select
                              value={editForm.role}
                              onChange={(e) =>
                                setEditForm({ ...editForm, role: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
                            >
                              <option value="EDITOR">Editor</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </div>
                          {editForm.role === "EDITOR" && (
                            <div>
                              <label className="block text-sm font-medium text-primary-700 mb-1">
                                {t("selectChurch")}
                              </label>
                              <select
                                value={editForm.churchId}
                                onChange={(e) =>
                                  setEditForm({ ...editForm, churchId: e.target.value })
                                }
                                required
                                className="w-full px-3 py-2 border border-primary-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-400"
                              >
                                <option value="">{t("selectChurch")}</option>
                                {churches.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
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
                        {u.username}
                      </td>
                      <td className="py-3 pr-4 text-primary-600 hidden sm:table-cell">
                        {u.displayName}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            u.role === "ADMIN"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-primary-500 hidden md:table-cell">
                        {u.church?.name || t("noneAssigned")}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            u.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {u.isActive ? t("active") : t("inactive")}
                        </span>
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          onClick={() => startEdit(u)}
                          className="text-accent-600 hover:text-accent-700 font-medium"
                        >
                          {t("editUser").split(" ")[0]}
                        </button>
                        <button
                          onClick={() => toggleActive(u)}
                          className={`font-medium ${
                            u.isActive
                              ? "text-red-600 hover:text-red-700"
                              : "text-green-600 hover:text-green-700"
                          }`}
                        >
                          {u.isActive ? t("deactivate") : t("activate")}
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
