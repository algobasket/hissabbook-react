"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";
import ProtectedRoute from "../components/ProtectedRoute";
import { getAuthToken, isAdmin } from "../utils/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

interface Book {
  id: string;
  name: string;
  description: string | null;
  currencyCode: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  transactionCount: number;
  memberCount?: number;
  totalBalance: number;
  masterWalletBalance?: number;
  createdAt: string;
  updatedAt: string;
}

export default function CashbooksPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("lastUpdated");
  
  // Modal states
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [renameName, setRenameName] = useState("");
  const [duplicateName, setDuplicateName] = useState("");
  const [duplicateOptions, setDuplicateOptions] = useState({
    duplicateMembers: true,
    duplicateCategories: true,
    duplicatePaymentModes: true,
    duplicateParties: true,
    duplicateCustomFields: true,
  });
  const [saving, setSaving] = useState(false);
  const [moveBookModalOpen, setMoveBookModalOpen] = useState(false);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedTargetBusiness, setSelectedTargetBusiness] = useState<string>("");

  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [selectedBusinessName, setSelectedBusinessName] = useState<string | null>(null);
  
  // Email verification states
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [sendingVerificationEmail, setSendingVerificationEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  // Fetch account details to check email verification status
  const fetchAccountDetails = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      if (!API_BASE) {
        console.warn("API_BASE is not defined");
        return;
      }

      const response = await fetch(`${API_BASE}/api/auth/account-details`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserEmail(data.email);
        setIsEmailVerified(data.isEmailVerified || false);
        setEmailInput(data.email || "");
      }
    } catch (err) {
      // Silently fail - this is not critical for page functionality
      console.error("Error fetching account details:", err);
    }
  };

  // Load selected business ID from localStorage on mount
  useEffect(() => {
    const businessId = localStorage.getItem("selectedBusinessId");
    setSelectedBusinessId(businessId);
    fetchBusinessName(businessId);
    fetchAccountDetails();
  }, []);

  // Handle send verification email
  const handleSendVerificationEmail = async () => {
    if (!emailInput.trim()) {
      setEmailError("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      setSendingVerificationEmail(true);
      setEmailError(null);
      setEmailSuccess(null);

      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      // First, update the email if it's different
      if (emailInput.trim().toLowerCase() !== userEmail?.toLowerCase()) {
        const updateResponse = await fetch(`${API_BASE}/api/auth/change-email`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newEmail: emailInput.trim().toLowerCase(),
          }),
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update email");
        }
      }

      // Then send verification email
      const response = await fetch(`${API_BASE}/api/auth/send-verification-email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to send verification email");
      }

      setEmailSuccess("Verification email sent! Please check your inbox and click the link to verify your email.");
      // Refresh account details
      setTimeout(() => {
        fetchAccountDetails();
      }, 1000);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Failed to send verification email");
    } finally {
      setSendingVerificationEmail(false);
    }
  };

  const fetchBusinessName = async (businessId: string | null) => {
    if (!businessId) {
      setSelectedBusinessName(null);
      return;
    }

    try {
      const token = getAuthToken();
      if (!token) return;

      if (!API_BASE) {
        console.warn("API_BASE is not defined");
        return;
      }

      const response = await fetch(`${API_BASE}/api/businesses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const business = data.businesses?.find((b: any) => b.id === businessId);
        if (business) {
          setSelectedBusinessName(business.name);
        }
      }
    } catch (err) {
      // Silently fail - this is not critical for page functionality
      console.error("Error fetching business name:", err);
    }
  };

  // Listen for business change events
  useEffect(() => {
    const handleBusinessChange = (event: CustomEvent) => {
      const businessId = event.detail.businessId;
      setSelectedBusinessId(businessId);
      fetchBusinessName(businessId);
    };

    window.addEventListener('businessChanged', handleBusinessChange as EventListener);
    return () => {
      window.removeEventListener('businessChanged', handleBusinessChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (selectedBusinessId !== null) {
      // Only fetch if we've loaded the business ID (null means not yet loaded, empty string means no business selected)
      fetchBooks();
    }
  }, [searchQuery, selectedBusinessId]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      if (!API_BASE) {
        setError("API configuration error. Please check your environment variables.");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append("search", searchQuery.trim());
      }
      if (selectedBusinessId) {
        params.append("business_id", selectedBusinessId);
      }

      const response = await fetch(`${API_BASE}/api/books${params.toString() ? `?${params.toString()}` : ""}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch books");
      }

      const data = await response.json();
      let sortedBooks = data.books || [];

      // Sort books
      if (sortBy === "lastUpdated") {
        sortedBooks.sort((a: Book, b: Book) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      } else if (sortBy === "name") {
        sortedBooks.sort((a: Book, b: Book) => a.name.localeCompare(b.name));
      } else if (sortBy === "balance") {
        sortedBooks.sort((a: Book, b: Book) => b.totalBalance - a.totalBalance);
      }

      setBooks(sortedBooks);
    } catch (err) {
      console.error("Error fetching books:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load cashbooks";
      // Check if it's a network error
      if (errorMessage.includes("Failed to fetch") || errorMessage.includes("NetworkError")) {
        setError("Unable to connect to the server. Please make sure the backend is running.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDateAgo = (dateString: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const diffInDays = Math.floor(diffInSeconds / 86400);

    if (diffInDays === 0) {
      return "Updated today";
    } else if (diffInDays === 1) {
      return "Updated 1 day ago";
    } else {
      return `Updated ${diffInDays} days ago`;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const quickBookTemplates = ["November Expenses", "Cash Journal", "Purchase order Book", "Project Book"];

  const handleQuickBook = (template: string) => {
    // Navigate to add book page with template name
    router.push(`/add-new-book?name=${encodeURIComponent(template)}`);
  };

  const handleRename = (book: Book) => {
    setSelectedBook(book);
    setRenameName(book.name);
    setRenameModalOpen(true);
  };

  const handleDuplicate = (book: Book) => {
    setSelectedBook(book);
    setDuplicateName(`${book.name} (Copy)`);
    setDuplicateModalOpen(true);
  };

  const handleMoveBook = (book: Book) => {
    setSelectedBook(book);
    setSelectedTargetBusiness("");
    fetchBusinesses();
    setMoveBookModalOpen(true);
  };

  const fetchBusinesses = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const response = await fetch(`${API_BASE}/api/businesses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.businesses || []);
      }
    } catch (err) {
      console.error("Error fetching businesses:", err);
    }
  };

  const handleMoveBookSubmit = async () => {
    if (!selectedBook || !selectedTargetBusiness) return;

    try {
      setSaving(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE}/api/books/${selectedBook.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: selectedTargetBusiness,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to move book");
      }

      setMoveBookModalOpen(false);
      setSelectedBook(null);
      setSelectedTargetBusiness("");
      fetchBooks(); // Refresh the list
      window.location.reload(); // Reload to update business context
    } catch (err) {
      console.error("Error moving book:", err);
      setError(err instanceof Error ? err.message : "Failed to move book");
    } finally {
      setSaving(false);
    }
  };


  const handleRenameSubmit = async () => {
    if (!selectedBook || !renameName.trim()) return;

    try {
      setSaving(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE}/api/books/${selectedBook.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: renameName.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to rename book");
      }

      setRenameModalOpen(false);
      setSelectedBook(null);
      setRenameName("");
      fetchBooks(); // Refresh the list
    } catch (err) {
      console.error("Error renaming book:", err);
      setError(err instanceof Error ? err.message : "Failed to rename book");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBook = async (book: Book) => {
    if (!window.confirm(`Are you sure you want to delete "${book.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE}/api/books/${book.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete book");
      }

      // Refresh the books list
      fetchBooks();
    } catch (err) {
      console.error("Error deleting book:", err);
      setError(err instanceof Error ? err.message : "Failed to delete book");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateSubmit = async () => {
    if (!selectedBook || !duplicateName.trim()) return;

    try {
      setSaving(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE}/api/books/${selectedBook.id}/duplicate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newName: duplicateName.trim(),
          ...duplicateOptions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to duplicate book");
      }

      setDuplicateModalOpen(false);
      setSelectedBook(null);
      setDuplicateName("");
      fetchBooks(); // Refresh the list
    } catch (err) {
      console.error("Error duplicating book:", err);
      setError(err instanceof Error ? err.message : "Failed to duplicate book");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell activePath="/cashbooks">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 space-y-6">
            {/* Business Name */}
            {selectedBusinessName && (
              <div className="mb-2">
                <h2 className="text-xl font-semibold text-[#1f2937]">{selectedBusinessName}</h2>
              </div>
            )}

            {/* Search and Sort */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by book name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pl-10 text-sm text-slate-900 placeholder-slate-400 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                  disabled={loading}
                />
                <svg
                  className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                disabled={loading}
              >
                <option value="lastUpdated">Sort By: Last Updated</option>
                <option value="name">Sort By: Name</option>
                <option value="balance">Sort By: Balance</option>
              </select>
            </div>

            {/* Books List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-[#2f4bff]"></div>
              </div>
            ) : error ? (
              <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</div>
            ) : books.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
                <p className="text-lg font-medium text-slate-600 mb-2">No cashbooks found</p>
                <p className="text-sm text-slate-500">Create your first cashbook to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {books.map((book) => (
                  <div
                    key={book.id}
                    onClick={() => router.push(`/cashbooks/${book.id}`)}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:shadow-md"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#2f4bff] to-[#4f6dff] text-white font-semibold">
                        {book.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-[#1f2937]">{book.name}</h3>
                        <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
                          <span>{book.memberCount || 1} members</span>
                          <span>•</span>
                          <span>{formatDateAgo(book.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-medium text-slate-600 mb-0.5">Net Balance</p>
                        <span
                          className={`text-base font-semibold ${
                            book.totalBalance >= 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {formatCurrency(book.totalBalance)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRename(book);
                          }}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#2f4bff] transition"
                          title="Rename"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(book);
                          }}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#2f4bff] transition"
                          title="Duplicate Book"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/cashbooks/${book.id}/settings/members`);
                          }}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-[#2f4bff] transition"
                          title="Add Member"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                        {isAdmin() && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBook(book);
                            }}
                            className="rounded-lg p-2 text-slate-400 hover:bg-red-100 hover:text-red-600 transition"
                            title="Delete Book"
                            disabled={saving}
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMoveBook(book);
                          }}
                          className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 transition"
                          title="Move to Another Business"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Book Section */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-3">
                <svg className="h-6 w-6 text-[#2f4bff]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-[#1f2937]">Add New Book</h3>
              </div>
              <p className="mb-4 text-sm text-slate-600">Click to quickly add books for</p>
              <div className="flex flex-wrap gap-2">
                {quickBookTemplates.map((template) => (
                  <button
                    key={template}
                    onClick={() => handleQuickBook(template)}
                    className="rounded-lg border border-[#2f4bff]/20 bg-white px-4 py-2 text-sm font-medium text-[#2f4bff] transition hover:border-[#2f4bff] hover:bg-[#2f4bff]/5"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <aside className="hidden w-80 space-y-4 lg:block">
            {/* Add New Book Button */}
            <button
              onClick={() => router.push("/add-new-book")}
              className="w-full rounded-xl bg-[#2f4bff] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(47,75,255,0.35)] transition hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add New Book
              </div>
            </button>

            {/* Login via Email ID Card */}
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h4 className="text-base font-semibold text-[#1f2937]">Login via Email ID</h4>
              </div>
              <p className="mb-4 text-sm text-slate-600">Verify email to login to desktop</p>
              {isEmailVerified && userEmail ? (
                <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-700">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Email Verified</span>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowEmailModal(true);
                    setEmailInput(userEmail || "");
                    setEmailError(null);
                    setEmailSuccess(null);
                  }}
                  className="w-full rounded-lg bg-[#2f4bff] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#2f4bff]/90"
                >
                  Add Email
                </button>
              )}
            </div>

            {/* Tried Passbook Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <svg className="h-6 w-6 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <h4 className="text-base font-semibold text-[#1f2937]">Tried Passbook?</h4>
              </div>
              <p className="mb-4 text-sm text-slate-600">
                Automatically get all online transactions at one place.
              </p>
              <button className="text-sm font-medium text-[#2f4bff] hover:underline">Know More &gt;</button>
            </div>

            {/* Need Help Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <h4 className="text-base font-semibold text-[#1f2937]">Need help in business setup?</h4>
              </div>
              <p className="mb-4 text-sm text-slate-600">Our support team will help you</p>
              <button className="text-sm font-medium text-[#2f4bff] hover:underline">Contact Us &gt;</button>
            </div>
          </aside>
        </div>

        {/* Rename Book Modal */}
        {renameModalOpen && selectedBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-[#1f2937]">Rename Book</h2>
                <button
                  onClick={() => {
                    setRenameModalOpen(false);
                    setSelectedBook(null);
                    setRenameName("");
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="rename-name" className="block text-sm font-medium text-slate-700 mb-2">
                      Book Name
                    </label>
                    <input
                      id="rename-name"
                      type="text"
                      value={renameName}
                      onChange={(e) => setRenameName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                      placeholder="Enter book name"
                      autoFocus
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  onClick={() => {
                    setRenameModalOpen(false);
                    setSelectedBook(null);
                    setRenameName("");
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameSubmit}
                  disabled={saving || !renameName.trim()}
                  className="rounded-xl bg-[#2f4bff] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2f4bff]/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Move Book Modal */}
        {moveBookModalOpen && selectedBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-[#1f2937]">Move Book to Another Business</h2>
                <button
                  onClick={() => {
                    setMoveBookModalOpen(false);
                    setSelectedBook(null);
                    setSelectedTargetBusiness("");
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4 flex items-start gap-3 rounded-lg bg-blue-50 p-3">
                  <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-800">
                    Move "{selectedBook.name}" to a different business. This will change the business association of the book.
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="target-business" className="block text-sm font-medium text-slate-700 mb-2">
                      Select Target Business <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="target-business"
                      value={selectedTargetBusiness}
                      onChange={(e) => setSelectedTargetBusiness(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                    >
                      <option value="">-- Select Business --</option>
                      {businesses
                        .filter((b) => b.id !== selectedBusinessId)
                        .map((business) => (
                          <option key={business.id} value={business.id}>
                            {business.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 rounded-lg bg-red-50 p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setMoveBookModalOpen(false);
                      setSelectedBook(null);
                      setSelectedTargetBusiness("");
                      setError(null);
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMoveBookSubmit}
                    disabled={saving || !selectedTargetBusiness}
                    className="rounded-lg bg-[#2f4bff] px-4 py-2 text-sm font-medium text-white hover:bg-[#2f4bff]/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Moving..." : "Move Book"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Duplicate Book Modal */}
        {duplicateModalOpen && selectedBook && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-[#1f2937]">Duplicate {selectedBook.name}</h2>
                <button
                  onClick={() => {
                    setDuplicateModalOpen(false);
                    setSelectedBook(null);
                    setDuplicateName("");
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4 flex items-start gap-3 rounded-lg bg-blue-50 p-3">
                  <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-800">
                    Create new book with same settings as {selectedBook.name}
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label htmlFor="duplicate-name" className="block text-sm font-medium text-slate-700 mb-2">
                      Enter new book name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="duplicate-name"
                      type="text"
                      value={duplicateName}
                      onChange={(e) => setDuplicateName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                      placeholder="Enter new book name"
                      autoFocus
                    />
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-slate-700">Choose settings to duplicate:</h3>
                    <div className="space-y-2">
                      {[
                        { key: 'duplicateMembers', label: 'Members & Roles' },
                        { key: 'duplicateCategories', label: 'Categories' },
                        { key: 'duplicatePaymentModes', label: 'Payment Modes' },
                        { key: 'duplicateParties', label: 'Party' },
                        { key: 'duplicateCustomFields', label: 'Custom Fields' },
                      ].map((option) => (
                        <label
                          key={option.key}
                          className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={duplicateOptions[option.key as keyof typeof duplicateOptions]}
                            onChange={(e) =>
                              setDuplicateOptions((prev) => ({
                                ...prev,
                                [option.key]: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 rounded border-slate-300 text-[#2f4bff] focus:ring-2 focus:ring-[#2f4bff]"
                          />
                          <span className="text-sm text-slate-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  onClick={() => {
                    setDuplicateModalOpen(false);
                    setSelectedBook(null);
                    setDuplicateName("");
                  }}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  disabled={saving}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
                <button
                  onClick={handleDuplicateSubmit}
                  disabled={saving || !duplicateName.trim()}
                  className="rounded-xl bg-[#2f4bff] px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2f4bff]/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {saving ? "Creating..." : "Add New Book"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Email Verification Modal */}
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-[#1f2937]">Add Email Address</h2>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailInput(userEmail || "");
                    setEmailError(null);
                    setEmailSuccess(null);
                  }}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-[#2f4bff] focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
                      disabled={sendingVerificationEmail}
                    />
                  </div>

                  {emailError && (
                    <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                      <p className="text-sm text-red-800">{emailError}</p>
                    </div>
                  )}

                  {emailSuccess && (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                      <p className="text-sm text-emerald-800">{emailSuccess}</p>
                    </div>
                  )}

                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                    <p className="text-xs text-blue-800">
                      We'll send a verification link to this email address. Click the link in the email to verify your account.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmailInput(userEmail || "");
                    setEmailError(null);
                    setEmailSuccess(null);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                  disabled={sendingVerificationEmail}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendVerificationEmail}
                  disabled={sendingVerificationEmail || !emailInput.trim()}
                  className="rounded-xl bg-[#2f4bff] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2f4bff]/90 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sendingVerificationEmail ? "Sending..." : "Verify Email"}
                </button>
              </div>
            </div>
          </div>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
