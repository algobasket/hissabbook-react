"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserRole, getUser, getAuthToken, isManager } from "../utils/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

const statCardGradients = {
  wallet: "from-[#2357FF] via-[#4f6dff] to-[#8aa8ff]",
  pending: "from-[#00B8A9] via-[#3cd4c9] to-[#8bf1e6]",
  payouts: "from-[#8B5CF6] via-[#a686ff] to-[#d5c4ff]",
} as const;

// Recent updates will be fetched dynamically


export default function DashboardContent() {
  const router = useRouter();
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [isManagerRole, setIsManagerRole] = useState(false);
  const [cashbooks, setCashbooks] = useState<any[]>([]);
  const [recentEntries, setRecentEntries] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalCashbooks: 0,
    totalBusinesses: 0,
    totalEntries: 0,
    totalCashIn: 0,
    totalCashOut: 0,
  });

  const [staffStats, setStaffStats] = useState({
    walletBalance: 0,
    walletCurrency: "INR",
    pendingApprovals: 0,
    totalPayoutAmount: 0,
  });
  const [recentActivities, setRecentActivities] = useState<Array<{
    title: string;
    time: string;
    accent: string;
  }>>([]);

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchStaffDashboardData = async () => {
    try {
      setDataLoading(true);
      const token = getAuthToken();
      if (!token) {
        return;
      }

      // Fetch pending payout requests for this user / role
      const response = await fetch(`${API_BASE}/api/payout-requests?status=pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const payoutRequests = data.payoutRequests || [];
        const pendingCount = payoutRequests.length;
        const totalAmount = payoutRequests.reduce(
          (sum: number, req: any) => sum + (typeof req.amount === "number" ? req.amount : 0),
          0
        );

        setStaffStats((prev) => ({
          ...prev,
          pendingApprovals: pendingCount,
          totalPayoutAmount: totalAmount,
        }));
      }

      // Fetch recent payout requests (all statuses, limit to 10 most recent)
      const recentResponse = await fetch(`${API_BASE}/api/payout-requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (recentResponse.ok) {
        const recentData = await recentResponse.json();
        const allRequests = recentData.payoutRequests || [];
        
        // Sort by created_at descending and take first 5
        const sortedRequests = [...allRequests].sort((a: any, b: any) => {
          const dateA = new Date(a.createdAt || a.created_at || 0).getTime();
          const dateB = new Date(b.createdAt || b.created_at || 0).getTime();
          return dateB - dateA;
        }).slice(0, 5);

        // Format as activity items
        const activities = sortedRequests.map((request: any) => {
          const createdAt = new Date(request.createdAt || request.created_at);
          const now = new Date();
          const diffMs = now.getTime() - createdAt.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffMinutes = Math.floor(diffMs / (1000 * 60));

          let timeStr = "";
          if (diffDays === 0) {
            if (diffHours === 0) {
              timeStr = `Just now`;
            } else {
              const hours = createdAt.getHours();
              const minutes = createdAt.getMinutes();
              const ampm = hours >= 12 ? "PM" : "AM";
              const hour12 = hours % 12 || 12;
              timeStr = `Today • ${hour12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${ampm}`;
            }
          } else if (diffDays === 1) {
            const hours = createdAt.getHours();
            const minutes = createdAt.getMinutes();
            const ampm = hours >= 12 ? "PM" : "AM";
            const hour12 = hours % 12 || 12;
            timeStr = `Yesterday • ${hour12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${ampm}`;
          } else {
            timeStr = createdAt.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
          }

          const amount = typeof request.amount === "number" ? request.amount : 0;
          const formattedAmount = new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
          }).format(amount);

          let title = "";
          let accent = "";

          if (request.status === "pending") {
            title = `Approval required for ${request.submittedBy || "payout request"} - ${formattedAmount}`;
            accent = "bg-amber-500/20 text-amber-600";
          } else if (request.status === "accepted") {
            title = `Payout of ${formattedAmount} approved`;
            accent = "bg-emerald-500/20 text-emerald-600";
          } else if (request.status === "rejected") {
            title = `Payout request of ${formattedAmount} rejected`;
            accent = "bg-rose-500/20 text-rose-600";
          } else {
            title = `Payout request of ${formattedAmount} submitted`;
            accent = "bg-[#2357FF]/10 text-[#2357FF]";
          }

          return {
            title,
            time: timeStr,
            accent,
          };
        });

        setRecentActivities(activities);
      }
    } catch (err) {
      console.error("Error fetching staff dashboard data:", err);
    } finally {
      setDataLoading(false);
    }
  };

  // Fetch manager data when role is determined
  useEffect(() => {
    if ((isManagerRole || isManager()) && !loading) {
      // Small delay to ensure user details are loaded
      const timer = setTimeout(() => {
        fetchManagerDashboardData();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isManagerRole, loading]);

  const fetchManagerDashboardData = async () => {
    try {
      setDataLoading(true);
      const token = getAuthToken();
      if (!token) {
        console.log("No auth token found for manager dashboard");
        setDataLoading(false);
        return;
      }

      console.log("Fetching manager dashboard data from:", API_BASE);

      // Fetch businesses
      try {
        const businessesResponse = await fetch(`${API_BASE}/api/businesses`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (businessesResponse.ok) {
          const businessesData = await businessesResponse.json();
          const businessesCount = businessesData.businesses?.length || 0;
          console.log("Businesses fetched:", businessesCount);
          setStats(prev => ({ ...prev, totalBusinesses: businessesCount }));
        } else if (businessesResponse.status === 404 || businessesResponse.status === 403) {
          // Endpoint not found or no permission - set to 0 and continue
          console.log("Businesses endpoint not accessible (404/403), setting to 0");
          setStats(prev => ({ ...prev, totalBusinesses: 0 }));
        } else {
          console.warn("Failed to fetch businesses:", businessesResponse.status, businessesResponse.statusText);
          setStats(prev => ({ ...prev, totalBusinesses: 0 }));
        }
      } catch (err) {
        // Silently fail for businesses - not critical for dashboard
        console.warn("Error fetching businesses (non-critical):", err);
        setStats(prev => ({ ...prev, totalBusinesses: 0 }));
      }

      // Fetch cashbooks
      try {
        const booksResponse = await fetch(`${API_BASE}/api/books`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (booksResponse.ok) {
          const booksData = await booksResponse.json();
          const cashbooksList = booksData.books || [];
          console.log("Cashbooks fetched:", cashbooksList.length);
          setCashbooks(cashbooksList);
          setStats(prev => ({ ...prev, totalCashbooks: cashbooksList.length }));

          // Fetch recent entries from all cashbooks
          if (cashbooksList.length > 0) {
            const allEntries: any[] = [];
            let totalCashIn = 0;
            let totalCashOut = 0;

            // Fetch entries from all cashbooks (not just first 5)
            const entryPromises = cashbooksList.map(async (book: any) => {
              try {
                const entriesResponse = await fetch(`${API_BASE}/api/books/${book.id}/entries?limit=50`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                  },
                });

                if (entriesResponse.ok) {
                  const entriesData = await entriesResponse.json();
                  if (entriesData.entries && entriesData.entries.length > 0) {
                    entriesData.entries.forEach((entry: any) => {
                      const amount = parseFloat(entry.amount || 0);
                      if (entry.entry_type === "cash_in") {
                        totalCashIn += amount;
                      } else {
                        totalCashOut += amount;
                      }
                    });
                    allEntries.push(...entriesData.entries);
                  }
                } else {
                  console.error(`Failed to fetch entries for book ${book.id}:`, entriesResponse.status);
                }
              } catch (err) {
                console.error(`Error fetching entries for book ${book.id}:`, err);
              }
            });

            await Promise.all(entryPromises);

            console.log("Total entries fetched:", allEntries.length);
            console.log("Total Cash In:", totalCashIn);
            console.log("Total Cash Out:", totalCashOut);

            // Sort by date and get recent 5
            allEntries.sort((a, b) => {
              const getDate = (entry: any) => {
                if (!entry.entry_date) return new Date(0); // Use epoch if no date
                const dateStr = entry.entry_date.includes('T') 
                  ? entry.entry_date 
                  : `${entry.entry_date}T${entry.entry_time || "00:00:00"}`;
                const date = new Date(dateStr);
                return isNaN(date.getTime()) ? new Date(0) : date; // Use epoch if invalid
              };
              const dateA = getDate(a);
              const dateB = getDate(b);
              return dateB.getTime() - dateA.getTime();
            });

            setRecentEntries(allEntries.slice(0, 5));
            setStats(prev => ({
              ...prev,
              totalEntries: allEntries.length,
              totalCashIn,
              totalCashOut,
            }));
          } else {
            // No cashbooks, reset entries
            console.log("No cashbooks found, resetting entries");
            setRecentEntries([]);
            setStats(prev => ({
              ...prev,
              totalEntries: 0,
              totalCashIn: 0,
              totalCashOut: 0,
            }));
          }
        } else {
          console.error("Failed to fetch cashbooks:", booksResponse.status, booksResponse.statusText);
          // If cashbooks fail, we still want to show 0 rather than breaking
          setStats(prev => ({ ...prev, totalCashbooks: 0 }));
        }
      } catch (err) {
        console.error("Error fetching cashbooks:", err);
      }
    } catch (err) {
      console.error("Error fetching manager dashboard data:", err);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) {
        // Fallback to localStorage if no token
        const user = getUser();
        const role = getUserRole();
        if (user) {
          const name = user.email?.split("@")[0] || "User";
          setUserName(name);
        } else {
          setUserName("User");
        }
        if (role) {
          setUserRole(role);
          setIsManagerRole(role === "managers" || role === "manager");
          if (role === "managers" || role === "manager") {
            fetchManagerDashboardData();
          }
        }
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
        // Get name from account details
        if (data.name) {
          setUserName(data.name);
        } else if (data.firstName) {
          const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ").trim();
          setUserName(fullName || data.email?.split("@")[0] || "User");
        } else {
          // Fallback to email or user from localStorage
          const user = getUser();
          setUserName(user?.email?.split("@")[0] || "User");
        }
        // Capture wallet stats for staff dashboard
        if (typeof data.walletBalance === "number") {
          setStaffStats((prev) => ({
            ...prev,
            walletBalance: data.walletBalance,
            walletCurrency: data.walletCurrency || "INR",
          }));
        }

        // Get role from account details
        if (data.role) {
          setUserRole(data.role);
          setIsManagerRole(data.role === "managers" || data.role === "manager");
          if (data.role === "managers" || data.role === "manager") {
            fetchManagerDashboardData();
          } else {
            fetchStaffDashboardData();
          }
        } else {
          // Fallback to localStorage
          const role = getUserRole();
          if (role) {
            setUserRole(role);
            setIsManagerRole(role === "managers" || role === "manager");
            if (role === "managers" || role === "manager") {
              fetchManagerDashboardData();
            } else {
              fetchStaffDashboardData();
            }
          }
        }
      } else {
        // Fallback to localStorage if API fails
        const user = getUser();
        const role = getUserRole();
        if (user) {
          const name = user.email?.split("@")[0] || "User";
          setUserName(name);
        } else {
          setUserName("User");
        }
        if (role) {
          setUserRole(role);
          setIsManagerRole(role === "managers" || role === "manager");
          if (role === "managers" || role === "manager") {
            fetchManagerDashboardData();
          } else {
            fetchStaffDashboardData();
          }
        }
      }
    } catch (err) {
      // Fallback to localStorage on error
      const user = getUser();
      const role = getUserRole();
      if (user) {
        const name = user.email?.split("@")[0] || "User";
        setUserName(name);
      } else {
        setUserName("User");
      }
      if (role) {
        setUserRole(role);
        setIsManagerRole(role === "managers" || role === "manager");
        if (role === "managers" || role === "manager") {
          fetchManagerDashboardData();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Format role name for display (capitalize first letter, replace underscores with spaces)
  const formatRoleName = (roleName: string | null): string => {
    if (!roleName) return "";
    return roleName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const displayRole = formatRoleName(userRole);
  const isManagerUser = isManagerRole || isManager();

  const displayUserName =
    userName && userName.startsWith("phone_")
      ? userName.replace("phone_", "")
      : userName;

  const showPhoneIcon =
    !!displayUserName &&
    (userName?.startsWith("phone_") || /^\d{10,}$/.test(displayUserName));

  const renderUserName = () => {
    if (!displayUserName) return "User";
    if (!showPhoneIcon) return displayUserName;

    return (
      <span className="inline-flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#2f4bff]/10 text-[#2f4bff]">
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.684l1.1 3.3a1 1 0 01-.25 1.02l-1.7 1.7a11.05 11.05 0 005.18 5.18l1.7-1.7a1 1 0 011.02-.25l3.3 1.1a1 1 0 01.684.95V19a2 2 0 01-2 2h-1C9.82 21 3 14.18 3 6V5z"
            />
          </svg>
        </span>
        <span>{displayUserName}</span>
      </span>
    );
  };

  // Manager Dashboard
  if (isManagerUser) {
    const managerStatCards = [
      {
        title: "Total Cashbooks",
        value: stats.totalCashbooks.toString(),
        meta: "Active cashbooks",
        gradient: "from-[#2357FF] via-[#4f6dff] to-[#8aa8ff]",
      },
      {
        title: "Total Businesses",
        value: stats.totalBusinesses.toString(),
        meta: "Registered businesses",
        gradient: "from-[#F59E0B] via-[#fbbf24] to-[#fde047]",
      },
      {
        title: "Total Cash In",
        value: `₹${stats.totalCashIn.toLocaleString("en-IN")}`,
        meta: "All time",
        gradient: "from-[#00B8A9] via-[#3cd4c9] to-[#8bf1e6]",
      },
      {
        title: "Total Cash Out",
        value: `₹${stats.totalCashOut.toLocaleString("en-IN")}`,
        meta: "All time",
        gradient: "from-[#8B5CF6] via-[#a686ff] to-[#d5c4ff]",
      },
    ];

    const managerQuickActions = [
      {
        title: "View All Cashbooks",
        description: "Access and manage all your cashbooks.",
        onClick: () => router.push("/cashbooks"),
      },
      {
        title: "Create New Cashbook",
        description: "Start tracking a new cashbook.",
        onClick: () => router.push("/cashbooks"),
      },
      {
        title: "View Reports",
        description: "Generate and download financial reports.",
        onClick: () => router.push("/cashbooks"),
      },
    ];

    return (
      <div className="flex w-full flex-col gap-10">
        <section className="rounded-[40px] border border-white/50 bg-white/80 p-10 shadow-[0_45px_90px_rgba(35,87,255,0.12)] backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#2357FF]/90">Overview</p>
              <h1 className="mt-3 text-3xl font-semibold text-[#111827]">
                Welcome back, {renderUserName()}
              </h1>
              {displayRole && (
                <p className="mt-1 text-sm font-medium text-[#2357FF]">
                  {displayRole}
                </p>
              )}
              <p className="mt-2 text-sm text-slate-500">
                Manage your cashbooks, track entries, and generate reports all in one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => router.push("/cashbooks")}
                className="rounded-full bg-[#2357FF] px-5 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(35,87,255,0.25)] transition hover:-translate-y-0.5"
              >
                View Cashbooks
              </button>
            </div>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {dataLoading ? (
              <div className="col-span-4 flex items-center justify-center py-8">
                <div className="text-sm text-slate-500">Loading dashboard data...</div>
              </div>
            ) : (
              managerStatCards.map((card) => (
                <div key={card.title} className={`rounded-[32px] bg-gradient-to-br ${card.gradient} p-[1px] shadow-lg`}>
                  <div className="flex h-full w-full flex-col gap-4 rounded-[30px] bg-white/85 p-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-500">{card.title}</span>
                      <span className="rounded-2xl bg-white/80 px-3 py-2 text-[#2357FF]">•</span>
                    </div>
                    <p className="text-2xl font-semibold text-[#111827]">{card.value}</p>
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{card.meta}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[36px] border border-white/50 bg-white/80 p-8 shadow-[0_30px_60px_rgba(35,87,255,0.1)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#111827]">Recent Entries</h2>
                <p className="text-sm text-slate-500">Latest cashbook entries you've created.</p>
              </div>
              <button
                onClick={() => router.push("/cashbooks")}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-[#2357FF]/60 hover:text-[#2357FF]"
              >
                View all
              </button>
            </div>
            <div className="mt-6 space-y-4">
              {recentEntries.length > 0 ? (
                recentEntries.map((entry, index) => {
                  // Safely parse date with validation
                  let entryDate: Date;
                  let timeStr = "Date not available";
                  
                  if (entry.entry_date) {
                    try {
                      // entry_date is in YYYY-MM-DD format, entry_time is in HH:MM:SS format
                      let dateStr = entry.entry_date;
                      
                      // If entry_date already includes time (ISO format), use it directly
                      if (dateStr.includes('T')) {
                        entryDate = new Date(dateStr);
                      } else {
                        // Combine date and time
                        const timePart = entry.entry_time || "00:00:00";
                        // Ensure time is in HH:MM:SS format
                        const timeParts = timePart.split(':');
                        const formattedTime = timeParts.length === 2 
                          ? `${timePart}:00` 
                          : timePart;
                        dateStr = `${entry.entry_date}T${formattedTime}`;
                        entryDate = new Date(dateStr);
                      }
                      
                      // Check if date is valid
                      if (!isNaN(entryDate.getTime())) {
                        const isToday = entryDate.toDateString() === new Date().toDateString();
                        timeStr = isToday
                          ? `Today • ${entryDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}`
                          : entryDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                      } else {
                        // Fallback: try parsing just the date part
                        const simpleDate = new Date(entry.entry_date);
                        if (!isNaN(simpleDate.getTime())) {
                          entryDate = simpleDate;
                          timeStr = simpleDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
                        } else {
                          entryDate = new Date();
                          timeStr = "Invalid Date";
                        }
                      }
                    } catch (err) {
                      console.warn("Error parsing date for entry:", entry.id, err);
                      entryDate = new Date();
                      timeStr = "Date not available";
                    }
                  } else {
                    // No date available, use current date as fallback
                    entryDate = new Date();
                    timeStr = "Date not available";
                  }

                  return (
                    <div
                      key={entry.id || index}
                      className="flex items-start gap-3 rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-sm"
                    >
                      <span className={`mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${
                        entry.entry_type === "cash_in" ? "bg-emerald-500/20 text-emerald-600" : "bg-red-500/20 text-red-600"
                      }`}>
                        {entry.entry_type === "cash_in" ? "+" : "−"}
                      </span>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-semibold text-[#111827]">
                          {entry.entry_type === "cash_in" ? "Cash In" : "Cash Out"} - ₹{parseFloat(entry.amount || 0).toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-slate-500">
                          {entry.remarks || entry.party_name || "No remarks"} • {timeStr}
                        </p>
                        {entry.category_name && (
                          <p className="text-xs text-slate-400">{entry.category_name}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-sm text-slate-500">
                  No recent entries found. Start by creating entries in your cashbooks.
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-[32px] border border-white/50 bg-white/85 p-8 shadow-[0_30px_60px_rgba(35,87,255,0.1)] backdrop-blur">
              <h3 className="text-base font-semibold text-[#111827]">Quick actions</h3>
              <p className="mt-1 text-sm text-slate-500">Save time by jumping straight to frequent workflows.</p>
              <div className="mt-6 space-y-4">
                {managerQuickActions.map((action) => (
                  <button
                    key={action.title}
                    type="button"
                    onClick={action.onClick}
                    className="group flex w-full items-center gap-4 rounded-2xl border border-[#2357FF]/20 bg-white/90 px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#2357FF]/40"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2357FF]/10 text-[#2357FF]">★</span>
                    <span>
                      <span className="block text-sm font-semibold text-[#111827] group-hover:text-[#2357FF]">{action.title}</span>
                      <span className="text-xs text-slate-500">{action.description}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {cashbooks.length > 0 && (
              <div className="rounded-[32px] border border-white/50 bg-white/85 p-8 shadow-[0_30px_60px_rgba(35,87,255,0.1)] backdrop-blur">
                <h3 className="text-base font-semibold text-[#111827]">Your Cashbooks</h3>
                <p className="mt-1 text-sm text-slate-500">Quick access to your cashbooks.</p>
                <div className="mt-6 space-y-3">
                  {cashbooks.slice(0, 5).map((book) => (
                    <button
                      key={book.id}
                      onClick={() => router.push(`/cashbooks/${book.id}`)}
                      className="group flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-[#2357FF]/40 hover:bg-slate-50"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[#111827] group-hover:text-[#2357FF]">{book.name}</p>
                        {book.description && (
                          <p className="text-xs text-slate-500">{book.description}</p>
                        )}
                      </div>
                      <svg className="h-5 w-5 text-slate-400 group-hover:text-[#2357FF]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    );
  }

  // Regular Dashboard (for non-managers)
  const walletDisplay =
    typeof staffStats.walletBalance === "number"
      ? new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: staffStats.walletCurrency || "INR",
          maximumFractionDigits: 0,
        }).format(staffStats.walletBalance)
      : "₹0";

  const staffStatCards = [
    {
      title: "Wallet UPI Balance",
      value: walletDisplay,
      meta: "Current wallet balance",
      gradient: statCardGradients.wallet,
    },
    {
      title: "Pending Approvals",
      value: `${staffStats.pendingApprovals.toString().padStart(2, "0")} requests`,
      meta:
        staffStats.pendingApprovals > 0
          ? `${staffStats.pendingApprovals} pending approval${staffStats.pendingApprovals > 1 ? "s" : ""}`
          : "No pending approvals",
      gradient: statCardGradients.pending,
    },
    {
      title: "Total Payout Amount",
      value: new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(staffStats.totalPayoutAmount || 0),
      meta: "Sum of pending payout requests",
      gradient: statCardGradients.payouts,
    },
  ];

  return (
    <div className="flex w-full flex-col gap-10">
      <section className="rounded-[40px] border border-white/50 bg-white/80 p-10 shadow-[0_45px_90px_rgba(35,87,255,0.12)] backdrop-blur">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#2357FF]/90">Overview</p>
            <h1 className="mt-3 text-3xl font-semibold text-[#111827]">
              Welcome back, {renderUserName()}
            </h1>
            {displayRole && (
              <p className="mt-1 text-sm font-medium text-[#2357FF]">
                {displayRole}
              </p>
            )}
            <p className="mt-2 text-sm text-slate-500">
              Keep an eye on wallet balances, approvals and payouts all in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-full bg-[#2357FF] px-5 py-2 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(35,87,255,0.25)] transition hover:-translate-y-0.5">
              UPI Sync Connect
            </button>
          </div>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {staffStatCards.map((card) => (
            <div key={card.title} className={`rounded-[32px] bg-gradient-to-br ${card.gradient} p-[1px] shadow-lg`}>
              <div className="flex h-full w-full flex-col gap-4 rounded-[30px] bg-white/85 p-6">
                <div className="flex.items-center justify-between">
                  <span className="text-sm font-semibold text-slate-500">{card.title}</span>
                  <span className="rounded-2xl bg-white/80 px-3 py-2 text-[#2357FF]">•</span>
                </div>
                <p className="text-2xl font-semibold text-[#111827]">{card.value}</p>
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">{card.meta}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-10">
        <section className="rounded-[36px] border border-white/50 bg-white/80 p-8 shadow-[0_30px_60px_rgba(35,87,255,0.1)] backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#111827]">Recent activity</h2>
              <p className="text-sm text-slate-500">Latest wallet, approval and payout updates.</p>
            </div>
            <button 
              onClick={() => router.push("/approvals")}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-[#2357FF]/60 hover:text-[#2357FF]"
            >
              View all
            </button>
          </div>
          <div className="mt-6 space-y-4">
            {dataLoading ? (
              <div className="py-8 text-center text-sm text-slate-500">
                Loading recent activities...
              </div>
            ) : recentActivities.length > 0 ? (
              recentActivities.map((update, index) => (
                <div
                  key={`${update.title}-${index}`}
                  className="flex items-start gap-3 rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-sm"
                >
                  <span className={`mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${update.accent}`}>
                    •
                  </span>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[#111827]">{update.title}</p>
                    <p className="text-xs text-slate-500">{update.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-slate-500">
                No recent activities found.
              </div>
            )}
          </div>
        </section>

        <div className="rounded-[32px] border border-[#2357FF]/20 bg-gradient-to-br from-[#2357FF]/15 to-white/90 p-6 text-sm text-[#2357FF] shadow-[0_20px_40px_rgba(35,87,255,0.12)]">
          Stay compliant with RBI &amp; NPCI guidelines. Complete KYC for every wallet before sending payouts.
        </div>
      </div>
    </div>
  );
}


