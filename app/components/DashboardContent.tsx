"use client";

import { useEffect, useState } from "react";
import { getUserRole, getUser, getAuthToken } from "../utils/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:4000";

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
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserDetails();
  }, []);

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
        } else {
          // Fallback to localStorage
          const role = getUserRole();
          if (role) {
            setUserRole(role);
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


