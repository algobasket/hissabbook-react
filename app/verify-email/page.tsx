"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/auth/verify-email?token=${token}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to verify email");
        }

        setStatus("success");
        setMessage("Email verified successfully! You can now close this window.");
        
        // Redirect to account info page after 3 seconds
        setTimeout(() => {
          router.push("/account-info");
        }, 3000);
      } catch (err) {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Failed to verify email");
      }
    };

    verifyEmail();
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="text-center">
          {status === "verifying" && (
            <>
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-[#2f4bff]"></div>
              <h1 className="mb-2 text-xl font-semibold text-slate-900">Verifying Email</h1>
              <p className="text-sm text-slate-600">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <svg
                  className="h-6 w-6 text-emerald-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="mb-2 text-xl font-semibold text-slate-900">Email Verified!</h1>
              <p className="mb-4 text-sm text-slate-600">{message}</p>
              <Link
                href="/account-info"
                className="inline-block rounded-xl bg-[#2f4bff] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#2f4bff]/90"
              >
                Go to Account Settings
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                <svg
                  className="h-6 w-6 text-rose-600"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="mb-2 text-xl font-semibold text-slate-900">Verification Failed</h1>
              <p className="mb-4 text-sm text-slate-600">{message}</p>
              <Link
                href="/account-info"
                className="inline-block rounded-xl border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Go to Account Settings
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-300 border-t-[#2f4bff]"></div>
            <h1 className="mb-2 text-xl font-semibold text-slate-900">Loading...</h1>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}

