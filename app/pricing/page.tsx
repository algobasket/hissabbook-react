"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Footer from "../components/Footer";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || 
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

export default function PricingPage() {
  const [monthlySpend, setMonthlySpend] = useState("");
  const [activeWallets, setActiveWallets] = useState("");
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  const [smallLogoUrl, setSmallLogoUrl] = useState<string | null>(null);

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

  const calculateCost = () => {
    const spend = parseFloat(monthlySpend.replace(/[₹,\s]/g, "")) || 0;
    const wallets = parseInt(activeWallets) || 0;

    if (spend > 0 && wallets > 0) {
      // Calculate 1.5% of monthly spend
      const percentageCost = spend * 0.015;
      // Calculate minimum cost (₹99 per wallet)
      const minimumCost = wallets * 99;
      // Take the higher of the two
      const cost = Math.max(percentageCost, minimumCost);
      setEstimatedCost(cost);
    } else {
      setEstimatedCost(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatInput = (value: string) => {
    // Remove all non-digit characters
    const numbers = value.replace(/\D/g, "");
    // Format with commas
    if (numbers) {
      return "₹ " + parseInt(numbers).toLocaleString("en-IN");
    }
    return "";
  };

  const handleSpendChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatInput(e.target.value);
    setMonthlySpend(formatted);
  };

  const handleWalletsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setActiveWallets(value);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <Link
            href="/"
            className="flex items-center gap-2 transition-transform hover:scale-105"
          >
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
            <div className={`logo-fallback flex items-center gap-2 ${smallLogoUrl ? 'hidden' : ''}`}>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
                H
              </span>
              <span className="text-xl font-semibold text-slate-900">
                HissabBook
              </span>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-500 lg:flex">
            <Link
              href="/"
              className="transition-colors hover:text-primary"
            >
              Home
            </Link>
            <Link
              href="/customers"
              className="transition-colors hover:text-primary"
            >
              Customers
            </Link>
            <Link
              href="/pricing"
              className="text-primary transition-colors hover:text-primary"
            >
              Pricing
            </Link>
            <Link
              href="/security"
              className="transition-colors hover:text-primary"
            >
              Security
            </Link>
            <Link
              href="/book-keeping"
              className="transition-colors hover:text-primary"
            >
              Book Keeping
            </Link>
            <Link
              href="/blogs"
              className="transition-colors hover:text-primary"
            >
              Blogs
            </Link>
            <Link
              href="/about"
              className="transition-colors hover:text-primary"
            >
              About Us
            </Link>
          </nav>
          <div className="hidden items-center gap-4 text-sm font-semibold lg:flex">
            <Link
              href="/login"
              className="text-slate-500 transition-colors hover:text-primary"
            >
              Login/Register
            </Link>
            <button className="rounded-full border border-slate-200 px-5 py-2 text-slate-700 shadow-sm transition hover:border-primary hover:text-primary">
              Download App
            </button>
          </div>
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 lg:hidden">
            <span className="sr-only">Menu</span>
            <svg
              className="h-6 w-6 text-slate-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </header>

      <main>
        {/* Pricing Calculator Section */}
        <section className="bg-white">
          <div className="mx-auto max-w-4xl px-6 py-16 text-center">
            <h1 className="text-4xl font-bold leading-tight text-slate-900">
              Pay as you go
            </h1>
            <p className="mt-3 text-base text-slate-500">
              Just 1.5% of your monthly spend, with a simple minimum of ₹99 per
              wallet/month.
            </p>

            <div className="mt-10 rounded-[32px] border border-slate-100 bg-slate-50 p-8 shadow-card">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3 text-left">
                  <label className="text-sm font-medium text-slate-600">
                    Enter monthly spend on wallets
                  </label>
                  <input
                    type="text"
                    value={monthlySpend}
                    onChange={handleSpendChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="₹ 2,00,000"
                  />
                </div>
                <div className="space-y-3 text-left">
                  <label className="text-sm font-medium text-slate-600">
                    Number of active wallets
                  </label>
                  <input
                    type="text"
                    value={activeWallets}
                    onChange={handleWalletsChange}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="50"
                  />
                </div>
              </div>
              <button
                onClick={calculateCost}
                className="mt-6 w-full rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_50px_rgba(35,87,255,0.25)] transition hover:-translate-y-0.5"
              >
                Estimate cost
              </button>
              
              {estimatedCost !== null && (
                <div className="mt-6 rounded-2xl bg-white p-6 border border-primary/20">
                  <p className="text-sm font-medium text-slate-600 mb-2">
                    Estimated Monthly Cost
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(estimatedCost)}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Based on 1.5% of spend or ₹99 per wallet (whichever is higher)
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm font-semibold text-slate-500">
                <Link
                  href="/"
                  className="transition-colors hover:text-primary"
                >
                  Book a Demo
                </Link>
                <Link
                  href="/contact"
                  className="transition-colors hover:text-primary"
                >
                  Request custom pricing for 10K+ wallets
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How it works Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 py-24">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
            <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
          </div>

          <div className="relative mx-auto max-w-6xl px-6">
            {/* Section Header */}
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-2 text-xs font-bold uppercase tracking-[0.35em] text-primary shadow-lg shadow-primary/10">
                <svg
                  className="h-4 w-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Process
              </span>
              <h2 className="mt-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-4xl font-extrabold text-transparent lg:text-5xl">
                How it works?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                Simple, transparent pricing. Pay only for what you use.
              </p>
            </div>

            {/* Steps Grid */}
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {[
                {
                  number: "01",
                  title: "Load & Spend",
                  description:
                    "Load money and use your wallet to spend. Make payments instantly, scan QR codes, pay vendors and individuals.",
                  icon: (
                    <svg
                      className="h-8 w-8 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  ),
                  gradient: "from-blue-500/20 via-blue-400/10 to-blue-500/20",
                },
                {
                  number: "02",
                  title: "Auto Calculation",
                  description:
                    "We sum up your wallet spends at month-end. On the last day of each billing cycle, we calculate the total amount spent.",
                  icon: (
                    <svg
                      className="h-8 w-8 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  ),
                  gradient: "from-purple-500/20 via-purple-400/10 to-purple-500/20",
                },
                {
                  number: "03",
                  title: "Simple Invoice",
                  description:
                    "You receive one simple invoice. Pay just 1.5% of total wallet spends, with a minimum cap of ₹99 per wallet/month.",
                  icon: (
                    <svg
                      className="h-8 w-8 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  ),
                  gradient: "from-emerald-500/20 via-emerald-400/10 to-emerald-500/20",
                },
              ].map((step, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5 ring-1 ring-slate-200/50 transition-all hover:scale-105 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:ring-primary/20"
                >
                  {/* Decorative background gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                  ></div>

                  {/* Step Number */}
                  <div className="relative mb-6">
                    <span className="text-6xl font-extrabold text-slate-100 group-hover:text-primary/20 transition-colors">
                      {step.number}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-lg shadow-primary/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    {step.icon}
                  </div>

                  {/* Content */}
                  <div className="relative space-y-4">
                    <h3 className="text-xl font-bold text-slate-900 transition-colors group-hover:text-primary">
                      {step.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {step.description}
                    </p>
                  </div>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary via-primary/80 to-primary transition-all duration-700 group-hover:w-full"></div>

                  {/* Corner decoration */}
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-primary/10 to-transparent opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50/30 to-white py-24">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
            <div className="absolute bottom-1/4 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
          </div>

          <div className="relative mx-auto max-w-7xl px-6">
            {/* Section Header */}
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-2 text-xs font-bold uppercase tracking-[0.35em] text-primary shadow-lg shadow-primary/10">
                <svg
                  className="h-4 w-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Benefits
              </span>
              <h2 className="mt-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-4xl font-extrabold text-transparent lg:text-5xl">
                Why choose HissabBook?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                Powerful features designed to streamline your expense management
                and control.
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Issue wallets to staff members",
                  description:
                    "Quickly assign digital wallets to your team members with just a few clicks.",
                  icon: (
                    <svg
                      className="h-6 w-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  ),
                  gradient: "from-blue-500/20 via-blue-400/10 to-blue-500/20",
                  color: "blue",
                },
                {
                  title: "Monitor business expenses",
                  description:
                    "Get real-time visibility into all wallet transactions and spending patterns.",
                  icon: (
                    <svg
                      className="h-6 w-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  ),
                  gradient: "from-purple-500/20 via-purple-400/10 to-purple-500/20",
                  color: "purple",
                },
                {
                  title: "Set limits, minimise leakages",
                  description:
                    "Configure spending limits and approval workflows to prevent unauthorized expenses.",
                  icon: (
                    <svg
                      className="h-6 w-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  ),
                  gradient: "from-emerald-500/20 via-emerald-400/10 to-emerald-500/20",
                  color: "emerald",
                },
                {
                  title: "Safe and secure",
                  description:
                    "Bank-grade security with NPCI certification and encrypted transactions.",
                  icon: (
                    <svg
                      className="h-6 w-6 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  ),
                  gradient: "from-amber-500/20 via-amber-400/10 to-amber-500/20",
                  color: "amber",
                },
              ].map((benefit, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5 ring-1 ring-slate-200/50 transition-all hover:scale-105 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:ring-primary/20"
                >
                  {/* Decorative background gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                  ></div>

                  {/* Icon */}
                  <div className="relative mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-lg shadow-primary/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    {benefit.icon}
                  </div>

                  {/* Content */}
                  <div className="relative space-y-3">
                    <h3 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-primary">
                      {benefit.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-600">
                      {benefit.description}
                    </p>
                  </div>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary via-primary/80 to-primary transition-all duration-700 group-hover:w-full"></div>

                  {/* Corner decoration */}
                  <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br from-primary/10 to-transparent opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 py-24">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
          </div>

          <div className="relative mx-auto max-w-7xl px-6">
            {/* Section Header */}
            <div className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-2 text-xs font-bold uppercase tracking-[0.35em] text-primary shadow-lg shadow-primary/10">
                <svg
                  className="h-4 w-4 text-primary"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                Testimonials
              </span>
              <h2 className="mt-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-4xl font-extrabold text-transparent lg:text-5xl">
                Don't just take our word for it
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
                See how businesses like yours are transforming expense management
                with HissabBook UPI wallets.
              </p>
            </div>

            {/* Testimonials Grid */}
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {[
                {
                  company: "YoloBus",
                  quote:
                    "We love taking money to cash leaks with real-time spending controls. HissabBook chose the best controls for managing reimbursements.",
                  author: "Sanjay Jodun",
                  role: "Founder",
                  gradient: "from-blue-500/20 via-blue-400/10 to-blue-500/20",
                  borderGlow: "0 0 20px rgba(59, 130, 246, 0.3)",
                },
                {
                  company: "Jawai",
                  quote:
                    "Our finance team enjoys the simple billing cycle. One invoice at month-end keeps accounting smooth.",
                  author: "Arun Agarwal",
                  role: "Founder",
                  gradient: "from-purple-500/20 via-purple-400/10 to-purple-500/20",
                  borderGlow: "0 0 20px rgba(168, 85, 247, 0.3)",
                },
                {
                  company: "Swish",
                  quote:
                    "The HissabBook team helped us customise approvals and limits. We only pay for what we use.",
                  author: "Suchi Patel",
                  role: "CFO",
                  gradient: "from-emerald-500/20 via-emerald-400/10 to-emerald-500/20",
                  borderGlow: "0 0 20px rgba(16, 185, 129, 0.3)",
                },
              ].map((testimonial, i) => (
                <article
                  key={i}
                  className="group relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5 ring-1 ring-slate-200/50 transition-all hover:scale-105 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:ring-primary/20"
                  style={{
                    boxShadow: testimonial.borderGlow,
                  }}
                >
                  {/* Decorative background gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${testimonial.gradient} opacity-0 transition-opacity group-hover:opacity-100`}
                  ></div>

                  {/* Quote Icon */}
                  <div className="relative mb-6 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-2xl text-primary shadow-lg shadow-primary/10 transition-transform group-hover:scale-110 group-hover:rotate-6">
                      <svg
                        className="h-6 w-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                      </svg>
                    </div>
                    {/* Company Badge */}
                    <span className="rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary shadow-sm backdrop-blur-sm">
                      {testimonial.company}
                    </span>
                  </div>

                  {/* Testimonial Content */}
                  <div className="relative space-y-6">
                    <p className="text-sm leading-relaxed text-slate-700">
                      "{testimonial.quote}"
                    </p>

                    {/* Author Info */}
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary text-sm font-extrabold text-white shadow-lg shadow-primary/20 ring-2 ring-primary/20 transition-transform group-hover:scale-110">
                        {testimonial.author
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {testimonial.author}
                        </p>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className="h-4 w-4 text-amber-400"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary via-primary/80 to-primary transition-all group-hover:w-full"></div>

                  {/* Corner decoration */}
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-primary/10 to-transparent opacity-0 blur-xl transition-opacity group-hover:opacity-100"></div>
                </article>
              ))}
            </div>

            {/* Trust indicator */}
            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg
                      key={i}
                      className="h-5 w-5 text-amber-400"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-500">4.8/5</span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                Trusted by 1,500+ businesses
              </span>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
              FAQs
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              All your questions — answered
            </h2>
            <div className="mt-10 space-y-4 text-left">
              {[
                {
                  question: "How is the pricing structured?",
                  answer:
                    "Pay 1.5% of your total wallet spends with a minimum of ₹99 per wallet per month.",
                },
                {
                  question: "How do I get started?",
                  answer:
                    "Book a demo and our onboarding team will help you invite staff, configure policies, and load wallets.",
                },
                {
                  question: "Can I customise the plan for my enterprise?",
                  answer:
                    "Yes, connect with our sales team for tailored pricing if you process high volumes each month.",
                },
                {
                  question: "Is my data secure with HissabBook?",
                  answer:
                    "We maintain bank-grade encryption, multi-factor auth, and NPCI-certified infrastructure for compliance.",
                },
              ].map((faq, i) => (
                <details
                  key={i}
                  className="group rounded-2xl border border-slate-100 bg-slate-50 p-6 shadow-card transition-all hover:shadow-lg"
                >
                  <summary className="flex cursor-pointer items-center justify-between text-base font-semibold text-slate-900">
                    {faq.question}
                    <span className="ml-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary transition-all group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 text-sm text-slate-500">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

