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
  const [staffMembers, setStaffMembers] = useState<Array<{ id: string; email: string; phone: string; type: "email" | "phone" }>>([]);
  const [newStaffEmail, setNewStaffEmail] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [staffInputType, setStaffInputType] = useState<"email" | "phone">("email");

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

  const handleAddStaffMember = () => {
    if (staffInputType === "email") {
      if (!newStaffEmail.trim() || !newStaffEmail.includes("@")) {
        setError("Please enter a valid email address");
        return;
      }
      const email = newStaffEmail.trim().toLowerCase();
      if (staffMembers.some((s) => s.email === email)) {
        setError("This email is already added");
        return;
      }
      setStaffMembers((prev) => [
        ...prev,
        { id: Date.now().toString(), email, phone: "", type: "email" },
      ]);
      setNewStaffEmail("");
    } else {
      if (!newStaffPhone.trim()) {
        setError("Please enter a valid phone number");
        return;
      }
      const phone = newStaffPhone.trim();
      if (staffMembers.some((s) => s.phone === phone)) {
        setError("This phone number is already added");
        return;
      }
      setStaffMembers((prev) => [
        ...prev,
        { id: Date.now().toString(), email: "", phone, type: "phone" },
      ]);
      setNewStaffPhone("");
    }
    setError(null);
  };

  const handleRemoveStaffMember = (id: string) => {
    setStaffMembers((prev) => prev.filter((s) => s.id !== id));
  };

  const addStaffMembersToBook = async (bookId: string, businessId?: string) => {
    const token = getAuthToken();
    if (!token) {
      throw new Error("Not authenticated");
    }

    // Use businessId from formData if not provided
    const effectiveBusinessId = businessId || formData.businessId;

    const results: Array<{ staff: string; success: boolean; message: string }> = [];

    for (const staff of staffMembers) {
      try {
        const staffIdentifier = staff.type === "email" ? staff.email : staff.phone;
        
        // Check if user exists
        const params = new URLSearchParams();
        if (staff.type === "email" && staff.email) {
          params.append("email", staff.email);
        } else if (staff.type === "phone" && staff.phone) {
          params.append("phone", staff.phone);
        }

        const checkResponse = await fetch(`${API_BASE}/api/users/check?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!checkResponse.ok) {
          throw new Error(`Failed to check if user exists: ${checkResponse.statusText}`);
        }

        const checkData = await checkResponse.json();
        
        if (checkData.exists && checkData.user?.id) {
          // User exists, add them to the book
          const addResponse = await fetch(`${API_BASE}/api/books/${bookId}/users`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: checkData.user.id,
            }),
          });

          if (addResponse.ok) {
            results.push({
              staff: staffIdentifier,
              success: true,
              message: `Added ${staffIdentifier} to the book`,
            });
          } else {
            const errorData = await addResponse.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to add ${staffIdentifier} to book`);
          }
        } else {
          // User doesn't exist, send invite
          if (!effectiveBusinessId) {
            throw new Error(
              `Cannot send invite to ${staffIdentifier}. The book needs to be associated with a business to send invites.`
            );
          }

          const inviteData: any = {
            role: "Staff",
            businessId: effectiveBusinessId,
            cashbookId: bookId, // Pass book ID so user can be added to book on acceptance
          };

          if (staff.type === "email" && staff.email) {
            inviteData.email = staff.email.trim();
          } else if (staff.type === "phone" && staff.phone) {
            inviteData.phone = staff.phone.trim();
          }

          const inviteResponse = await fetch(`${API_BASE}/api/businesses/${effectiveBusinessId}/invites`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(inviteData),
          });

          if (inviteResponse.ok) {
            const inviteData = await inviteResponse.json();
            results.push({
              staff: staffIdentifier,
              success: true,
              message: `Invite sent to ${staffIdentifier}`,
            });
          } else {
            const errorData = await inviteResponse.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to send invite to ${staffIdentifier}`);
          }
        }
      } catch (err) {
        const staffIdentifier = staff.type === "email" ? staff.email : staff.phone;
        const errorMessage = err instanceof Error ? err.message : `Failed to process ${staffIdentifier}`;
        results.push({
          staff: staffIdentifier,
          success: false,
          message: errorMessage,
        });
        console.error(`Error processing staff member ${staffIdentifier}:`, err);
      }
    }

    // Return results for user feedback
    return results;
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
      let createdBook = data.book;
      let bookBusinessId = createdBook?.businessId || createdBook?.business_id || formData.businessId;

      // If businessId is not in response, fetch the book to get it
      if (bookId && !bookBusinessId && staffMembers.length > 0) {
        try {
          const bookResponse = await fetch(`${API_BASE}/api/books/${bookId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          if (bookResponse.ok) {
            const bookData = await bookResponse.json();
            createdBook = bookData.book;
            bookBusinessId = createdBook?.businessId || createdBook?.business_id || formData.businessId;
          }
        } catch (err) {
          console.warn("Could not fetch book details, using formData businessId");
        }
      }

      // Add staff members if any
      let staffResults: Array<{ staff: string; success: boolean; message: string }> = [];
      if (bookId && staffMembers.length > 0) {
        // Warn if no businessId and we have staff to add (some might need invites)
        if (!bookBusinessId) {
          console.warn("Book created without businessId. Staff members that don't exist in the system cannot receive invites.");
        }
        
        try {
          staffResults = await addStaffMembersToBook(bookId, bookBusinessId);
          
          // Check if there were any failures
          const failures = staffResults.filter((r) => !r.success);
          const successes = staffResults.filter((r) => r.success);
          
          if (failures.length > 0 && successes.length > 0) {
            // Partial success
            const failureMessages = failures.map((f) => `${f.staff}: ${f.message}`).join("; ");
            setError(`Book created successfully! ${successes.length} staff member(s) processed. However, some had issues: ${failureMessages}`);
          } else if (failures.length > 0) {
            // All failed
            const failureMessages = failures.map((f) => `${f.staff}: ${f.message}`).join("; ");
            setError(`Book created successfully, but staff members had issues: ${failureMessages}`);
          } else if (successes.length > 0) {
            // All succeeded
            setSuccess(true);
          }
        } catch (staffError) {
          console.error("Error adding staff members:", staffError);
          const errorMessage = staffError instanceof Error ? staffError.message : "Unknown error";
          setError(`Book created successfully, but there was an error processing staff members: ${errorMessage}`);
        }
      } else {
        setSuccess(true);
      }

      setTimeout(() => {
        if (bookId) {
          router.push(`/cashbooks/${bookId}/settings/members`);
        } else {
          router.push("/cashbooks");
        }
      }, staffMembers.length > 0 ? 3000 : 1500);
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

              {/* Add Staff Members Section */}
              <div className="space-y-4 pt-4 border-t border-slate-200">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-[#1f2937]">
                    Add Staff Members
                  </label>
                  <p className="text-xs text-slate-500">
                    Optionally add staff members by email or phone number. Existing users will be added immediately, new users will receive an invite.
                  </p>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 flex gap-2">
                    <select
                      value={staffInputType}
                      onChange={(e) => {
                        setStaffInputType(e.target.value as "email" | "phone");
                        setNewStaffEmail("");
                        setNewStaffPhone("");
                      }}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#1f2937] focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                      disabled={loading}
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                    </select>
                    {staffInputType === "email" ? (
                      <input
                        type="email"
                        value={newStaffEmail}
                        onChange={(e) => setNewStaffEmail(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddStaffMember();
                          }
                        }}
                        placeholder="Enter email address"
                        className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#1f2937] focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                        disabled={loading}
                      />
                    ) : (
                      <input
                        type="tel"
                        value={newStaffPhone}
                        onChange={(e) => setNewStaffPhone(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddStaffMember();
                          }
                        }}
                        placeholder="Enter phone number"
                        className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#1f2937] focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                        disabled={loading}
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddStaffMember}
                    className="rounded-2xl bg-[#2f4bff] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2f4bff]/90 disabled:opacity-60"
                    disabled={loading || (staffInputType === "email" ? !newStaffEmail.trim() : !newStaffPhone.trim())}
                  >
                    Add
                  </button>
                </div>

                {staffMembers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-600">Staff Members to Add:</p>
                    <div className="space-y-2">
                      {staffMembers.map((staff) => (
                        <div
                          key={staff.id}
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2"
                        >
                          <span className="text-sm font-medium text-[#1f2937]">
                            {staff.type === "email" ? staff.email : staff.phone}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveStaffMember(staff.id)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-rose-600 transition"
                            disabled={loading}
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

