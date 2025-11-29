"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getAuthToken, isAuthenticated, setAuth } from "../utils/auth";

// OTP endpoints are in api-system (port 4000)
const OTP_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:4000"
    : "");

// Invite routes are in nodejs-backend (port 5000)
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

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
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpStep, setOtpStep] = useState<"request" | "verify">("request");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formStatus, setFormStatus] = useState<string | null>(null);
  const [bigLogoUrl, setBigLogoUrl] = useState<string | null>(null);

  const token = searchParams.get("token");
  const businessId = searchParams.get("business");
  const emailParam = searchParams.get("email");
  const phoneParam = searchParams.get("phone");
  const roleParam = searchParams.get("role");
  const cashbookIdParam = searchParams.get("cashbook");

  useEffect(() => {
    if (!token) {
      setError("Invalid invite link. Missing token.");
      setLoading(false);
      return;
    }

    verifyInvite();
  }, [token]);

  // Fetch big logo from site settings
  useEffect(() => {
    const fetchBigLogo = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/settings/site/public`);
        if (response.ok) {
          const siteSettings = await response.json();
          console.log("Site settings fetched:", siteSettings);
          if (siteSettings.bigLogoUrl) {
            const logoUrl = siteSettings.bigLogoUrl.startsWith('http') 
              ? siteSettings.bigLogoUrl 
              : `${API_BASE}/uploads/${siteSettings.bigLogoUrl}`;
            console.log("Setting big logo URL:", logoUrl);
            setBigLogoUrl(logoUrl);
          } else {
            console.log("No big logo URL in site settings");
          }
        } else {
          console.warn("Failed to fetch site settings, status:", response.status);
        }
      } catch (err) {
        console.warn("Failed to fetch big logo:", err);
        // Continue without logo - will show fallback
      }
    };
    fetchBigLogo();
  }, []);

  useEffect(() => {
    // Set email from URL param and check if it exists (for email invites)
    if (emailParam && inviteData && !isAuthenticated() && !checkingEmail && emailExists === null) {
      setEmail(emailParam);
      checkEmailExists(emailParam);
    }
    // Set phone from URL param or invite data (for phone invites)
    if (phoneParam && inviteData && !isAuthenticated()) {
      setPhone(phoneParam);
      // For phone invites, skip email check and go directly to phone OTP
      setEmailExists(false);
    } else if (inviteData?.phone && !emailParam && !phoneParam && !isAuthenticated()) {
      // If invite data has phone but no URL param, use invite data
      setPhone(inviteData.phone);
      setEmailExists(false);
    }
  }, [emailParam, phoneParam, inviteData]);

  const verifyInvite = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({ token: token || "" });
      if (businessId) params.append("business", businessId);
      if (emailParam) params.append("email", emailParam);
      if (phoneParam) params.append("phone", phoneParam);
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
      const response = await fetch(`${OTP_API_BASE}/api/auth/check-email?email=${encodeURIComponent(emailToCheck)}`, {
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
      const response = await fetch(`${OTP_API_BASE}/api/otp/email/request`, {
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
      const response = await fetch(`${OTP_API_BASE}/api/otp/email/verify`, {
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
      // Get role from invite data if available
      const inviteRole = inviteData?.role || roleParam || null;
      
      const createResponse = await fetch(`${OTP_API_BASE}/api/auth/create-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: email.trim(),
          role: inviteRole || undefined, // Pass role from invite if available
        }),
      });

      if (!createResponse.ok) {
        const data = await createResponse.json().catch(() => ({}));
        throw new Error(data.message || "Failed to create/login user");
      }

      const userData = await createResponse.json();
      if (userData.token && userData.user) {
        setAuth(userData.token, userData.user);
        setShowAcceptSection(true);
        
        // Auto-accept invite after OTP registration if token exists
        if (token) {
          // Small delay to ensure auth is set
          setTimeout(() => {
            handleAcceptInvite();
          }, 500);
        }
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to verify OTP");
    } finally {
      setFormLoading(false);
    }
  };

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

  const handlePhoneOtpRequest = async () => {
    setFormLoading(true);
    setFormError(null);
    setFormStatus(null);

    try {
      const formattedPhone = formatPhoneNumber(phone);
      
      const response = await fetch(`${OTP_API_BASE}/api/otp/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to send OTP");
      }

      setOtpStep("verify");
      setFormStatus("OTP sent to your phone. Please check your SMS.");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setFormLoading(false);
    }
  };

  const handlePhoneOtpVerify = async () => {
    setFormLoading(true);
    setFormError(null);
    setFormStatus(null);

    if (otpCode.trim().length < 4) {
      setFormError("Enter the OTP received");
      setFormLoading(false);
      return;
    }

    try {
      const formattedPhone = formatPhoneNumber(phone);
      
      const response = await fetch(`${OTP_API_BASE}/api/otp/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone: formattedPhone, code: otpCode }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Invalid OTP");
      }

      // After OTP verification, create/login user by phone
      // Get role from invite data if available
      const inviteRole = inviteData?.role || roleParam || null;
      
      const createResponse = await fetch(`${OTP_API_BASE}/api/auth/create-user-phone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          phone: formattedPhone,
          role: inviteRole || undefined, // Pass role from invite if available
        }),
      });

      if (!createResponse.ok) {
        const data = await createResponse.json().catch(() => ({}));
        throw new Error(data.message || "Failed to create/login user");
      }

      const userData = await createResponse.json();
      if (userData.token && userData.user) {
        setAuth(userData.token, userData.user);
        setShowAcceptSection(true);
        
        // Auto-accept invite after OTP registration if token exists
        if (token) {
          // Small delay to ensure auth is set
          setTimeout(() => {
            handleAcceptInvite();
          }, 500);
        }
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
      // Get role from invite data if available
      const inviteRole = inviteData?.role || roleParam || null;
      
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
          role: inviteRole || undefined, // Pass role from invite if available
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
        
        // Auto-accept invite after registration if token exists
        if (token) {
          // Small delay to ensure auth is set
          setTimeout(() => {
            handleAcceptInvite();
          }, 500);
        }
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

      // Log for debugging
      console.log('Accepting invite with:', {
        token,
        businessId: inviteData?.businessId || businessId,
        role: inviteData?.role || roleParam || "Staff",
        cashbookId: cashbookIdParam,
        cashbookIdFromURL: searchParams.get("cashbook"),
        allParams: Object.fromEntries(searchParams.entries()),
      });

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
          cashbookId: cashbookIdParam || undefined, // Pass cashbook ID if present in URL
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Failed to accept invite");
      }

      const data = await response.json();
      
      // If a new token is returned (with updated role), update the auth
      if (data.token && data.user) {
        setAuth(data.token, data.user);
        console.log('Updated auth with new token and role:', data.user.role);
      }
      
      setAccepted(true);
      
      // Redirect based on role - staff should go to cashbooks, managers to dashboard
      const userRole = data.user?.role || data.user?.roles?.[0];
      const redirectPath = userRole === "staff" ? "/cashbooks" : "/dashboard";
      
      setTimeout(() => {
        // Force a hard refresh to ensure books are fetched
        window.location.href = redirectPath;
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
        {/* Header with Big Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="flex items-center justify-center mb-6 transition-transform hover:scale-105">
            {bigLogoUrl ? (
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-3xl rounded-full"></div>
                <img
                  src={bigLogoUrl}
                  alt="HissabBook"
                  className="relative h-20 md:h-24 w-auto object-contain drop-shadow-lg transition-transform hover:scale-105 cursor-pointer"
                  onError={(e) => {
                    // Fallback to default logo if image fails to load
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement?.parentElement;
                    if (parent) {
                      const fallback = parent.querySelector('.logo-fallback');
                      if (fallback) fallback.classList.remove('hidden');
                    }
                  }}
                />
              </div>
            ) : null}
            <div className={`logo-fallback flex items-center justify-center gap-3 ${bigLogoUrl ? 'hidden' : ''}`}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-2xl rounded-xl"></div>
                <span className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#2357FF] to-[#1a46d9] text-2xl font-bold text-white shadow-xl">
                  H
                </span>
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-[#2357FF] to-[#1a46d9] bg-clip-text text-transparent">HissabBook</span>
            </div>
          </Link>
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
                    {(phoneParam || inviteData?.phone) && (
                      <span className="block mt-2 font-medium">
                        Invited phone: <strong>{phoneParam || inviteData?.phone}</strong>
                      </span>
                    )}
                  </p>
                </div>

                {/* Show phone OTP form for phone invites */}
                {(phoneParam || inviteData?.phone) && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Enter your phone number"
                        required
                        disabled={!!phoneParam || !!inviteData?.phone}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2357FF] focus:border-transparent outline-none transition disabled:bg-gray-100"
                      />
                    </div>
                    {otpStep === "request" ? (
                      <button
                        onClick={handlePhoneOtpRequest}
                        disabled={formLoading || !phone.trim()}
                        className="w-full bg-[#2357FF] text-white py-3 px-4 rounded-lg hover:bg-[#1a46d9] transition font-medium disabled:opacity-50"
                      >
                        {formLoading ? "Sending OTP..." : "Send OTP"}
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                            Enter OTP
                          </label>
                          <input
                            type="text"
                            id="otp"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                            placeholder="Enter 6-digit OTP"
                            maxLength={6}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2357FF] focus:border-transparent outline-none transition text-center text-2xl tracking-widest"
                          />
                        </div>
                        <button
                          onClick={handlePhoneOtpVerify}
                          disabled={formLoading || otpCode.length < 6}
                          className="w-full bg-[#2357FF] text-white py-3 px-4 rounded-lg hover:bg-[#1a46d9] transition font-medium disabled:opacity-50"
                        >
                          {formLoading ? "Verifying..." : "Verify OTP"}
                        </button>
                        <button
                          onClick={() => setOtpStep("request")}
                          className="w-full text-sm text-[#2357FF] hover:underline"
                        >
                          Resend OTP
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Show email form only for email invites (when no phone) */}
                {emailExists === null && !emailParam && !phoneParam && !inviteData?.phone && (
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

                {/* Show email/password tabs and forms only for email invites (not phone invites) */}
                {(emailExists === true || emailExists === false) && !phoneParam && !inviteData?.phone && (
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
                      // Email OTP Form (only for email invites)
                      !phoneParam && !inviteData?.phone && (
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
                      )
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
