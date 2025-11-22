"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";
import ProtectedRoute from "../components/ProtectedRoute";
import { getAuthToken } from "../utils/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

interface PayoutRequest {
  id: string;
  reference: string;
  submittedBy: string;
  amount: number;
  utr: string;
  remarks: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  userEmail: string | null;
  userPhone: string | null;
  proofFilename: string | null;
}

export default function ApprovalsPage() {
  const router = useRouter();
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchPayoutRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const statusParam = selectedStatus !== "all" ? `?status=${selectedStatus}` : "";
      const response = await fetch(`${API_BASE}/api/payout-requests${statusParam}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch payout requests (${response.status})`);
      }

      const data = await response.json();
      setPayoutRequests(data.payoutRequests || []);
    } catch (err: any) {
      console.error("Error fetching payout requests:", err);
      setError(err.message || "Failed to load payout requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    fetchPayoutRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, selectedStatus]);

  const handleStatusUpdate = async (id: string, status: "accepted" | "rejected") => {
    if (processingId) return;

    setProcessingId(id);
    setError(null);
    try {
      const token = getAuthToken();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch(`${API_BASE}/api/payout-requests/${id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          notes: status === "accepted" ? "Approved by manager" : "Rejected by manager",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update request status");
      }

      // Refresh the list
      await fetchPayoutRequests();
    } catch (err: any) {
      console.error("Error updating payout request status:", err);
      setError(err.message || "Failed to update request status");
    } finally {
      setProcessingId(null);
    }
  };

  if (!mounted) {
    return (
      <ProtectedRoute>
        <AppShell activePath="/approvals">
          <div className="flex items-center justify-center py-12">
            <p className="text-slate-600">Loading...</p>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "pm" : "am";
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${day}-${month}-${year} ${hours}:${minutes}${ampm}`;
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: "bg-amber-100", text: "text-amber-600", label: "Pending" },
      accepted: { bg: "bg-emerald-100", text: "text-emerald-600", label: "Accepted" },
      rejected: { bg: "bg-rose-100", text: "text-rose-600", label: "Rejected" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;

    return (
      <span className={`rounded-full ${config.bg} ${config.text} px-3 py-1 text-xs font-semibold`}>
        {config.label}
      </span>
    );
  };

  return (
    <ProtectedRoute>
      <AppShell activePath="/approvals">
        <section className="mx-auto flex w-full flex-col gap-8 px-6 py-10">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-semibold text-dark">Payout Requests</h2>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <label>Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending Review</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-600">Loading payout requests...</p>
              </div>
            ) : error ? (
              <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-100">
                <table className="min-w-full divide-y divide-slate-100 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Request #</th>
                      <th className="px-4 py-3">Submitted By</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">UTR / Reference</th>
                      <th className="px-4 py-3">Screenshot</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Created At</th>
                      <th className="px-4 py-3">Updated</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-600">
                    {payoutRequests.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                          No payout requests found
                        </td>
                      </tr>
                    ) : (
                      payoutRequests.map((request) => {
                        const proofUrl = request.proofFilename
                          ? `${API_BASE}/uploads/${request.proofFilename}`
                          : null;

                        return (
                          <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4 font-semibold text-dark">{request.reference}</td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="font-medium text-dark">{request.submittedBy}</span>
                                {request.userEmail && (
                                  <span className="text-xs text-slate-500">{request.userEmail}</span>
                                )}
                                {request.userPhone && (
                                  <span className="text-xs text-slate-500">{request.userPhone}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-4 font-semibold text-dark">
                              {formatAmount(request.amount)}
                            </td>
                            <td className="px-4 py-4">{request.utr}</td>
                            <td className="px-4 py-4">
                              {request.proofFilename ? (
                                <button
                                  onClick={() => setSelectedImage(proofUrl)}
                                  className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 hover:underline transition-colors font-medium"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                  </svg>
                                  Attachment
                                </button>
                              ) : (
                                <span className="text-xs text-slate-400">No attachment</span>
                              )}
                            </td>
                            <td className="px-4 py-4">{getStatusBadge(request.status)}</td>
                            <td className="px-4 py-4 text-slate-500">
                              {formatDate(request.createdAt)}
                            </td>
                            <td className="px-4 py-4 text-slate-500">
                              {formatDate(request.updatedAt)}
                            </td>
                            <td className="px-4 py-4">
                              {request.status === "pending" ? (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleStatusUpdate(request.id, "accepted")}
                                    disabled={processingId === request.id}
                                    className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    {processingId === request.id ? "Processing..." : "Accept"}
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(request.id, "rejected")}
                                    disabled={processingId === request.id}
                                    className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                    {processingId === request.id ? "Processing..." : "Reject"}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-slate-400">No actions</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </AppShell>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw] bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between bg-slate-50 px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900">Attachment Preview</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedImage) {
                      const link = document.createElement('a');
                      link.href = selectedImage;
                      link.download = selectedImage.split('/').pop() || 'attachment';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors shadow-sm"
                  aria-label="Download attachment"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  Download
                </button>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="rounded-lg bg-white p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border border-slate-200"
                  aria-label="Close modal"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Image Container */}
            <div className="p-6 bg-slate-50">
              <img
                src={selectedImage}
                alt="Attachment"
                className="max-h-[75vh] max-w-full mx-auto rounded-lg shadow-lg object-contain bg-white"
                onClick={(e) => e.stopPropagation()}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23f3f4f6" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="%236b7280"%3EImage not found%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
