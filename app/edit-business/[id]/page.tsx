"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import AppShell from "../../components/AppShell";
import ProtectedRoute from "../../components/ProtectedRoute";
import { getAuthToken } from "../../utils/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

interface Business {
  id: string;
  name: string;
  description: string | null;
  masterWalletUpi: string | null;
  status: string;
}

function EditBusinessContent() {
  const router = useRouter();
  const params = useParams();
  const businessId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    masterWalletUpi: "",
    status: "active" as "active" | "inactive",
  });

  useEffect(() => {
    if (!businessId) return;
    fetchBusiness();
  }, [businessId]);

  const fetchBusiness = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE}/api/businesses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch businesses");
      }

      const data = await response.json();
      const business = data.businesses?.find((b: Business) => b.id === businessId);

      if (!business) {
        setError("Business not found");
        return;
      }

      setFormData({
        name: business.name || "",
        description: business.description || "",
        masterWalletUpi: business.masterWalletUpi || "",
        status: business.status || "active",
      });
    } catch (err) {
      console.error("Error fetching business:", err);
      setError(err instanceof Error ? err.message : "Failed to load business");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.name?.trim()) {
      setError("Business name is required");
      return;
    }

    try {
      setSaving(true);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE}/api/businesses/${businessId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          masterWalletUpi: formData.masterWalletUpi?.trim() || undefined,
          status: formData.status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update business");
      }

      setSuccess("Business updated successfully!");
      setTimeout(() => {
        router.push("/businesses");
      }, 1500);
    } catch (err) {
      console.error("Error updating business:", err);
      setError(err instanceof Error ? err.message : "Failed to update business");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this business? This action cannot be undone.")) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE}/api/businesses/${businessId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete business");
      }

      router.push("/businesses");
    } catch (err) {
      console.error("Error deleting business:", err);
      setError(err instanceof Error ? err.message : "Failed to delete business");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell activePath="/businesses">
        <section className="max-w-3xl space-y-6">
          <div className="rounded-3xl border border-white/70 bg-white p-8 shadow-md">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-[#1f2937]">Edit Business</h2>
              <p className="mt-1 text-sm text-slate-500">
                Update your business information
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-600">
                {success}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-[#2f4bff]"></div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#1f2937] mb-2">
                    Business Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-[#1f2937] focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                    placeholder="Enter business name"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-[#1f2937] mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-[#1f2937] focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                    placeholder="Enter business description"
                  />
                </div>

                <div>
                  <label htmlFor="masterWalletUpi" className="block text-sm font-medium text-[#1f2937] mb-2">
                    Master Wallet UPI ID
                  </label>
                  <input
                    type="text"
                    id="masterWalletUpi"
                    name="masterWalletUpi"
                    value={formData.masterWalletUpi}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-[#1f2937] focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                    placeholder="Enter UPI ID (e.g., business@hissabbook)"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Changing the UPI ID will regenerate the QR code
                  </p>
                </div>

                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-[#1f2937] mb-2">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-[#1f2937] focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-[#2f4bff] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2f4bff]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/businesses")}
                    disabled={saving || deleting}
                    className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={saving || deleting}
                    className="ml-auto rounded-xl border border-red-200 bg-white px-6 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? "Deleting..." : "Delete Business"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </AppShell>
    </ProtectedRoute>
  );
}

export default function EditBusinessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-[#2f4bff]"></div>
        </div>
      }
    >
      <EditBusinessContent />
    </Suspense>
  );
}


