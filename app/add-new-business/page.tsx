"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";
import ProtectedRoute from "../components/ProtectedRoute";
import { getAuthToken } from "../utils/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

interface CreateBusinessRequest {
  name: string;
  description?: string;
  masterWalletUpi?: string;
}

export default function AddNewBusinessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<CreateBusinessRequest>({
    name: "",
    description: "",
    masterWalletUpi: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.name.trim()) {
      setError("Business name is required");
      return;
    }

    setLoading(true);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE}/api/businesses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          masterWalletUpi: formData.masterWalletUpi?.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create business");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err) {
      console.error("Error creating business:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create business";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell activePath="/add-new-business">
        <section className="max-w-2xl space-y-6">
          <div className="rounded-3xl border border-white/70 bg-white p-8 shadow-md">
            <h1 className="mb-2 text-2xl font-semibold text-[#1f2937]">Add New Business</h1>
            <p className="mb-8 text-sm text-slate-500">
              Create a new business with a master wallet UPI for financial management
            </p>

            {error && (
              <div className="mb-6 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600">
                Business created successfully! Redirecting...
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-[#1f2937]">
                  Business Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-[#1f2937] focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                  placeholder="Enter business name"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-[#1f2937]">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-[#1f2937] focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                  placeholder="Enter business description (optional)"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="masterWalletUpi" className="block text-sm font-medium text-[#1f2937]">
                  Master Wallet UPI
                </label>
                <input
                  id="masterWalletUpi"
                  name="masterWalletUpi"
                  type="text"
                  value={formData.masterWalletUpi}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-[#1f2937] focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                  placeholder="Enter master wallet UPI (optional)"
                  disabled={loading}
                />
                <p className="text-xs text-slate-500">
                  The master wallet UPI will be used for receiving payments
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-[#1f2937] transition hover:bg-slate-50 disabled:opacity-60"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-[#2f4bff] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(47,75,255,0.35)] transition hover:-translate-y-0.5 disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Business"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </AppShell>
    </ProtectedRoute>
  );
}




