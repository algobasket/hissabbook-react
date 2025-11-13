"use client";

import { useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:4000";

type Step = "enter" | "verify";

type ApiResponse = {
  message?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    status: string;
    roles?: string[];
    role?: string;
  };
};

interface EmailPasswordLoginFormProps {
  onSwitchToOtp?: () => void;
}

export default function EmailPasswordLoginForm({ onSwitchToOtp }: EmailPasswordLoginFormProps) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<Step>("enter");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const sendOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setError(null);

    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/otp/email/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ApiResponse;
        throw new Error(data.message || "Failed to send OTP");
      }

      setStatus("OTP sent successfully to your email");
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setError(null);

    if (code.trim().length < 4) {
      setError("Enter the OTP received");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/otp/email/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ApiResponse;
        throw new Error(data.message || "Failed to verify OTP");
      }

      // After OTP verification, create/login user
      const createResponse = await fetch(`${API_BASE}/api/auth/create-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!createResponse.ok) {
        const data = (await createResponse.json().catch(() => ({}))) as ApiResponse;
        throw new Error(data.message || "Failed to create/login user");
      }

      const userData = (await createResponse.json()) as ApiResponse;

      // Store token in localStorage
      if (userData.token && userData.user) {
        localStorage.setItem("authToken", userData.token);
        localStorage.setItem("user", JSON.stringify(userData.user));

        // Check if user is admin - admin should use admin panel
        const userRole = userData.user.role || userData.user.roles?.[0];
        if (userRole === "admin") {
          setStatus("Admin users should use the admin panel. Redirecting...");
          // Redirect to admin panel (you may need to adjust this URL)
          setTimeout(() => {
            window.location.href = process.env.NEXT_PUBLIC_ADMIN_URL || "/admin";
          }, 2000);
          return;
        }

        setStatus("Login successful! Redirecting to dashboard...");
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 1000);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-6" onSubmit={step === "enter" ? sendOtp : verifyOtp}>
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-600" htmlFor="email">
          Enter your email address
        </label>
        <input
          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2f4bff]"
          id="email"
          type="email"
          placeholder="e.g. user@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={step === "verify"}
          required
        />
      </div>

      {step === "verify" && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-600" htmlFor="otp">
            Enter OTP
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2f4bff]"
            id="otp"
            type="text"
            placeholder="6-digit code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            required
          />
        </div>
      )}

      <button
        className="w-full rounded-2xl bg-[#2f4bff] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(47,75,255,0.35)] transition hover:-translate-y-0.5 disabled:opacity-60"
        type="submit"
        disabled={loading}
      >
        {loading ? "Please wait..." : step === "enter" ? "Send OTP" : "Verify OTP"}
      </button>

      {step === "verify" && (
        <div className="space-y-3 text-center text-sm font-semibold text-slate-600">
          <span className="block text-xs font-medium uppercase tracking-[0.3em] text-slate-400">
            or
          </span>
          <button
            type="button"
            onClick={() => {
              setStep("enter");
              setCode("");
              setError(null);
              setStatus(null);
            }}
            className="inline-block rounded-xl border border-slate-200 px-4 py-2 text-[#2f4bff] hover:bg-slate-50 transition"
            disabled={loading}
          >
            Change Email
          </button>
        </div>
      )}

      {onSwitchToOtp && step === "enter" && (
        <div className="space-y-3 text-center text-sm font-semibold text-slate-600">
          <span className="block text-xs font-medium uppercase tracking-[0.3em] text-slate-400">
            or
          </span>
          <button
            type="button"
            onClick={onSwitchToOtp}
            className="inline-block rounded-xl border border-slate-200 px-4 py-2 text-[#2f4bff] hover:bg-slate-50 transition"
            disabled={loading}
          >
            Login with Mobile OTP
          </button>
        </div>
      )}

      {status && <p className="text-sm font-semibold text-emerald-600">{status}</p>}
      {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
    </form>
  );
}

