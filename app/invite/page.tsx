"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getAuthToken, isAuthenticated, setAuth } from "../utils/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:5000";

interface InviteData {
  token: string;
  businessId: string;
  businessName: string;
  email: string | null;
  phone: string | null;
  role: string;
  expiresAt: string;
}

function InvitePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showAcceptSection, setShowAcceptSection] = useState(false);
  const [authMethod, setAuthMethod] = useState<"password" | "otp">("password");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<string | null>(null);

  const token = searchParams.get("token");
  const businessId = searchParams.get("business");
  const emailParam = searchParams.get("email");
  const roleParam = searchParams.get("role");

  useEffect(() => {
    if (!token) {
      setError("Invalid invite link. Missing token.");
      setLoading(false);
      return;
    }

    verifyInvite();
  }, [token]);

  useEffect(() => {
    // Set email from URL param and check if it exists
    if (emailParam && inviteData && !isAuthenticated() && !checkingEmail && emailExists === null) {
      setEmail(emailParam);
      checkEmailExists(emailParam);
    }
  }, [emailParam, inviteData]);

  const verifyInvite = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ token: token || "" });
      if (businessId) params.append("business", businessId);
      if (emailParam) params.append("email", emailParam);
      if (roleParam) params.append("role", roleParam);

      const response = await fetch(`${API_BASE}/api/invites/verify?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Invalid or expired invite");
      }

      const data = await response.json();
      setInviteData(data.invite);
    } catch (err) {
      console.error("Error verifying invite:", err);
      setError(err instanceof Error ? err.message : "Failed to verify invite");
    } finally {
      setLoading(false);
    }
  };

  const checkEmailExists = async (emailToCheck: string) => {
    try {
      setCheckingEmail(true);
      const response = await fetch(`${API_BASE}/api/auth/check-email?email=${encodeURIComponent(emailToCheck)}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmailExists(data.exists || false);
      } else {
        setEmailExists(false);
      }
    } catch (err) {
      console.error("Error checking email:", err);
      setEmailExists(false);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setFormError("Please enter a valid email address");
      return;
    }

    await checkEmailExists(email.trim());
  };

  const sendEmailOtp = async () => {
    setFormLoading(true);
    setFormError(null);
    setFormStatus(null);

    try {
      const response = await fetch(`${API_BASE}/api/otp/email/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to send OTP");
      }

      setOtpStep("verify");
      setFormStatus("OTP sent to your email. Please check your inbox.");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setFormLoading(false);
    }
  };

  const verifyEmailOtp = async () => {
    setFormLoading(true);
    setFormError(null);
    setFormStatus(null);

    try {
      const response = await fetch(`${API_BASE}/api/otp/email/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), code: otpCode }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Invalid OTP");
      }

      // After OTP verification, create/login user
      const createResponse = await fetch(`${API_BASE}/api/auth/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!createResponse.ok) {
        const data = await createResponse.json().catch(() => ({}));
        throw new Error(data.message || "Failed to create/login user");
      }

      const userData = await createResponse.json();
      if (userData.token && userData.user) {
        setAuth(userData.token, userData.user);
        setShowAcceptSection(true);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to verify OTP");
    } finally {
      setFormLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Invalid email or password");
      }

      const data = await response.json();
      if (data.token && data.user) {
        setAuth(data.token, data.user);
        setShowAcceptSection(true);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    if (!password || password.length < 8) {
      setFormError("Password must be at least 8 characters");
      setFormLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      setFormLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Registration failed");
      }

      const data = await response.json();
      if (data.token && data.user) {
        setAuth(data.token, data.user);
        setShowAcceptSection(true);
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setFormLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!token || !isAuthenticated()) {
      setError("Please log in to accept the invite");
      return;
    }

    try {
      setAccepting(true);
      setError(null);

      const authToken = getAuthToken();
      if (!authToken) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE}/api/invites/accept`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          token,
          businessId: inviteData?.businessId || businessId,
          role: inviteData?.role || roleParam || "Staff",
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to accept invite");
      }

      const data = await response.json();
      setAccepted(true);
      
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Error accepting invite:", err);
      setError(err instanceof Error ? err.message : "Failed to accept invite");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2357FF] mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Verifying invite...</p>
        </div>
      </div>
    );
  }

  if (error && !inviteData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">✕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-[#2357FF] text-white py-3 px-4 rounded-lg hover:bg-[#1a46d9] transition font-medium"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Invite Accepted!</h1>
          <p className="text-gray-600 mb-6">
            You have successfully joined <strong>{inviteData?.businessName}</strong> as {inviteData?.role}.
          </p>
          <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const isLoggedIn = isAuthenticated();
  const inviteEmail = inviteData?.email || emailParam;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header with HissabBook branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-xl font-bold text-[#2357FF] shadow-lg">
              H
            </span>
            <span className="text-2xl font-bold text-[#2357FF]">HissabBook</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Invitation Header */}
          <div className="bg-gradient-to-r from-[#2357FF] to-[#1a46d9] px-8 py-6 text-white">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2">Business Invitation</h1>
              <p className="text-blue-100">
                You've been invited to join <strong className="text-white">{inviteData?.businessName}</strong>
              </p>
              <p className="text-sm text-blue-200 mt-1">as {inviteData?.role}</p>
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {formError && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                <p className="text-sm text-red-700">{formError}</p>
              </div>
            )}

            {formStatus && (
              <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                <p className="text-sm text-green-700">{formStatus}</p>
              </div>
            )}

            {isLoggedIn || showAcceptSection ? (
              <div className="space-y-6">
                <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">
                    ✓ You are logged in. Click the button below to accept the invitation.
                  </p>
                </div>
                <button
                  onClick={handleAcceptInvite}
                  disabled={accepting}
                  className="w-full bg-gradient-to-r from-[#2357FF] to-[#1a46d9] text-white py-4 px-6 rounded-lg hover:from-[#1a46d9] hover:to-[#2357FF] transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg transform hover:scale-[1.02]"
                >
                  {accepting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Accepting...
                    </span>
                  ) : (
                    `Accept Invitation as ${inviteData?.role}`
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg">
                  <p className="text-sm text-amber-800">
                    Please log in or create an account to accept this invitation.
                    {inviteEmail && (
                      <span className="block mt-2 font-medium">
                        Invited email: <strong>{inviteEmail}</strong>
                      </span>
                    )}
                  </p>
                </div>

                {emailExists === null && !emailParam && (
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email address"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2357FF] focus:border-transparent outline-none transition"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={checkingEmail}
                      className="w-full bg-[#2357FF] text-white py-3 px-4 rounded-lg hover:bg-[#1a46d9] transition font-medium disabled:opacity-50"
                    >
                      {checkingEmail ? "Checking..." : "Continue"}
                    </button>
                  </form>
                )}

                {(emailExists === true || emailExists === false) && (
                  <>
                    {/* Auth Method Tabs */}
                    <div className="flex border-b border-gray-200 mb-4">
                      <button
                        onClick={() => {
                          setAuthMethod("password");
                          setOtpStep("request");
                          setOtpCode("");
                          setFormError(null);
                          setFormStatus(null);
                        }}
                        className={`flex-1 py-2 px-4 text-center font-medium ${
                          authMethod === "password"
                            ? "text-[#2357FF] border-b-2 border-[#2357FF]"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Password
                      </button>
                      <button
                        onClick={() => {
                          setAuthMethod("otp");
                          setOtpStep("request");
                          setOtpCode("");
                          setFormError(null);
                          setFormStatus(null);
                        }}
                        className={`flex-1 py-2 px-4 text-center font-medium ${
                          authMethod === "otp"
                            ? "text-[#2357FF] border-b-2 border-[#2357FF]"
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        OTP
                      </button>
                    </div>

                    {authMethod === "password" ? (
                      emailExists ? (
                        // Login Form
                        <form onSubmit={handleLogin} className="space-y-4">
                          <div>
                            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-2">
                              Email Address
                            </label>
                            <input
                              type="email"
                              id="login-email"
                              value={email}
                              disabled
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                            />
                          </div>
                          <div>
                            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700 mb-2">
                              Password
                            </label>
                            <input
                              type="password"
                              id="login-password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Enter your password"
                              required
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2357FF] focus:border-transparent outline-none transition"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={formLoading}
                            className="w-full bg-[#2357FF] text-white py-3 px-4 rounded-lg hover:bg-[#1a46d9] transition font-medium disabled:opacity-50"
                          >
                            {formLoading ? "Logging in..." : "Login"}
                          </button>
                        </form>
                      ) : (
                        // Registration Form
                        <form onSubmit={handleRegister} className="space-y-4">
                          <div>
                            <label htmlFor="register-email" className="block text-sm font-medium text-gray-700 mb-2">
                              Email Address
                            </label>
                            <input
                              type="email"
                              id="register-email"
                              value={email}
                              disabled
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                                First Name <span className="text-gray-400 text-xs">(Optional)</span>
                              </label>
                              <input
                                type="text"
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="First name"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2357FF] focus:border-transparent outline-none transition"
                              />
                            </div>
                            <div>
                              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                                Last Name <span className="text-gray-400 text-xs">(Optional)</span>
                              </label>
                              <input
                                type="text"
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Last name"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2357FF] focus:border-transparent outline-none transition"
                              />
                            </div>
                          </div>
                          <div>
                            <label htmlFor="register-password" className="block text-sm font-medium text-gray-700 mb-2">
                              Password
                            </label>
                            <input
                              type="password"
                              id="register-password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="Create a password (min. 8 characters)"
                              required
                              minLength={8}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2357FF] focus:border-transparent outline-none transition"
                            />
                          </div>
                          <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                              Confirm Password
                            </label>
                            <input
                              type="password"
                              id="confirmPassword"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="Confirm your password"
                              required
                              minLength={8}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2357FF] focus:border-transparent outline-none transition"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={formLoading}
                            className="w-full bg-[#2357FF] text-white py-3 px-4 rounded-lg hover:bg-[#1a46d9] transition font-medium disabled:opacity-50"
                          >
                            {formLoading ? "Creating account..." : "Create Account"}
                          </button>
                        </form>
                      )
                    ) : (
                      // OTP Form
                      <div className="space-y-4">
                        {otpStep === "request" ? (
                          <>
                            <div>
                              <label htmlFor="otp-email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                              </label>
                              <input
                                type="email"
                                id="otp-email"
                                value={email}
                                disabled
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                              />
                            </div>
                            <button
                              onClick={sendEmailOtp}
                              disabled={formLoading}
                              className="w-full bg-[#2357FF] text-white py-3 px-4 rounded-lg hover:bg-[#1a46d9] transition font-medium disabled:opacity-50"
                            >
                              {formLoading ? "Sending OTP..." : "Send OTP"}
                            </button>
                          </>
                        ) : (
                          <>
                            <div>
                              <label htmlFor="otp-code" className="block text-sm font-medium text-gray-700 mb-2">
                                Enter OTP
                              </label>
                              <input
                                type="text"
                                id="otp-code"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="Enter 6-digit OTP"
                                maxLength={6}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2357FF] focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setOtpStep("request");
                                  setOtpCode("");
                                  setFormError(null);
                                  setFormStatus(null);
                                }}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-300 transition font-medium"
                              >
                                Back
                              </button>
                              <button
                                onClick={verifyEmailOtp}
                                disabled={formLoading || otpCode.length !== 6}
                                className="flex-1 bg-[#2357FF] text-white py-3 px-4 rounded-lg hover:bg-[#1a46d9] transition font-medium disabled:opacity-50"
                              >
                                {formLoading ? "Verifying..." : "Verify OTP"}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}

                {checkingEmail && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2357FF] mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Checking email...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2357FF] mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      }
    >
      <InvitePageContent />
    </Suspense>
  );
}
