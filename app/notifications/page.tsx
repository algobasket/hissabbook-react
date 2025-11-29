 "use client";

import AppShell from "../components/AppShell";
import { useEffect, useState } from "react";
import { getAuthToken } from "../utils/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

interface UserInvite {
  id: string;
  businessId: string;
  businessName: string;
  email: string | null;
  phone: string | null;
  role: string;
  inviteToken: string;
  status: string;
  cashbookId?: string | null;
  createdAt?: string;
}

export default function NotificationsPage() {
  const [invites, setInvites] = useState<UserInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvites = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = getAuthToken();
        if (!token) {
          setInvites([]);
          setError("Not authenticated");
          return;
        }

        const response = await fetch(`${API_BASE}/api/invites/my`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || "Failed to load notifications");
        }

        const data = await response.json();
        setInvites(data.invites || []);
      } catch (err) {
        console.error("Error loading notifications:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load notifications"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInvites();
  }, []);

  return (
    <AppShell activePath="/notifications">
      <section className="w-full rounded-3xl border border-white/70 bg-white p-8 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#1f2937]">
              Notifications
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              All invitations linked to your account.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-[#2f4bff]" />
          </div>
        ) : error ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : invites.length === 0 ? (
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            You don&apos;t have any invitations yet.
          </div>
        ) : (
          <div className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {invites.map((invite) => {
              const baseUrl =
                typeof window !== "undefined" ? window.location.origin : "";
              const identifier = invite.email || invite.phone || "";
              const paramName = invite.email ? "email" : "phone";
              let inviteLink = `${baseUrl}/invite?token=${invite.inviteToken}&business=${invite.businessId}&${paramName}=${encodeURIComponent(
                identifier
              )}&role=${invite.role}`;
              if (invite.cashbookId) {
                inviteLink += `&cashbook=${invite.cashbookId}`;
              }

              return (
                <div
                  key={invite.id}
                  className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {invite.businessName || "Business"}{" "}
                      <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium uppercase text-slate-600">
                        {invite.role}
                      </span>
                    </div>
                    {invite.createdAt && (
                      <div className="mt-0.5 text-xs text-slate-400">
                        Invited on{" "}
                        {new Date(invite.createdAt).toLocaleDateString()}
                      </div>
                    )}
                    <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                        Invite Link
                      </div>
                      <div className="mt-1 text-[11px] text-slate-700 break-all font-mono">
                        {inviteLink}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 pt-1 sm:flex-col sm:items-end sm:pt-0">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium uppercase text-slate-600">
                      {invite.status}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard
                          .writeText(inviteLink)
                          .then(() => {
                            alert("Invite link copied to clipboard!");
                          })
                          .catch(() => {
                            const textArea = document.createElement("textarea");
                            textArea.value = inviteLink;
                            document.body.appendChild(textArea);
                            textArea.select();
                            document.execCommand("copy");
                            document.body.removeChild(textArea);
                            alert("Invite link copied to clipboard!");
                          });
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-[#2357FF] hover:bg-slate-50"
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
                      Copy Link
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}


