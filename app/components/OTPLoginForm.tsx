"use client";

import { useState, useEffect } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

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

interface OTPLoginFormProps {
  onSwitchToEmail?: () => void;
  onLoginSuccess?: (token: string, user: any) => void;
}

export default function OTPLoginForm({ onSwitchToEmail, onLoginSuccess }: OTPLoginFormProps) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);
  const [step, setStep] = useState<Step>("enter");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const formatPhoneNumber = (phone: string): string => {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, "");
    
    // Handle Indian phone numbers (10 digits)
    if (cleaned.length === 10) {
      // Add country code 91
      return "91" + cleaned;
    }
    // If already has country code, return as is
    if (cleaned.startsWith("91") && cleaned.length === 12) {
      return cleaned;
    }
    // If starts with 0, replace with 91
    if (cleaned.startsWith("0") && cleaned.length === 11) {
      return "91" + cleaned.substring(1);
    }
    
    return cleaned;
  };

  const sendOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setError(null);

    if (phone.trim().length < 8) {
      setError("Enter a valid mobile number");
      return;
    }

    setLoading(true);
    try {
      // Format phone number before sending
      const formattedPhone = formatPhoneNumber(phone);
      
      const response = await fetch(`${API_BASE}/api/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ApiResponse;
        throw new Error(data.message || "Failed to send OTP");
      }

      setStatus("OTP sent successfully");
      setStep("verify");
      // Start cooldown timer (60 seconds)
      setResendCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !phone.trim()) return;
    
    setError(null);
    setStatus(null);
    setCode("");
    setLoading(true);

    try {
      // Format phone number before sending
      const formattedPhone = formatPhoneNumber(phone);
      
      const response = await fetch(`${API_BASE}/api/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ApiResponse;
        throw new Error(data.message || "Failed to send OTP");
      }

      setStatus("OTP resent successfully");
      // Start cooldown timer (60 seconds)
      setResendCooldown(60);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

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
      // Format phone number before verifying
      const formattedPhone = formatPhoneNumber(phone);
      
      const response = await fetch(`${API_BASE}/api/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone, code }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ApiResponse;
        throw new Error(data.message || "Failed to verify OTP");
      }

      // After OTP verification, create/login user by phone
      const createResponse = await fetch(`${API_BASE}/api/auth/create-user-phone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone }),
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

        // If onLoginSuccess callback is provided, use it instead of redirecting
        if (onLoginSuccess) {
          onLoginSuccess(userData.token, userData.user);
          return;
        }

        // Check if user is admin - admin should use admin panel
        const userRole = userData.user.role || userData.user.roles?.[0];
        if (userRole === "admin") {
          setStatus("Admin users should use the admin panel. Redirecting...");
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
        <label className="block text-sm font-medium text-slate-600" htmlFor="phone">
          Enter your mobile number
        </label>
        <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
          <span className="flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm shadow-slate-200">
            +91
          </span>
          <input
            className="w-full rounded-2xl bg-transparent px-3 text-sm font-medium text-slate-900 focus:outline-none"
            id="phone"
            type="tel"
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={step === "verify"}
          />
        </div>
      </div>

      {step === "verify" && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-600" htmlFor="otp">
            Enter OTP
          </label>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-900 focus:outline-none"
            id="otp"
            type="text"
            placeholder="6-digit code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
          />
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-slate-500">Didn't receive OTP?</span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || loading}
              className="text-xs font-semibold text-[#2f4bff] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : "Resend OTP"}
            </button>
          </div>
        </div>
      )}

      <button
        className="w-full rounded-2xl bg-[#2f4bff] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(47,75,255,0.35)] transition hover:-translate-y-0.5 disabled:opacity-60"
        type="submit"
        disabled={loading}
      >
        {loading ? "Please wait..." : step === "enter" ? "Send OTP" : "Verify OTP"}
      </button>

      {onSwitchToEmail && (
        <div className="space-y-3 text-center text-sm font-semibold text-slate-600">
          <span className="block text-xs font-medium uppercase tracking-[0.3em] text-slate-400">
            or
          </span>
          <button
            type="button"
            onClick={onSwitchToEmail}
            className="inline-block rounded-xl border border-slate-200 px-4 py-2 text-[#2f4bff] hover:bg-slate-50 transition"
            disabled={loading}
          >
            Other Ways To Login
          </button>
        </div>
      )}

      {status && <p className="text-sm font-semibold text-emerald-600">{status}</p>}
      {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
    </form>
  );
}

