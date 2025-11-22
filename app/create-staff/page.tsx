"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";
import ProtectedRoute from "../components/ProtectedRoute";
import { getAuthToken, getUser } from "../utils/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

export default function CreateStaffPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    upiId: "",
  });

  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string }>>([]);
  const [cashbooks, setCashbooks] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCashbookId, setSelectedCashbookId] = useState<string | null>(null);
  const [loadingCashbooks, setLoadingCashbooks] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchBusinesses();
  }, []);

  useEffect(() => {
    if (selectedBusinessId) {
      fetchCashbooks(selectedBusinessId);
    } else {
      setCashbooks([]);
      setSelectedCashbookId(null);
    }
  }, [selectedBusinessId]);

  const fetchBusinesses = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError("Not authenticated");
        return;
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
      
      // Auto-select first business if available
      if (data.businesses && data.businesses.length > 0) {
        setSelectedBusinessId(data.businesses[0].id);
      }
    } catch (err) {
      console.error("Error fetching businesses:", err);
      setError(err instanceof Error ? err.message : "Failed to load businesses");
    }
  };

  const fetchCashbooks = async (businessId: string) => {
    try {
      setLoadingCashbooks(true);
      const token = getAuthToken();
      if (!token) {
        return;
      }

      const response = await fetch(`${API_BASE}/api/books?business_id=${businessId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch cashbooks");
      }

      const data = await response.json();
      setCashbooks(data.books || []);
      
      // Auto-select first cashbook if available
      if (data.books && data.books.length > 0) {
        setSelectedCashbookId(data.books[0].id);
      } else {
        setSelectedCashbookId(null);
      }
    } catch (err) {
      console.error("Error fetching cashbooks:", err);
      setCashbooks([]);
      setSelectedCashbookId(null);
    } finally {
      setLoadingCashbooks(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      if (!selectedBusinessId) {
        throw new Error("Please select a business");
      }
      if (!selectedCashbookId) {
        throw new Error("Please select a cashbook");
      }

      // Validate required fields
      if (!formData.email.trim()) {
        throw new Error("Email is required");
      }
      if (!formData.password.trim() || formData.password.length < 8) {
        throw new Error("Password must be at least 8 characters long");
      }
      if (!formData.firstName.trim()) {
        throw new Error("First name is required");
      }

      // Create the staff user
      const createResponse = await fetch(`${API_BASE}/api/users`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim() || null,
          phone: formData.phone.trim() || null,
          upiId: formData.upiId.trim() || null,
          role: "staff",
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create staff user");
      }

      const createData = await createResponse.json();
      console.log("Created staff user:", createData);

      // Add the created user to the selected business
      if (createData.user && createData.user.id) {
        const addResponse = await fetch(`${API_BASE}/api/businesses/${selectedBusinessId}/members`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: createData.user.id,
            role: "Staff",
          }),
        });

        if (!addResponse.ok) {
          const errorData = await addResponse.json().catch(() => ({}));
          throw new Error(errorData.message || "Staff created but failed to add to business");
        }

        // Add the user to the selected cashbook
        const addToBookResponse = await fetch(`${API_BASE}/api/books/${selectedCashbookId}/users`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: createData.user.id,
          }),
        });

        if (!addToBookResponse.ok) {
          const errorData = await addToBookResponse.json().catch(() => ({}));
          // Throw error to show it to the user
          throw new Error(errorData.message || "Staff created but failed to add to cashbook");
        }

        setSuccess(
          `Staff member ${formData.firstName} ${formData.lastName || ""} (${formData.email}) has been created and added to the business and cashbook.`
        );

        // Reset form
        setFormData({
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          phone: "",
          upiId: "",
        });

        // Redirect to team page after 2 seconds
        setTimeout(() => {
          router.push("/team");
        }, 2000);
      } else {
        throw new Error("User created but user ID not returned");
      }
    } catch (err) {
      console.error("Error creating staff:", err);
      setError(err instanceof Error ? err.message : "Failed to create staff member");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <ProtectedRoute>
        <AppShell activePath="/create-staff">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-[#2f4bff]"></div>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell activePath="/create-staff">
        <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
          <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-panel">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-dark">Create Staff Member</h1>
              <p className="mt-2 text-sm text-slate-600">
                Create a new staff account and add them to your business
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Business Selection */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Business <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedBusinessId || ""}
                  onChange={(e) => setSelectedBusinessId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#1f2937] focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                  required
                >
                  <option value="">Select a business...</option>
                  {businesses.map((business) => (
                    <option key={business.id} value={business.id}>
                      {business.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cashbook Selection */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Cashbook <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCashbookId || ""}
                  onChange={(e) => setSelectedCashbookId(e.target.value)}
                  disabled={!selectedBusinessId || loadingCashbooks}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#1f2937] focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20 disabled:bg-slate-50 disabled:cursor-not-allowed"
                  required
                >
                  <option value="">
                    {loadingCashbooks
                      ? "Loading cashbooks..."
                      : !selectedBusinessId
                      ? "Select a business first"
                      : cashbooks.length === 0
                      ? "No cashbooks available"
                      : "Select a cashbook..."}
                  </option>
                  {cashbooks.map((cashbook) => (
                    <option key={cashbook.id} value={cashbook.id}>
                      {cashbook.name}
                    </option>
                  ))}
                </select>
                {selectedBusinessId && cashbooks.length === 0 && !loadingCashbooks && (
                  <p className="mt-1 text-xs text-amber-600">
                    No cashbooks found for this business. Please create a cashbook first.
                  </p>
                )}
              </div>

              {/* First Name and Last Name */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="First name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#1f2937] placeholder-slate-400 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#1f2937] placeholder-slate-400 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="staff@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#1f2937] placeholder-slate-400 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="e.g. 9876543210"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#1f2937] placeholder-slate-400 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                />
                <p className="mt-1 text-xs text-slate-500">
                  If UPI ID is not provided, it will auto-generate as phone@hissabbook
                </p>
              </div>

              {/* UPI ID */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  UPI ID
                </label>
                <input
                  type="text"
                  name="upiId"
                  value={formData.upiId}
                  onChange={handleInputChange}
                  placeholder="user@paytm or leave empty to auto-generate"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#1f2937] placeholder-slate-400 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Leave empty to auto-generate from phone number (phone@hissabbook)
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#1f2937] placeholder-slate-400 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                  required
                  minLength={8}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Password must be at least 8 characters long
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-xl bg-[#2f4bff] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2f4bff]/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Create Staff"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/team")}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </section>
      </AppShell>
    </ProtectedRoute>
  );
}

