"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getAuthToken, isAdmin } from "../utils/auth";

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

interface BusinessesResponse {
  businesses: Business[];
}

export default function BusinessSelector() {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [businessSearch, setBusinessSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingBusinessId, setDeletingBusinessId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch businesses on mount
  useEffect(() => {
    fetchBusinesses();
  }, []);

  // Load selected business from localStorage on mount
  useEffect(() => {
    const savedBusinessId = localStorage.getItem("selectedBusinessId");
    if (savedBusinessId && businesses.length > 0) {
      const business = businesses.find((b) => b.id === savedBusinessId);
      if (business) {
        setSelectedBusiness(business);
      } else if (businesses.length > 0) {
        // If saved business not found, select first one
        setSelectedBusiness(businesses[0]);
        localStorage.setItem("selectedBusinessId", businesses[0].id);
      }
    } else if (businesses.length > 0 && !selectedBusiness) {
      // If no saved business, select first one
      setSelectedBusiness(businesses[0]);
      localStorage.setItem("selectedBusinessId", businesses[0].id);
    }
  }, [businesses]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        console.error("No auth token found");
        return;
      }

      const url = `${API_BASE}/api/businesses`;
      console.log("Fetching businesses from:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `HTTP ${response.status}: ${response.statusText}` };
        }
        
        // Log error but don't throw - let component handle gracefully
        console.warn("Failed to fetch businesses:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          url: url,
        });
        
        // If unauthorized, the token might not be valid for backend
        // This is expected if API system and backend use different JWT secrets
        if (response.status === 401 || response.status === 403) {
          console.warn("Authentication failed - backend may use different JWT secret than API system");
        }
        
        // Return empty array instead of throwing
        setBusinesses([]);
        setError(null);
        return;
      }

      const data: BusinessesResponse = await response.json();
      setBusinesses(data.businesses || []);
      setError(null);
    } catch (err) {
      // Only log network errors, not HTTP errors (already handled above)
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.warn("Network error fetching businesses:", err);
      } else {
        console.warn("Error fetching businesses:", err);
      }
      setBusinesses([]);
      setError(null);
      // Don't show error to user - component will just not render if no businesses
    } finally {
      setLoading(false);
    }
  };

  const handleBusinessSelect = (business: Business) => {
    setSelectedBusiness(business);
    localStorage.setItem("selectedBusinessId", business.id);
    setShowDropdown(false);
    setBusinessSearch("");
    // Dispatch custom event to notify other components of business change
    window.dispatchEvent(new CustomEvent('businessChanged', { detail: { businessId: business.id } }));
    // Reload the page to refresh all data
    window.location.reload();
  };

  const handleDeleteBusiness = async (business: Business, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the business when clicking delete
    
    if (!window.confirm(`Are you sure you want to delete "${business.name}"? This action cannot be undone and will delete all associated records.`)) {
      return;
    }

    try {
      setDeletingBusinessId(business.id);
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE}/api/businesses/${business.id}`, {
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

      // If deleted business was selected, clear selection
      if (selectedBusiness?.id === business.id) {
        setSelectedBusiness(null);
        localStorage.removeItem("selectedBusinessId");
        window.dispatchEvent(new CustomEvent('businessChanged', { detail: { businessId: null } }));
      }

      // Refresh businesses list
      fetchBusinesses();
    } catch (err) {
      console.error("Error deleting business:", err);
      alert(err instanceof Error ? err.message : "Failed to delete business");
    } finally {
      setDeletingBusinessId(null);
    }
  };

  const filteredBusinesses = businesses.filter((business) =>
    business.name.toLowerCase().includes(businessSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-[#2f4bff]"></div>
        <span className="text-sm text-slate-500">Loading...</span>
      </div>
    );
  }

  // Show selector even if no businesses - manager can add a new business
  // If there are no businesses, show "Add Business" button directly
  if (businesses.length === 0) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => router.push("/add-new-business")}
          className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-[#1f2937] transition hover:border-[#2f4bff] hover:bg-slate-50"
        >
          <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Business</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Header Button - Shows current business */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#1f2937] transition hover:border-[#2f4bff] hover:bg-slate-50"
      >
        <svg className="h-4 w-4 text-[#2f4bff]" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span className="max-w-[200px] truncate font-medium text-[#1f2937]">
          {selectedBusiness?.name || "Select Business"}
        </span>
        <svg
          className={`h-3 w-3 text-slate-400 transition-transform ${showDropdown ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute left-1/2 top-full z-50 mt-2 w-80 -translate-x-1/2 rounded-xl border border-slate-200 bg-white shadow-lg">
          {/* Header with current business */}
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
            <svg className="h-4 w-4 text-[#2f4bff]" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="flex-1 font-medium text-[#1f2937]">
              {selectedBusiness?.name || "Select Business"}
            </span>
            <svg
              className="h-3 w-3 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Search Bar */}
          <div className="p-2">
            <input
              type="text"
              placeholder="Search Business"
              value={businessSearch}
              onChange={(e) => setBusinessSearch(e.target.value)}
              className="w-full rounded-lg border border-[#2f4bff] px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2f4bff]/20"
              autoFocus
            />
          </div>

          {/* Business List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredBusinesses.length === 0 ? (
              <div className="px-4 py-3 text-center text-sm text-slate-500">
                {businessSearch ? "No businesses found" : "No businesses"}
              </div>
            ) : (
              filteredBusinesses.map((business) => {
                const isSelected = selectedBusiness?.id === business.id;
                const isDeleting = deletingBusinessId === business.id;
                return (
                  <div
                    key={business.id}
                    className={`flex items-center gap-2 px-4 py-3 transition-colors ${
                      isSelected ? "bg-purple-50" : "hover:bg-slate-50"
                    }`}
                  >
                    <button
                      onClick={() => handleBusinessSelect(business)}
                      className="flex flex-1 items-center gap-3 text-left"
                      disabled={isDeleting}
                    >
                      <div
                        className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                          isSelected
                            ? "border-purple-600 bg-purple-600"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && (
                          <div className="h-2 w-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <span className={`text-sm font-medium ${
                        isSelected ? "text-slate-900" : "text-slate-700"
                      }`}>
                        {business.name}
                      </span>
                    </button>
                    {isAdmin() && (
                      <button
                        onClick={(e) => handleDeleteBusiness(business, e)}
                        disabled={isDeleting}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-600 transition disabled:opacity-50"
                        title="Delete Business"
                      >
                        {isDeleting ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-red-600"></div>
                        ) : (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Add New Business Button */}
          <div className="border-t border-slate-200 p-2">
            <button
              onClick={() => {
                setShowDropdown(false);
                router.push("/add-new-business");
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2f4bff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#2f4bff]/90"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add New Business
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

