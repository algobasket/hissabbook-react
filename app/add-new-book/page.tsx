"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "../components/AppShell";
import ProtectedRoute from "../components/ProtectedRoute";
import { getAuthToken, getUser } from "../utils/auth";
import { getPaymentCurrency, getCurrencyName } from "../utils/currency";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

interface CreateBookRequest {
  name: string;
  description?: string;
  currencyCode: string;
  ownerUserId: string;
  businessId?: string;
}

function AddNewBookContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [formData, setFormData] = useState<CreateBookRequest>({
    name: "",
    description: "",
    currencyCode: "INR",
    ownerUserId: "",
    businessId: "",
  });
  const [paymentCurrency, setPaymentCurrency] = useState<string>("INR");
  const [loadingCurrency, setLoadingCurrency] = useState(true);

  useEffect(() => {
    // Get current user from localStorage
    const user = getUser();
    if (user) {
      setCurrentUser(user);
      // Try to get user ID from localStorage first
      if (user.id) {
        setFormData((prev) => ({
          ...prev,
          ownerUserId: user.id,
        }));
      } else {
        // If no ID in localStorage, fetch user details from API
        fetchCurrentUser();
      }
    } else {
      fetchCurrentUser();
    }

    // Get selected business ID from localStorage
    const businessId = localStorage.getItem("selectedBusinessId");
    if (businessId) {
      setFormData((prev) => ({
        ...prev,
        businessId: businessId,
      }));
    }

    // Get name from URL query parameter
    const nameParam = searchParams.get("name");
    if (nameParam) {
      setFormData((prev) => ({
        ...prev,
        name: decodeURIComponent(nameParam),
      }));
    }

    // Fetch payment currency setting
    fetchPaymentCurrency();
  }, [searchParams]);

  const fetchPaymentCurrency = async () => {
    try {
      setLoadingCurrency(true);
      const currency = await getPaymentCurrency();
      setPaymentCurrency(currency);
      // Set the currency in form data
      setFormData((prev) => ({
        ...prev,
        currencyCode: currency,
      }));
    } catch (error) {
      console.error("Error fetching payment currency:", error);
      // Default to INR on error
      setPaymentCurrency("INR");
    } finally {
      setLoadingCurrency(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError("Not authenticated. Please log in again.");
        return;
      }

      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user && data.user.id) {
          setCurrentUser(data.user);
          setFormData((prev) => ({
            ...prev,
            ownerUserId: data.user.id,
          }));
          setError(null);
        } else {
          setError("User ID not found in response. Please try logging out and back in.");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || "Failed to fetch user information");
      }
    } catch (err) {
      console.error("Error fetching current user:", err);
      setError("Unable to load user information. Please try logging out and back in.");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      setError("Book name is required");
      return;
    }

    if (!formData.ownerUserId) {
      setError("Owner is required");
      return;
    }

    setLoading(true);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE}/api/books`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
          currencyCode: formData.currencyCode,
          ownerUserId: formData.ownerUserId,
          businessId: formData.businessId || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create book");
      }

      const data = await response.json();
      const bookId = data.book?.id;

      setSuccess(true);
      setTimeout(() => {
        if (bookId) {
          router.push(`/cashbooks/${bookId}/settings/members`);
        } else {
          router.push("/cashbooks");
        }
      }, 1500);
    } catch (err) {
      console.error("Error creating book:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create book";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell activePath="/add-new-book">
        <section className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-10">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <h1 className="mb-2 text-2xl font-semibold text-[#1f2937]">Add New Book</h1>
            <p className="mb-8 text-sm text-slate-500">
              Create a new cashbook for tracking financial transactions
            </p>

            {error && (
              <div className="mb-6 rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600">
                Book created successfully! Redirecting to members page...
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-[#1f2937]">
                  Book Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-[#1f2937] focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                  placeholder="e.g., Main Business Book, November Expenses"
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
                  placeholder="Optional description for this cashbook"
                  disabled={loading}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="currencyCode" className="block text-sm font-medium text-[#1f2937]">
                    Currency <span className="text-rose-500">*</span>
                  </label>
                  {loadingCurrency ? (
                    <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Loading currency...
                    </div>
                  ) : (
                    <select
                      id="currencyCode"
                      name="currencyCode"
                      value={formData.currencyCode}
                      onChange={handleChange}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-[#1f2937] cursor-not-allowed"
                      disabled={true}
                    >
                      <option value={paymentCurrency}>{getCurrencyName(paymentCurrency)}</option>
                    </select>
                  )}
                  <p className="text-xs text-slate-500">
                    Currency is set by admin in Payment Settings
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="ownerUserId" className="block text-sm font-medium text-[#1f2937]">
                    Owner
                  </label>
                  <input
                    id="ownerUserId"
                    name="ownerUserId"
                    type="text"
                    value={currentUser?.email || currentUser?.name || "Current User"}
                    disabled
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500">
                    This book will be owned by you
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.push("/cashbooks")}
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-[#1f2937] transition hover:bg-slate-50 disabled:opacity-60"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-[#2f4bff] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(47,75,255,0.35)] transition hover:-translate-y-0.5 disabled:opacity-60"
                  disabled={loading || !formData.ownerUserId}
                >
                  {loading ? "Creating..." : "Create Book"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </AppShell>
    </ProtectedRoute>
  );
}

export default function AddNewBookPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
          <p className="text-slate-600">Loading...</p>
        </div>
      }
    >
      <AddNewBookContent />
    </Suspense>
  );
}

