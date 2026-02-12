"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Admin = {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const ManageAdminsPage = (): JSX.Element => {
  const router = useRouter();
  const { status } = useSession({
    required: true,
    onUnauthenticated: () => {
      router.push("/admin/login");
    },
  });

  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleToggleForm = useCallback((): void => {
    setShowAddForm(!showAddForm);
  }, [showAddForm]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setEmail(e.target.value);
  }, []);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setPassword(e.target.value);
  }, []);

  const fetchAdmins = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/admin/admins");
      if (!response.ok) throw new Error("Failed to fetch admins");

      const data = await response.json();
      setAdmins(data.admins);
    } catch (err) {
      setError("Failed to load admins");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAdmins();
    }
  }, [status, fetchAdmins]);

  const handleAddAdmin = useCallback(
    async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();
      setIsSubmitting(true);
      setError("");

      try {
        const response = await fetch("/api/admin/admins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to add admin");
        }

        setEmail("");
        setPassword("");
        setShowAddForm(false);
        await fetchAdmins();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add admin");
      } finally {
        setIsSubmitting(false);
      }
    },
    [email, password, fetchAdmins],
  );

  const handleDeleteAdmin = useCallback(
    async (id: string): Promise<void> => {
      setIsSubmitting(true);
      setError("");

      try {
        const response = await fetch(`/api/admin/admins/${id}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to delete admin");
        }

        setDeleteConfirmId(null);
        await fetchAdmins();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete admin");
      } finally {
        setIsSubmitting(false);
      }
    },
    [fetchAdmins],
  );

  const handleConfirmDelete = useCallback(
    (id: string) => (): void => {
      handleDeleteAdmin(id);
    },
    [handleDeleteAdmin],
  );

  const handleCancelDelete = useCallback((): void => {
    setDeleteConfirmId(null);
  }, []);

  const handleInitiateDelete = useCallback(
    (id: string) => (): void => {
      setDeleteConfirmId(id);
    },
    [],
  );

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-neutral-900">Manage Administrators</h1>
          <button
            onClick={handleToggleForm}
            className="bg-primary hover:bg-primary-dark focus:ring-primary rounded-lg px-4 py-2 font-semibold text-white focus:ring-2 focus:ring-offset-2 focus:outline-none"
            aria-expanded={showAddForm}
            aria-controls="add-admin-form"
          >
            {showAddForm ? "Cancel" : "Add Admin"}
          </button>
        </div>

        {error && (
          <div
            className="mb-4 rounded-lg bg-red-50 p-4 text-red-800"
            role="alert"
            aria-live="polite"
          >
            {error}
          </div>
        )}

        {showAddForm && (
          <div id="add-admin-form" className="mb-6 rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold">Add New Administrator</h2>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div>
                <label htmlFor="admin-email" className="block text-sm font-medium text-neutral-700">
                  Email Address
                </label>
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  className="focus:border-primary focus:ring-primary mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 focus:ring-1 focus:outline-none"
                  disabled={isSubmitting}
                />
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-sm font-medium text-neutral-700"
                >
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={handlePasswordChange}
                  className="focus:border-primary focus:ring-primary mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 focus:ring-1 focus:outline-none"
                  disabled={isSubmitting}
                />
                <p className="mt-1 text-sm text-neutral-500">Must be at least 8 characters</p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary-dark focus:ring-primary w-full rounded-lg px-4 py-2 font-semibold text-white focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? "Adding..." : "Add Administrator"}
              </button>
            </form>
          </div>
        )}

        <div className="rounded-lg bg-white shadow-md">
          <div className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Current Administrators</h2>

            {admins.length === 0 ? (
              <p className="text-neutral-600">No administrators found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">
                        Created
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-neutral-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr key={admin.id} className="border-b border-neutral-100 last:border-0">
                        <td className="px-4 py-3 text-sm text-neutral-900">{admin.email}</td>
                        <td className="px-4 py-3 text-sm text-neutral-600">
                          {formatDate(admin.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {deleteConfirmId === admin.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-sm text-neutral-600">Confirm delete?</span>
                              <button
                                onClick={handleConfirmDelete(admin.id)}
                                disabled={isSubmitting}
                                className="rounded bg-red-600 px-3 py-1 text-sm font-medium text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label={`Confirm delete ${admin.email}`}
                              >
                                Yes, Delete
                              </button>
                              <button
                                onClick={handleCancelDelete}
                                disabled={isSubmitting}
                                className="rounded bg-neutral-200 px-3 py-1 text-sm font-medium text-neutral-700 hover:bg-neutral-300 focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:outline-none"
                                aria-label="Cancel delete"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={handleInitiateDelete(admin.id)}
                              disabled={admins.length === 1}
                              className="rounded bg-red-100 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-200 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                              aria-label={`Delete ${admin.email}`}
                              title={
                                admins.length === 1 ? "Cannot delete the last admin" : undefined
                              }
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageAdminsPage;
