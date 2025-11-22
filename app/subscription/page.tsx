"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";
import ProtectedRoute from "../components/ProtectedRoute";
import { getAuthToken } from "../utils/auth";

const API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  currencyCode: string;
  billingPeriod: string;
  businessLimit: number | string;
  membersPerBusinessLimit: number | string;
  features: any;
  isActive: boolean;
}

interface Subscription {
  id: string;
  businessId: string;
  planId: string;
  planName: string;
  planDescription: string;
  status: string;
  startDate: string;
  endDate: string | null;
  billingPeriod: string;
  autoRenew: boolean;
  price: number;
  currencyCode: string;
  businessLimit: number | string;
  membersPerBusinessLimit: number | string;
  features: any;
}

export default function SubscriptionPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  useEffect(() => {
    const businessId = localStorage.getItem("selectedBusinessId");
    setSelectedBusinessId(businessId);
    fetchPlans();
    if (businessId) {
      fetchCurrentSubscription(businessId);
    }
  }, []);

  // Listen for business change events
  useEffect(() => {
    const handleBusinessChange = (event: CustomEvent) => {
      const businessId = event.detail.businessId;
      setSelectedBusinessId(businessId);
      if (businessId) {
        fetchCurrentSubscription(businessId);
      }
    };

    window.addEventListener('businessChanged', handleBusinessChange as EventListener);
    return () => {
      window.removeEventListener('businessChanged', handleBusinessChange as EventListener);
    };
  }, []);

  const fetchPlans = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const response = await fetch(`${API_BASE}/api/subscriptions/plans`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch subscription plans");
      }

      const data = await response.json();
      setPlans(data.plans || []);
      if (data.plans && data.plans.length === 0) {
        setError("No subscription plans available. Please run the database migration.");
      } else {
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching plans:", err);
      setError(err instanceof Error ? err.message : "Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async (businessId: string) => {
    try {
      const token = getAuthToken();
      if (!token) {
        console.log("No auth token");
        return;
      }

      console.log("Fetching subscription for business:", businessId);
      const response = await fetch(`${API_BASE}/api/subscriptions/current?business_id=${businessId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Subscription response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Subscription data received:", data);
        if (data.subscription) {
          setCurrentSubscription(data.subscription);
        } else {
          console.log("No subscription in response");
          setCurrentSubscription(null);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log("Subscription fetch error:", errorData);
        setCurrentSubscription(null);
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setCurrentSubscription(null);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!selectedBusinessId) {
      setError("Please select a business first");
      return;
    }

    if (!confirm("Are you sure you want to subscribe to this plan?")) {
      return;
    }

    try {
      setSubscribing(true);
      setError(null);
      setSuccess(null);

      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE}/api/subscriptions/subscribe`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_id: selectedBusinessId,
          plan_id: planId,
          billing_period: "month",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to subscribe");
      }

      setSuccess("Successfully subscribed to plan!");
      await fetchCurrentSubscription(selectedBusinessId);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error subscribing:", err);
      setError(err instanceof Error ? err.message : "Failed to subscribe");
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedBusinessId) {
      setError("Please select a business first");
      return;
    }

    if (!confirm("Are you sure you want to cancel your subscription?")) {
      return;
    }

    try {
      setCancelling(true);
      setError(null);
      setSuccess(null);

      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_BASE}/api/subscriptions/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business_id: selectedBusinessId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to cancel subscription");
      }

      setSuccess("Subscription cancelled successfully");
      await fetchCurrentSubscription(selectedBusinessId);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error cancelling subscription:", err);
      setError(err instanceof Error ? err.message : "Failed to cancel subscription");
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  const formatCurrency = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <AppShell activePath="/subscription">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-[#2f4bff]"></div>
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell activePath="/subscription">
        <div className="space-y-6">
          {/* Success/Error Messages */}
          {success && (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-600">{success}</div>
          )}
          {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">{error}</div>}

          {/* Current Subscription Card - Always show section */}
          <div className="space-y-6">
            {currentSubscription ? (
              <>
                {/* Top Card: Subscription Header */}
                <div className="rounded-3xl border border-white/70 bg-white p-8 shadow-md">
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-[#2f4bff] to-[#4f6dff] text-2xl font-bold text-white">
                      C
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-600">CashBooks Subscription</p>
                      <h2 className="text-2xl font-semibold text-[#1f2937]">{currentSubscription.planName}</h2>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-600">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Active
                  </span>
                </div>

                <div className="space-y-1 text-sm text-slate-600">
                  <p>Since {formatDate(currentSubscription.startDate)}</p>
                  {currentSubscription.endDate && <p>Valid until {formatDate(currentSubscription.endDate)}</p>}
                </div>
              </div>

              {/* Bottom Card: Subscription Details */}
              <div className="rounded-3xl border border-white/70 bg-white p-8 shadow-md">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Subscription Details */}
                  <div>
                    <h3 className="mb-4 text-lg font-semibold text-[#1f2937]">Subscription Details</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Billing Period</p>
                        <p className="mt-1 text-base font-medium text-[#1f2937] capitalize">{currentSubscription.billingPeriod}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Start Date</p>
                        <p className="mt-1 text-base font-medium text-[#1f2937]">{formatDate(currentSubscription.startDate)}</p>
                      </div>
                      {currentSubscription.endDate && (
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">End Date</p>
                          <p className="mt-1 text-base font-medium text-[#1f2937]">{formatDate(currentSubscription.endDate)}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Plan Features & Limits */}
                  <div>
                    <h3 className="mb-4 text-lg font-semibold text-[#1f2937]">Plan Features & Limits</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Business Limit</p>
                        <p className="mt-1 text-base font-medium text-[#1f2937]">
                          {currentSubscription.businessLimit === "Unlimited" || currentSubscription.businessLimit === -1
                            ? "Unlimited"
                            : currentSubscription.businessLimit}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Members per Business</p>
                        <p className="mt-1 text-base font-medium text-[#1f2937]">
                          {currentSubscription.membersPerBusinessLimit === "Unlimited" ||
                          currentSubscription.membersPerBusinessLimit === -1
                            ? "Unlimited"
                            : currentSubscription.membersPerBusinessLimit}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {currentSubscription.status === "active" && (
                  <div className="mt-6 border-t border-slate-200 pt-6">
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                    >
                      {cancelling ? "Cancelling..." : "Cancel Subscription"}
                    </button>
                  </div>
                )}
              </div>
              </>
            ) : (
              /* No Subscription Message */
              <div className="rounded-3xl border border-white/70 bg-white p-8 shadow-md">
                <div className="text-center py-8">
                  <div className="mb-4 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-2xl font-bold text-slate-400">
                      C
                    </div>
                  </div>
                  <h3 className="mb-2 text-xl font-semibold text-[#1f2937]">No Active Subscription</h3>
                  <p className="text-slate-600 mb-4">You don't have an active subscription for this business.</p>
                  <p className="text-sm text-slate-500">Subscribe to a plan below to get started.</p>
                </div>
              </div>
            )}
          </div>

          {/* Subscription Plans */}
          <div>
            <h2 className="mb-6 text-2xl font-semibold text-[#1f2937]">Available Plans</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan) => {
                const isCurrentPlan = currentSubscription?.planId === plan.id;
                const isStarter = plan.name === "Starter Plan";
                const isPremium = plan.name === "Premium Plan";
                const isEnterprise = plan.name === "Enterprise Plan";

                return (
                  <div
                    key={plan.id}
                    className={`rounded-3xl border p-6 shadow-md transition hover:shadow-lg ${
                      isCurrentPlan
                        ? "border-[#2f4bff] bg-blue-50"
                        : isPremium
                        ? "border-amber-300 bg-gradient-to-br from-amber-50 to-white"
                        : "border-white/70 bg-white"
                    }`}
                  >
                    {isPremium && (
                      <div className="mb-4 text-center">
                        <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          POPULAR
                        </span>
                      </div>
                    )}

                    <h3 className="mb-2 text-xl font-semibold text-[#1f2937]">{plan.name}</h3>
                    <p className="mb-4 text-sm text-slate-600">{plan.description}</p>

                    <div className="mb-6">
                      <span className="text-3xl font-bold text-[#1f2937]">
                        {plan.price === 0 ? "Free" : formatCurrency(plan.price, plan.currencyCode)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-sm text-slate-500">/{plan.billingPeriod}</span>
                      )}
                    </div>

                    <div className="mb-6 space-y-3">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>
                          {plan.businessLimit === "Unlimited" || plan.businessLimit === -1
                            ? "Unlimited"
                            : plan.businessLimit}{" "}
                          Business{plan.businessLimit !== 1 && plan.businessLimit !== "Unlimited" && plan.businessLimit !== -1 ? "es" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span>
                          {plan.membersPerBusinessLimit === "Unlimited" || plan.membersPerBusinessLimit === -1
                            ? "Unlimited"
                            : plan.membersPerBusinessLimit}{" "}
                          Members per Business
                        </span>
                      </div>
                      {plan.features?.cashbooks && (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <svg className="h-5 w-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span>
                            {plan.features.cashbooks === -1 ? "Unlimited" : plan.features.cashbooks} Cashbooks
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isCurrentPlan || subscribing || !selectedBusinessId}
                      className={`w-full rounded-lg px-4 py-2 text-sm font-semibold transition ${
                        isCurrentPlan
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : isPremium
                          ? "bg-amber-500 text-white hover:bg-amber-600"
                          : "bg-[#2f4bff] text-white hover:bg-[#2f4bff]/90"
                      } disabled:opacity-50`}
                    >
                      {isCurrentPlan
                        ? "Current Plan"
                        : subscribing
                        ? "Subscribing..."
                        : !selectedBusinessId
                        ? "Select Business First"
                        : plan.price === 0
                        ? "Get Started"
                        : "Subscribe"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
