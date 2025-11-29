"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef, useMemo } from "react";
import type { ReactNode } from "react";
import { getUser, clearAuth, getUserRole } from "../utils/auth";
import BusinessSelector from "./BusinessSelector";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || 
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

type NavItem = {
  label: string;
  href: string;
  icon: keyof typeof iconMap;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

type AppShellProps = {
  activePath: string;
  children: ReactNode;
};

const iconMap = {
  dashboard: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v4h8V3h-8z" />
    </svg>
  ),
  wallet: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <rect x="3" y="6" width="18" height="12" rx="3" />
      <path d="M16 12h3" strokeLinecap="round" />
    </svg>
  ),
  approvals: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="4" width="18" height="16" rx="3" />
    </svg>
  ),
  payout: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M12 3v18" strokeLinecap="round" />
      <path d="M7 8l5-5 5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 16l-5 5-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  account: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.8-3 4.6-5 8-5s6.2 2 8 5" strokeLinecap="round" />
    </svg>
  ),
  settings: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M11 2h2l1 3.1a7 7 0 012.6 1.5L20 6l1 2-2.4 1.8a7 7 0 01.1 2.4L21 14l-1 2-2.6-.6a7 7 0 01-2.6 1.6L13 22h-2l-1-3a7 7 0 01-2.6-1.6L5 16l-1-2 2.4-1.8a7 7 0 01-.1-2.4L3 8l1-2 2.6.6A7 7 0 019.2 5.1z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  cashbooks: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  ),
  team: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  business: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  subscription: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
} as const;

// All available navigation sections
const allNavSections: NavSection[] = [
  {
    title: "HissabBook UPI",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
      { label: "Request Payout", href: "/request-payout", icon: "payout" },
      { label: "Wallets", href: "/wallets", icon: "wallet" },
      { label: "Approvals", href: "/approvals", icon: "approvals" },
    ],
  },
  {
    title: "Account",
    items: [{ label: "Account Info", href: "/account-info", icon: "account" }],
  },
  {
    title: "Settings",
    items: [{ label: "Settings", href: "/settings", icon: "settings" }],
  },
];

// Manager-specific navigation sections
const managerNavSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
      { label: "Businesses List", href: "/businesses", icon: "business" },
    ],
  },
  {
    title: "Book Keeping",
    items: [
      { label: "Cashbooks", href: "/cashbooks", icon: "cashbooks" },
    ],
  },
  {
    title: "Finance",
    items: [
      { label: "Payout Approvals", href: "/approvals", icon: "approvals" },
    ],
  },
  {
    title: "Settings",
    items: [
      { label: "Team", href: "/team", icon: "team" },
      { label: "Create Staff", href: "/create-staff", icon: "team" },
      { label: "Business Settings", href: "/settings", icon: "business" },
      { label: "Subscription", href: "/subscription", icon: "subscription" },
    ],
  },
];

export default function AppShell({ activePath, children }: AppShellProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userInitial, setUserInitial] = useState("U");
  const [userRole, setUserRole] = useState<string | null>(null);
  const [smallLogoUrl, setSmallLogoUrl] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [userInvites, setUserInvites] = useState<
    Array<{
      id: string;
      businessName: string;
      role: string;
      inviteToken: string;
      businessId: string;
      email: string | null;
      phone: string | null;
      status: string;
      cashbookId?: string | null;
      createdAt?: string;
    }>
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Get user role and filter navigation based on role
  const navSections = useMemo(() => {
    if (userRole === "managers" || userRole === "manager") {
      return managerNavSections;
    }
    
    // For staff users, add Cashbooks and remove Settings section
    if (userRole === "staff") {
      const staffNavSections = [
        {
          title: "HissabBook UPI",
          items: [
            { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
            { label: "Request Payout", href: "/request-payout", icon: "payout" },
            { label: "Wallets", href: "/wallets", icon: "wallet" },
            { label: "Approvals", href: "/approvals", icon: "approvals" },
          ],
        },
        {
          title: "Book Keeping",
          items: [
            { label: "Cashbooks", href: "/cashbooks", icon: "cashbooks" },
          ],
        },
        {
          title: "Account",
          items: [{ label: "Account Info", href: "/account-info", icon: "account" }],
        },
      ];
      return staffNavSections;
    }
    
    return allNavSections;
  }, [userRole]);

  // Fetch invites for current user (for notifications dropdown)
  const fetchUserInvites = async () => {
    try {
      setLoadingNotifications(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      if (!token) {
        setUserInvites([]);
        return;
      }

      const response = await fetch(`${API_BASE}/api/invites/my`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        console.error("Failed to fetch user invites");
        setUserInvites([]);
        return;
      }

      const data = await response.json();
      const invites = data.invites || [];
      setUserInvites(invites);
      // Unread notifications = pending invites
      const pendingCount = invites.filter(
        (invite: { status: string }) =>
          invite.status && invite.status.toLowerCase() === "pending"
      ).length;
      setUnreadCount(pendingCount);
    } catch (err) {
      console.error("Error fetching user invites:", err);
      setUserInvites([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Initial fetch of invites for staff users so badge shows without opening dropdown
  useEffect(() => {
    if (userRole === "staff") {
      fetchUserInvites();
    }
  }, [userRole]);

  // Get user info on mount
  useEffect(() => {
    const user = getUser();
    const role = getUserRole();
    console.log("AppShell - User role:", role, "User:", user);
    setUserRole(role);
    
    if (user) {
      let displayName = "User";
      let initial = "U";
      
      // Prefer phone number if available (for phone-based users)
      if (user.phone) {
        // Format phone number: +91 98765 43210
        const phone = user.phone;
        if (phone.startsWith("91") && phone.length === 12) {
          displayName = `+${phone.slice(0, 2)} ${phone.slice(2, 7)} ${phone.slice(7)}`;
          initial = "+";
        } else {
          displayName = user.phone;
          initial = "+";
        }
      } else {
        // Extract name from email or use email as fallback
        const emailName = user.email?.split("@")[0] || "";
        
        // Handle temp email format (phone_919876543210@hissabbook.temp)
        if (emailName.startsWith("phone_")) {
          const phoneNumber = emailName.replace("phone_", "");
          if (phoneNumber.startsWith("91") && phoneNumber.length === 12) {
            displayName = `+${phoneNumber.slice(0, 2)} ${phoneNumber.slice(2, 7)} ${phoneNumber.slice(7)}`;
            initial = "+";
          } else {
            displayName = `+${phoneNumber}`;
            initial = "+";
          }
        } else if (emailName) {
          // Capitalize first letter of email name
          displayName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
          initial = displayName.charAt(0).toUpperCase();
        }
      }
      
      setUserName(displayName);
      setUserInitial(initial);
    }
  }, []);

  // Fetch small logo from site settings
  useEffect(() => {
    const fetchSmallLogo = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/settings/site/public`);
        if (response.ok) {
          const siteSettings = await response.json();
          if (siteSettings.smallLogoUrl) {
            const logoUrl = siteSettings.smallLogoUrl.startsWith('http') 
              ? siteSettings.smallLogoUrl 
              : `${API_BASE}/uploads/${siteSettings.smallLogoUrl}`;
            setSmallLogoUrl(logoUrl);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch small logo:", err);
        // Continue without logo - will show fallback
      }
    };
    fetchSmallLogo();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      // Close mobile sidebar when clicking outside
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement;
        // Don't close if clicking the menu button
        if (!target.closest('[data-mobile-menu-button]')) {
          setIsMobileSidebarOpen(false);
        }
      }
    }

    if (isDropdownOpen || isMobileSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen, isMobileSidebarOpen]);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [activePath]);

  const formatRoleName = (role: string | null): string => {
    if (!role) return "User";
    // Handle common role names
    if (role === "managers" || role === "manager") return "Manager";
    // Capitalize first letter and replace underscores with spaces
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#f5f7ff] font-sans text-[#111827]">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 w-72 flex-shrink-0 border-r border-slate-200 bg-white px-5 py-8 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Link href="/" className="flex items-center gap-3 px-4 pb-8 transition-transform hover:scale-105">
          {smallLogoUrl ? (
            <img
              src={smallLogoUrl}
              alt="HissabBook"
              className="h-[68px] w-auto object-contain cursor-pointer"
              onError={(e) => {
                // Fallback to default logo if image fails to load
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const fallback = parent.querySelector('.logo-fallback');
                  if (fallback) fallback.classList.remove('hidden');
                }
              }}
            />
          ) : null}
          <div className={`logo-fallback flex items-center gap-3 ${smallLogoUrl ? 'hidden' : ''}`}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2f4bff] text-lg font-bold text-white">
              H
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#2f4bff]">Console</p>
              <span className="text-lg font-semibold text-[#111827]">HissabBook</span>
            </div>
          </div>
        </Link>
        <nav className="space-y-8 text-sm font-medium text-[#1f2937]">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="flex items-center justify-between px-4 text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                {section.title}
                <svg className="h-3 w-3 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </p>
              <div className="mt-4 space-y-2">
                {section.items.map((item) => {
                  const active = activePath === item.href;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={`group flex items-center gap-3 rounded-xl px-4 py-3 transition ${
                        active ? "bg-[#2f4bff] text-white shadow-[0_8px_18px_rgba(47,75,255,0.35)]" : "hover:bg-slate-100"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          active ? "bg-white/15 text-white" : "bg-slate-100 text-[#334155] group-hover:bg-slate-200"
                        }`}
                      >
                        {iconMap[item.icon as keyof typeof iconMap]}
                      </span>
                      <span className={`text-sm font-medium ${active ? "text-white" : "text-[#1f2937]"}`}>
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="border-b border-slate-200 bg-white px-4 sm:px-8 py-3 sm:py-4">
          {/* Mobile Layout: Stacked */}
          <div className="lg:hidden space-y-3">
            {/* Top Row: Menu Button + Welcome Text */}
            <div className="flex items-start gap-3">
              {/* Mobile Menu Button */}
              <button
                data-mobile-menu-button
                onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
                aria-label="Toggle menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  {isMobileSidebarOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              <div className="flex-1 min-w-0">
                <h1 className="text-base font-semibold text-[#111827] leading-tight">
                  Welcome {formatRoleName(userRole)}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {(userRole === "staff" || userRole?.toLowerCase() === "staff") 
                    ? "Manage payout request, cashbook and staff all in one place"
                    : "Manage all your businesses, cashbook and staff all in one place"}
                </p>
              </div>
            </div>

            {/* Bottom Row: Business Selector + Actions */}
            <div className="flex items-center justify-center gap-2">
              {(userRole === "managers" || userRole === "manager") && (
                <div className="hidden">
                  <BusinessSelector />
                </div>
              )}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="relative">
                  <button
                    onClick={() => {
                      const nextOpen = !isNotificationsOpen;
                      setIsNotificationsOpen(nextOpen);
                      if (nextOpen) {
                        fetchUserInvites();
                      }
                    }}
                    className="relative inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-slate-200 text-[#2f4bff] transition hover:border-[#2f4bff]"
                  >
                    <span className="sr-only">Notifications</span>
                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                  {isNotificationsOpen && (
                    <>
                      {/* Backdrop overlay for mobile */}
                      <div 
                        className="fixed inset-0 bg-black/20 z-40 lg:hidden"
                        onClick={() => setIsNotificationsOpen(false)}
                      />
                      <div className="fixed left-1/2 -translate-x-1/2 top-[140px] sm:absolute sm:left-auto sm:right-0 sm:translate-x-0 sm:top-auto sm:mt-2 w-[90vw] sm:w-[480px] max-w-[90vw] sm:max-w-[480px] origin-top sm:origin-top-right rounded-lg sm:rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10 z-50">
                      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 sm:px-4">
                        <span className="text-[11px] sm:text-xs font-semibold text-slate-600">
                          Invitations
                        </span>
                        {loadingNotifications && (
                          <span className="text-[9px] sm:text-[10px] text-slate-400">Loading...</span>
                        )}
                      </div>
                      <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
                        {userInvites.length === 0 ? (
                          <div className="px-3 py-3 sm:px-4 sm:py-4 text-[11px] sm:text-xs text-slate-400">
                            No invitations found for your account.
                          </div>
                        ) : (
                          userInvites.map((invite) => {
                            const baseUrl =
                              typeof window !== "undefined"
                                ? window.location.origin
                                : "";
                            const identifier = invite.email || invite.phone || "";
                            const paramName = invite.email ? "email" : "phone";
                            let inviteLink = `${baseUrl}/invite?token=${invite.inviteToken}&business=${invite.businessId}&${paramName}=${encodeURIComponent(
                              identifier
                            )}&role=${invite.role}`;
                            if (invite.cashbookId) {
                              inviteLink += `&cashbook=${invite.cashbookId}`;
                            }
                            const inviteLinkDisplay = inviteLink;
                            return (
                              <div
                                key={invite.id}
                                className="border-b border-slate-100 px-3 py-2 sm:px-4 sm:py-3 last:border-b-0"
                              >
                                <div className="text-[11px] sm:text-xs font-semibold text-slate-800">
                                  {invite.businessName || "Business"}{" "}
                                  <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-medium uppercase text-slate-500">
                                    {invite.role}
                                  </span>
                                </div>
                                {invite.createdAt && (
                                  <div className="mt-0.5 text-[9px] sm:text-[10px] text-slate-400">
                                    Invited on{" "}
                                    {new Date(invite.createdAt).toLocaleDateString()}
                                  </div>
                                )}
                                <div className="mt-1.5 sm:mt-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1.5 sm:px-3 sm:py-2">
                                  <div className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                    Invite Link
                                  </div>
                                  <div className="mt-1 text-[10px] sm:text-[11px] text-slate-700 break-all font-mono">
                                    {inviteLinkDisplay}
                                  </div>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard
                                        .writeText(inviteLink)
                                        .then(() => {
                                          alert("Invite link copied to clipboard!");
                                        })
                                        .catch(() => {
                                          const textArea =
                                            document.createElement("textarea");
                                          textArea.value = inviteLink;
                                          document.body.appendChild(textArea);
                                          textArea.select();
                                          document.execCommand("copy");
                                          document.body.removeChild(textArea);
                                          alert("Invite link copied to clipboard!");
                                        });
                                    }}
                                    className="mt-1.5 sm:mt-2 inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium text-[#2357FF] hover:text-[#1a46d9]"
                                  >
                                    <svg
                                      className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                      />
                                    </svg>
                                    Copy Invite Link
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setIsNotificationsOpen(false);
                          router.push("/notifications");
                        }}
                        className="flex w-full items-center justify-center border-t border-slate-100 px-3 py-2 sm:px-4 text-[10px] sm:text-[11px] font-medium text-[#2357FF] hover:bg-slate-50"
                      >
                        See all
                      </button>
                    </div>
                    </>
                  )}
                </div>
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-200 bg-white px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-[#1f2937] transition hover:border-[#2f4bff]"
                  >
                    <span className="inline-flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-[#2f4bff]/10 text-xs sm:text-sm font-semibold text-[#2f4bff]">
                      {userInitial}
                    </span>
                    <span className="hidden sm:inline">{userName}</span>
                    <svg
                      className={`h-3 w-3 sm:h-4 sm:w-4 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                      {/* User Info Section */}
                      <div className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2f4bff]/10 text-sm font-semibold text-[#2f4bff]">
                            {userInitial}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-[#1f2937] truncate">
                              {userName}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {formatRoleName(userRole)}
                            </div>
                          </div>
                        </div>
                        <Link
                          href="/account-info"
                          onClick={() => setIsDropdownOpen(false)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-[#2f4bff] hover:text-[#2f4bff]/80 transition-colors"
                        >
                          Your Profile
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>

                      {/* Account Info & Settings */}
                      <div className="py-1 border-b border-slate-100">
                        <Link
                          href="/account-info"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-[#1f2937] transition hover:bg-slate-50"
                        >
                          <span className="flex h-5 w-5 items-center justify-center text-slate-400">
                            {iconMap.account}
                          </span>
                          <span>Account Info</span>
                        </Link>
                        {(userRole === "managers" || userRole === "manager") && (
                          <Link
                            href="/settings"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-[#1f2937] transition hover:bg-slate-50"
                          >
                            <span className="flex h-5 w-5 items-center justify-center text-slate-400">
                              {iconMap.settings}
                            </span>
                            <span>Settings</span>
                          </Link>
                        )}
                      </div>

                      {/* Logout */}
                      <div className="py-1 border-b border-slate-100">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 px-4 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                            />
                          </svg>
                          <span>Logout</span>
                        </button>
                      </div>

                      {/* Mobile App Section */}
                      <div className="px-4 py-3 border-b border-slate-100">
                        <div className="text-xs font-medium text-slate-500 mb-2">Mobile App</div>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setIsDropdownOpen(false);
                            // Add download app logic here
                            alert("Mobile app download coming soon!");
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                        >
                          <svg className="h-5 w-5 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                          </svg>
                          <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Download App</span>
                        </a>
                      </div>

                      {/* Copyright and Version */}
                      <div className="px-4 py-2 bg-slate-50">
                        <div className="text-xs text-slate-500 text-center">
                          &copy; HissabBook • Version 1.0.0
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout: Horizontal */}
          <div className="hidden lg:flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-[#111827]">
                Welcome {formatRoleName(userRole)}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {(userRole === "staff" || userRole?.toLowerCase() === "staff") 
                  ? "Manage payout request, cashbook and staff all in one place"
                  : "Manage all your businesses, cashbook and staff all in one place"}
              </p>
            </div>
            <div className="flex items-center justify-center flex-1">
              {(userRole === "managers" || userRole === "manager") && <BusinessSelector />}
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => {
                    const nextOpen = !isNotificationsOpen;
                    setIsNotificationsOpen(nextOpen);
                    if (nextOpen) {
                      fetchUserInvites();
                    }
                  }}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-[#2f4bff] transition hover:border-[#2f4bff]"
                >
                  <span className="sr-only">Notifications</span>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-[480px] origin-top-right rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/10 z-20">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
                      <span className="text-xs font-semibold text-slate-600">
                        Invitations
                      </span>
                      {loadingNotifications && (
                        <span className="text-[10px] text-slate-400">Loading...</span>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {userInvites.length === 0 ? (
                        <div className="px-4 py-4 text-xs text-slate-400">
                          No invitations found for your account.
                        </div>
                      ) : (
                        userInvites.map((invite) => {
                          const baseUrl =
                            typeof window !== "undefined"
                              ? window.location.origin
                              : "";
                          const identifier = invite.email || invite.phone || "";
                          const paramName = invite.email ? "email" : "phone";
                          let inviteLink = `${baseUrl}/invite?token=${invite.inviteToken}&business=${invite.businessId}&${paramName}=${encodeURIComponent(
                            identifier
                          )}&role=${invite.role}`;
                          if (invite.cashbookId) {
                            inviteLink += `&cashbook=${invite.cashbookId}`;
                          }
                          const inviteLinkDisplay = inviteLink;
                          return (
                            <div
                              key={invite.id}
                              className="border-b border-slate-100 px-4 py-3 last:border-b-0"
                            >
                              <div className="text-xs font-semibold text-slate-800">
                                {invite.businessName || "Business"}{" "}
                                <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-500">
                                  {invite.role}
                                </span>
                              </div>
                              {invite.createdAt && (
                                <div className="mt-0.5 text-[10px] text-slate-400">
                                  Invited on{" "}
                                  {new Date(invite.createdAt).toLocaleDateString()}
                                </div>
                              )}
                              <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                                <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                                  Invite Link
                                </div>
                                <div className="mt-1 text-[11px] text-slate-700 break-all font-mono">
                                  {inviteLinkDisplay}
                                </div>
                                <button
                                  onClick={() => {
                                    navigator.clipboard
                                      .writeText(inviteLink)
                                      .then(() => {
                                        alert("Invite link copied to clipboard!");
                                      })
                                      .catch(() => {
                                        const textArea =
                                          document.createElement("textarea");
                                        textArea.value = inviteLink;
                                        document.body.appendChild(textArea);
                                        textArea.select();
                                        document.execCommand("copy");
                                        document.body.removeChild(textArea);
                                        alert("Invite link copied to clipboard!");
                                      });
                                  }}
                                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#2357FF] hover:text-[#1a46d9]"
                                >
                                  <svg
                                    className="h-3 w-3"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                    />
                                  </svg>
                                  Copy Invite Link
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        router.push("/notifications");
                      }}
                      className="flex w-full items-center justify-center border-t border-slate-100 px-4 py-2 text-[11px] font-medium text-[#2357FF] hover:bg-slate-50"
                    >
                      See all
                    </button>
                  </div>
                )}
              </div>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#1f2937] transition hover:border-[#2f4bff]"
                >
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#2f4bff]/10 text-sm font-semibold text-[#2f4bff]">
                    {userInitial}
                  </span>
                  {userName}
                  <svg
                    className={`h-4 w-4 text-slate-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2f4bff]/10 text-sm font-semibold text-[#2f4bff]">
                          {userInitial}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[#1f2937] truncate">
                            {userName}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {formatRoleName(userRole)}
                          </div>
                        </div>
                      </div>
                      <Link
                        href="/account-info"
                        onClick={() => setIsDropdownOpen(false)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#2f4bff] hover:text-[#2f4bff]/80 transition-colors"
                      >
                        Your Profile
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>

                    {/* Account Info & Settings */}
                    <div className="py-1 border-b border-slate-100">
                      <Link
                        href="/account-info"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-[#1f2937] transition hover:bg-slate-50"
                      >
                        <span className="flex h-5 w-5 items-center justify-center text-slate-400">
                          {iconMap.account}
                        </span>
                        <span>Account Info</span>
                      </Link>
                      {(userRole === "managers" || userRole === "manager") && (
                        <Link
                          href="/settings"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-[#1f2937] transition hover:bg-slate-50"
                        >
                          <span className="flex h-5 w-5 items-center justify-center text-slate-400">
                            {iconMap.settings}
                          </span>
                          <span>Settings</span>
                        </Link>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="py-1 border-b border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                          />
                        </svg>
                        <span>Logout</span>
                      </button>
                    </div>

                    {/* Mobile App Section */}
                    <div className="px-4 py-3 border-b border-slate-100">
                      <div className="text-xs font-medium text-slate-500 mb-2">Mobile App</div>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setIsDropdownOpen(false);
                          // Add download app logic here
                          alert("Mobile app download coming soon!");
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                      >
                        <svg className="h-5 w-5 text-slate-700" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                        </svg>
                        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Download App</span>
                      </a>
                    </div>

                    {/* Copyright and Version */}
                    <div className="px-4 py-2 bg-slate-50">
                      <div className="text-xs text-slate-500 text-center">
                        &copy; HissabBook • Version 1.0.0
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 bg-[#f7f9ff] px-4 sm:px-8 py-6 sm:py-10">
          <div className="mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
