"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import AppShell from "../components/AppShell";
import ProtectedRoute from "../components/ProtectedRoute";
import { getUserRole, getAuthToken } from "../utils/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

interface WalletDetails {
  upiId: string | null;
  upiQrCode: string | null;
  role: string | null;
  walletBalance: number | null;
  walletCurrency: string | null;
}

export default function WalletsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [walletDetails, setWalletDetails] = useState<WalletDetails>({
    upiId: null,
    upiQrCode: null,
    role: null,
    walletBalance: null,
    walletCurrency: "INR",
  });

  useEffect(() => {
    fetchWalletDetails();
  }, []);

  const fetchWalletDetails = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch(`${API_BASE}/api/auth/account-details`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json", 
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch wallet details");
      }

      const data = await response.json();
      setWalletDetails({
        upiId: data.upiId || null,
        upiQrCode: data.upiQrCode || null,
        role: data.role || null,
        walletBalance: typeof data.walletBalance === "number" ? data.walletBalance : null,
        walletCurrency: data.walletCurrency || "INR",
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load wallet details");
    } finally {
      setLoading(false);
    }
  };

  // Format role name for display (uppercase, replace underscores with spaces)
  const formatRoleName = (roleName: string | null): string => {
    if (!roleName) return "STAFF";
    return roleName.toUpperCase().replace(/_/g, " ");
  };

  const walletType = formatRoleName(walletDetails.role) + " WALLET";

  const formattedBalance =
    typeof walletDetails.walletBalance === "number"
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: walletDetails.walletCurrency || "INR",
          maximumFractionDigits: 0,
        }).format(walletDetails.walletBalance)
      : "₹0";

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell activePath="/wallets">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2f4bff] border-r-transparent"></div>
              <p className="mt-4 text-sm text-slate-600">Loading wallet...</p>
            </div>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell activePath="/wallets">
        <section className="max-w-3xl rounded-3xl border border-white/70 bg-white p-8 shadow-md">
          <h2 className="text-xl font-semibold text-[#1f2937]">Wallet overview</h2>
          <p className="mt-2 text-sm text-slate-500">Share these payout details with your finance team or vendors.</p>

          {error && (
            <div className="mt-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          )}

          <div className="mt-6 grid gap-5 text-sm text-[#1f2937]">
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">UPI ID</span>
              <p className="mt-2 rounded-xl border border-slate-200 bg-[#f8faff] px-4 py-3">
                {walletDetails.upiId || "Not set"}
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Wallet UPI Balance</span>
                <p className="mt-2 text-2xl font-semibold text-[#2f4bff]">{formattedBalance}</p>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {walletType} • balance from user wallet
                </p>
              </div>
              <div 
                className="flex h-40 w-40 items-center justify-center rounded-2xl border border-slate-200 bg-[#f8faff] overflow-hidden cursor-pointer transition hover:border-[#2f4bff] hover:shadow-md"
                onClick={() => {
                  if (walletDetails.upiQrCode) {
                    setShowQrModal(true);
                  }
                }}
              >
                {walletDetails.upiQrCode ? (
                  <img
                    src={`${API_BASE}/uploads/${walletDetails.upiQrCode}`}
                    alt="Wallet QR code"
                    className="h-full w-full object-contain p-2"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; // Prevent infinite loop
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="flex h-full w-full flex-col items-center justify-center p-4 text-center">
                            <img 
                              src="/images/placeholder-qr.png" 
                              alt="Wallet QR placeholder" 
                              class="h-24 w-24 object-contain opacity-50"
                            />
                            <p class="mt-2 text-xs text-slate-400">QR code not available</p>
                          </div>
                        `;
                      }
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
                    <Image
                      src="/images/placeholder-qr.png"
                      alt="Wallet QR placeholder"
                      width={96}
                      height={96}
                      className="object-contain opacity-50"
                    />
                    <p className="mt-2 text-xs text-slate-400">QR code not set</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* QR Code Modal */}
        {showQrModal && walletDetails.upiQrCode && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowQrModal(false)}
          >
            <div
              className="relative mx-4 w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-[#1f2937]">Wallet QR Code</h3>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Close modal"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl">
                <img
                  src={`${API_BASE}/uploads/${walletDetails.upiQrCode}`}
                  alt="Wallet QR code"
                  className="w-80 h-80 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = "/images/placeholder-qr.png";
                  }}
                />
                {walletDetails.upiId && (
                  <p className="mt-6 text-base font-medium text-[#1f2937]">{walletDetails.upiId}</p>
                )}
                <p className="mt-3 text-sm text-slate-500 text-center">
                  Scan to pay with any UPI app
                </p>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowQrModal(false)}
                  className="rounded-full bg-[#2f4bff] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2540e6]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
