"use client";

import { useEffect, useState } from "react";
import AppShell from "../components/AppShell";
import ProtectedRoute from "../components/ProtectedRoute";
import { getAuthToken } from "../utils/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

interface PayoutRequest {
  id: string;
  reference: string;
  wallet: string;
  amount: string;
  amountValue: number;
  status: string;
  statusValue: string;
  clearedOn: string;
  clearedOnValue: string | null;
  createdAt: string;
  utr: string;
  remarks: string;
}

interface PayoutSummaries {
  totalAmount: string;
  totalAmountValue: number;
  approvedAmount: string;
  approvedAmountValue: number;
  rejectedAmount: string;
  rejectedAmountValue: number;
  pendingAmount: string;
  pendingAmountValue: number;
}

export default function ApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<PayoutSummaries>({
    totalAmount: "₹0",
    totalAmountValue: 0,
    approvedAmount: "₹0",
    approvedAmountValue: 0,
    rejectedAmount: "₹0",
    rejectedAmountValue: 0,
    pendingAmount: "₹0",
    pendingAmountValue: 0,
  });
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);

  useEffect(() => {
    fetchPayoutRequests();
  }, []);

  const fetchPayoutRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch(`${API_BASE}/api/payout-requests`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: Failed to fetch payout requests`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data.summaries || !data.payoutRequests) {
        throw new Error("Invalid response format from server");
      }
      
      setSummaries(data.summaries);
      setPayoutRequests(data.payoutRequests);
      setError(null);
    } catch (err) {
      console.error("Error fetching payout requests:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load payout requests";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ["Reference", "Wallet", "Amount", "Status", "Cleared On"];
    const rows = payoutRequests.map((req) => [
      req.reference,
      req.wallet,
      req.amount,
      req.status,
      req.clearedOn,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `payout-requests-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell activePath="/approvals">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2f4bff] border-r-transparent"></div>
              <p className="mt-4 text-sm text-slate-600">Loading payout requests...</p>
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell activePath="/approvals">
        <section className="rounded-3xl border border-white/70 bg-white p-8 shadow-md">
          {error && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-[#2f4bff]/20 bg-[#2f4bff]/10 p-4 text-sm text-[#1f2937]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#2f4bff]">Total payout amount</p>
              <p className="mt-2 text-xl font-semibold text-[#2f4bff]">{summaries.totalAmount}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-[#1f2937]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">Total approved</p>
              <p className="mt-2 text-xl font-semibold text-emerald-600">{summaries.approvedAmount}</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-[#1f2937]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-600">Total rejected</p>
              <p className="mt-2 text-xl font-semibold text-rose-600">{summaries.rejectedAmount}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-[#1f2937]">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600">Total pending</p>
              <p className="mt-2 text-xl font-semibold text-amber-600">{summaries.pendingAmount}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/70 bg-white p-8 shadow-md">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[#1f2937]">Payout status</h3>
            <button
              onClick={handleExportCSV}
              disabled={payoutRequests.length === 0}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-[#2f4bff]/60 hover:text-[#2f4bff] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Export CSV
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            {payoutRequests.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-500">
                No payout requests found.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-200 text-sm text-slate-600">
                <thead className="bg-[#f8faff] text-xs uppercase tracking-[0.25em] text-slate-400">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Reference</th>
                    <th className="px-4 py-3 text-left font-semibold">Wallet</th>
                    <th className="px-4 py-3 text-left font-semibold">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Cleared on</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payoutRequests.map((row) => (
                    <tr key={row.id} className="hover:bg-[#f8faff]">
                      <td className="px-4 py-3 font-semibold text-[#1f2937]">{row.reference}</td>
                      <td className="px-4 py-3">{row.wallet}</td>
                      <td className="px-4 py-3 font-semibold text-[#2f4bff]">{row.amount}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            row.status === "Approved"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : row.status === "Pending Approval"
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-rose-500/10 text-rose-600"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#475569]">{row.clearedOn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </AppShell>
    </ProtectedRoute>
  );
}
