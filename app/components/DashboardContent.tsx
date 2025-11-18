"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserRole, getUser, getAuthToken, isManager } from "../utils/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

const statCards = [
  {
    title: "Wallet balance",
    value: "₹2,45,600",
    meta: "+12.4% vs last month",
    gradient: "from-[#2357FF] via-[#4f6dff] to-[#8aa8ff]",
  },
  {
    title: "Pending approvals",
    value: "08 requests",
    meta: "2 high priority",
    gradient: "from-[#00B8A9] via-[#3cd4c9] to-[#8bf1e6]",
  },
  {
    title: "Scheduled payouts",
    value: "₹58,200",
    meta: "Clears in 2 days",
    gradient: "from-[#8B5CF6] via-[#a686ff] to-[#d5c4ff]",
  },
] as const;

const recentUpdates = [
  {
    title: "Wallet recharge of ₹50,000 completed",
    time: "Today • 10:24 AM",
    accent: "bg-emerald-500/20 text-emerald-600",
  },
  {
    title: "Approval required for Staff B reimbursement",
    time: "Today • 08:10 AM",
    accent: "bg-amber-500/20 text-amber-600",
  },
  {
    title: "Payout of ₹18,400 queued for Dealer Wallet",
    time: "Yesterday • 05:32 PM",
    accent: "bg-[#2357FF]/10 text-[#2357FF]",
  },
] as const;

const quickActions = [
  {
    title: "Invite finance member",
    description: "Add collaborators to manage approvals quickly.",
  },
  {
    title: "Upload vendor list",
    description: "Bulk import and auto-create vendor wallets.",
  },
  {
    title: "Configure approval flow",
    description: "Set limits and multi-step approval rules.",
  },
] as const;

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

  useEffect(() => {
    fetchUserDetails();
  }, []);

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
              const dateA = new Date(`${a.entry_date}T${a.entry_time || "00:00:00"}`);
              const dateB = new Date(`${b.entry_date}T${b.entry_time || "00:00:00"}`);
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
        // Get role from account details
        if (data.role) {
          setUserRole(data.role);
          setIsManagerRole(data.role === "managers" || data.role === "manager");
          if (data.role === "managers" || data.role === "manager") {
            fetchManagerDashboardData();
          }
        } else {
          // Fallback to localStorage
          const role = getUserRole();
          if (role) {
            setUserRole(role);
            setIsManagerRole(role === "managers" || role === "manager");
            if (role === "managers" || role === "manager") {
              fetchManagerDashboardData();
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
      <div className="flex max-w-6xl flex-col gap-10">
        <section className="rounded-[40px] border border-white/50 bg-white/80 p-10 shadow-[0_45px_90px_rgba(35,87,255,0.12)] backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#2357FF]/90">Overview</p>
              <h1 className="mt-3 text-3xl font-semibold text-[#111827]">
                Welcome back, {userName || "User"}
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
                  const entryDate = new Date(`${entry.entry_date}T${entry.entry_time || "00:00:00"}`);
                  const isToday = entryDate.toDateString() === new Date().toDateString();
                  const timeStr = isToday
                    ? `Today • ${entryDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}`
                    : entryDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

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
  return (
    <div className="flex max-w-6xl flex-col gap-10">
      <section className="rounded-[40px] border border-white/50 bg-white/80 p-10 shadow-[0_45px_90px_rgba(35,87,255,0.12)] backdrop-blur">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#2357FF]/90">Overview</p>
            <h1 className="mt-3 text-3xl font-semibold text-[#111827]">
              Welcome back, {userName || "User"}
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
              Activate Payments
            </button>
            <button className="rounded-full border border-[#2357FF]/30 bg-white px-5 py-2 text-sm font-semibold text-[#2357FF] transition hover:border-[#2357FF]/60">
              Export Report
            </button>
          </div>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {statCards.map((card) => (
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

      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[36px] border border-white/50 bg-white/80 p-8 shadow-[0_30px_60px_rgba(35,87,255,0.1)] backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#111827]">Recent activity</h2>
              <p className="text-sm text-slate-500">Latest wallet, approval and payout updates.</p>
            </div>
            <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-500 transition hover:border-[#2357FF]/60 hover:text-[#2357FF]">
              View all
            </button>
          </div>
          <div className="mt-6 space-y-4">
            {recentUpdates.map((update) => (
              <div
                key={update.title}
                className="flex.items-start gap-3 rounded-3xl border border-slate-100 bg-white/90 p-4 shadow-sm"
              >
                <span className={`mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${update.accent}`}>
                  •
                </span>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#111827]">{update.title}</p>
                  <p className="text-xs text-slate-500">{update.time}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[32px] border border-white/50 bg-white/85 p-8 shadow-[0_30px_60px_rgba(35,87,255,0.1)] backdrop-blur">
            <h3 className="text-base font-semibold text-[#111827]">Quick actions</h3>
            <p className="mt-1 text-sm text-slate-500">Save time by jumping straight to frequent workflows.</p>
            <div className="mt-6 space-y-4">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  type="button"
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

          <div className="rounded-[32px] border border-[#2357FF]/20 bg-gradient-to-br from-[#2357FF]/15 to-white/90 p-6 text-sm text-[#2357FF] shadow-[0_20px_40px_rgba(35,87,255,0.12)]">
            Stay compliant with RBI &amp; NPCI guidelines. Complete KYC for every wallet before sending payouts.
          </div>
        </aside>
      </div>
    </div>
  );
}


