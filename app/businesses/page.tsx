"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";
import ProtectedRoute from "../components/ProtectedRoute";
import { getAuthToken } from "../utils/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

interface Business {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  masterWalletUpi: string | null;
  masterWalletQrCode: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function BusinessesPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingBusinessId, setDeletingBusinessId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
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
      setBusinesses(data.businesses || []);
    } catch (err) {
      console.error("Error fetching businesses:", err);
      setError(err instanceof Error ? err.message : "Failed to load businesses");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDeleteBusiness = async (businessId: string) => {
    try {
      setDeletingBusinessId(businessId);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE}/api/businesses/${businessId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete business");
      }

      // Remove business from list
      setBusinesses((prev) => prev.filter((b) => b.id !== businessId));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Error deleting business:", err);
      setError(err instanceof Error ? err.message : "Failed to delete business");
    } finally {
      setDeletingBusinessId(null);
    }
  };

  const handleEditBusiness = (businessId: string) => {
    router.push(`/edit-business/${businessId}`);
  };

  return (
    <ProtectedRoute>
      <AppShell activePath="/businesses">
        <section className="max-w-7xl space-y-6">
          <div className="rounded-3xl border border-white/70 bg-white p-8 shadow-md">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#1f2937]">Businesses List</h2>
                <p className="mt-1 text-sm text-slate-500">
                  View and manage all your businesses
                </p>
              </div>
              <button
                onClick={() => router.push("/add-new-business")}
                className="rounded-xl bg-[#2f4bff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2f4bff]/90"
              >
                Add New Business
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-[#2f4bff]"></div>
              </div>
            ) : businesses.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-slate-500">No businesses found.</p>
                <button
                  onClick={() => router.push("/add-new-business")}
                  className="mt-4 rounded-xl bg-[#2f4bff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2f4bff]/90"
                >
                  Create Your First Business
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Business Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Owner
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Master UPI Wallet ID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Created At
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {businesses.map((business) => (
                      <tr key={business.id} className="hover:bg-slate-50">
                        <td className="px-4 py-4">
                          <div className="font-medium text-[#1f2937]">{business.name}</div>
                          {business.description && (
                            <div className="mt-1 text-sm text-slate-500">{business.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-[#1f2937]">{business.ownerName}</div>
                          <div className="text-xs text-slate-500">{business.ownerEmail}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-[#1f2937]">
                            {business.masterWalletUpi || (
                              <span className="text-slate-400">Not set</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              business.status === "active"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {business.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-600">
                          {formatDate(business.createdAt)}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEditBusiness(business.id)}
                              className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (deleteConfirmId === business.id) {
                                  handleDeleteBusiness(business.id);
                                } else {
                                  setDeleteConfirmId(business.id);
                                }
                              }}
                              disabled={deletingBusinessId === business.id}
                              className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                deleteConfirmId === business.id
                                  ? "bg-red-600 text-white hover:bg-red-700"
                                  : "border border-red-200 bg-white text-red-600 hover:bg-red-50"
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {deletingBusinessId === business.id
                                ? "Deleting..."
                                : deleteConfirmId === business.id
                                ? "Confirm Delete"
                                : "Delete"}
                            </button>
                            {deleteConfirmId === business.id && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(null);
                                }}
                                className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </AppShell>
    </ProtectedRoute>
  );
}

