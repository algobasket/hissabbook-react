"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import Footer from "../components/Footer";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || 
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

export default function BookKeepingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header
        className={`sticky top-0 z-50 border-b border-slate-100 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow-lg shadow-slate-900/5"
            : "bg-white/90 backdrop-blur"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:py-6">
          <Link
            href="/"
            className="group flex items-center gap-2 transition-transform hover:scale-105"
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
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 text-lg font-black text-primary shadow-lg shadow-primary/20 transition-all group-hover:shadow-xl group-hover:shadow-primary/30">
                H
              </span>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                HissabBook
              </span>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 lg:flex">
            <Link
              href="/"
              className="relative transition-colors hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
            >
              Home
            </Link>
            <Link
              href="/customers"
              className="relative transition-colors hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
            >
              Customers
            </Link>
            <Link
              href="/pricing"
              className="relative transition-colors hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
            >
              Pricing
            </Link>
            <Link
              href="/security"
              className="relative transition-colors hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
            >
              Security
            </Link>
            <Link
              href="/book-keeping"
              className="relative font-semibold text-primary transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary"
            >
              Book Keeping
            </Link>
            <Link
              href="/blogs"
              className="relative transition-colors hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
            >
              Blogs
            </Link>
            <Link
              href="/about"
              className="relative transition-colors hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
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
            <button className="rounded-full border border-slate-200 bg-white px-5 py-2 text-slate-700 shadow-sm transition hover:border-primary hover:bg-primary hover:text-white hover:shadow-lg">
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
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-white py-20 lg:py-28">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
          </div>

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
            <div className="space-y-8 animate-fadeInUp">
              <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.35em] text-primary shadow-lg shadow-primary/10 backdrop-blur-sm">
                <svg
                  className="h-4 w-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m4.5 0a12.05 12.05 0 003.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
                Cash Control App
              </span>
              <div className="space-y-4">
                <h1 className="text-5xl font-black leading-[1.1] tracking-tight lg:text-6xl xl:text-7xl">
                  <span className="block">
                    <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                      Cash Control App
                    </span>
                  </span>
                  <span className="block">
                    <span className="bg-gradient-to-r from-primary via-primary/90 to-primary bg-clip-text text-transparent">
                      For Business Growth
                    </span>
                  </span>
                </h1>
                <p className="text-lg leading-relaxed text-slate-600 max-w-xl lg:text-xl">
                  Streamline your financial operations with powerful tools designed for modern businesses.
                </p>
              </div>
              <ul className="space-y-3.5 pt-2">
                {[
                  "Track income and expenses",
                  "Add your staff and business partners",
                  "Send passbooks & download reports",
                  "Set up multiple businesses in one place",
                ].map((item, i) => (
                  <li
                    key={i}
                    className="group flex items-start gap-4 transition-all duration-300 hover:translate-x-1"
                  >
                    <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 via-primary/15 to-primary/10 text-primary shadow-sm shadow-primary/10 ring-1 ring-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md group-hover:shadow-primary/20 group-hover:ring-primary/20">
                      <svg
                        className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </span>
                    <span className="text-base font-medium leading-relaxed text-slate-700 transition-colors duration-300 group-hover:text-slate-900 lg:text-lg">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center gap-4 pt-6">
                <button className="group relative overflow-hidden rounded-full bg-gradient-to-r from-primary via-primary/95 to-primary px-8 py-4 text-base font-bold text-white shadow-[0_20px_50px_rgba(35,87,255,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_25px_60px_rgba(35,87,255,0.5)] hover:scale-105">
                  <span className="relative z-10 flex items-center gap-2.5">
                    Download the App
                    <svg
                      className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary to-primary/90 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                </button>
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-12 items-center rounded-full bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 text-xs font-bold text-white shadow-lg shadow-slate-900/20 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-slate-900/30">
                    Google Play
                  </span>
                  <span className="inline-flex h-12 items-center rounded-full border-2 border-slate-300 bg-white px-6 text-xs font-bold text-slate-700 shadow-sm transition-all duration-300 hover:border-primary hover:bg-primary/5 hover:text-primary hover:shadow-md">
                    App Store
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-center animate-fadeIn">
              <div className="relative group">
                {/* Animated glow effect */}
                <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-primary/30 via-primary/15 to-primary/30 blur-3xl opacity-60 group-hover:opacity-90 transition-opacity duration-500"></div>
                {/* Outer ring */}
                <div className="absolute -inset-1 rounded-[42px] bg-gradient-to-br from-primary/20 via-primary/10 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></div>
                {/* Main container */}
                <div className="relative w-full max-w-sm overflow-hidden rounded-[40px] bg-gradient-to-br from-white via-slate-50/50 to-white shadow-2xl shadow-primary/20 ring-2 ring-primary/10 transition-all duration-500 group-hover:scale-105 group-hover:ring-primary/30 group-hover:shadow-3xl group-hover:shadow-primary/30">
                  {/* App Image */}
                  <Image
                    src="/images/8.png"
                    alt="Cash Control App Preview"
                    width={400}
                    height={600}
                    className="h-auto w-full object-contain"
                    sizes="(max-width: 768px) 100vw, 384px"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 py-20">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
          <div className="relative mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-16 px-6">
            {[
              {
                value: "4.5/5",
                label: "Playstore Rating",
                icon: (
                  <svg
                    className="h-8 w-8 text-amber-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ),
                gradient: "from-amber-400 to-amber-500",
              },
              {
                value: "350K+",
                label: "Downloads",
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
                      strokeWidth="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                ),
                gradient: "from-primary to-primary/80",
              },
              {
                value: "6+",
                label: "Languages",
                icon: (
                  <svg
                    className="h-8 w-8 text-emerald-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
                    />
                  </svg>
                ),
                gradient: "from-emerald-500 to-emerald-600",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="group text-center transition-transform hover:scale-110"
              >
                <div className="mb-4 flex justify-center">
                  <div className={`rounded-2xl bg-gradient-to-br ${stat.gradient} p-4 shadow-lg shadow-primary/10`}>
                    {stat.icon}
                  </div>
                </div>
                <span className="block bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-4xl font-extrabold text-transparent">
                  {stat.value}
                </span>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.4em] text-slate-500">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Why HissabBook Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-white py-24">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
            <div className="absolute bottom-1/4 left-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
          </div>

          <div className="relative mx-auto max-w-6xl px-6">
            {/* Section Header */}
            <div className="text-center">
              <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.35em] text-primary shadow-lg shadow-primary/10 backdrop-blur-sm">
                Features
              </span>
              <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-900 lg:text-5xl xl:text-6xl">
                <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                  Why HissabBook?
                </span>
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600 lg:text-xl">
                Run multiple businesses and manage staff, passbooks, and reports
                effortlessly.
              </p>
            </div>

            {/* Features Grid */}
            <div className="mt-16 grid gap-8 lg:grid-cols-2">
              {[
                {
                  title: "Track Income & Expenses",
                  description:
                    "Stay bookkeeping-ready with complete visibility on cash flow.",
                  gradient: "from-primary/20 via-primary/10 to-primary/25",
                  icon: (
                    <svg
                      className="h-8 w-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  ),
                  color: "primary",
                },
                {
                  title: "Add Your Staff to Business",
                  description:
                    "Assign roles, manage access, and collaborate in real time.",
                  gradient: "from-emerald-500/20 via-emerald-400/10 to-primary/20",
                  icon: (
                    <svg
                      className="h-8 w-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  ),
                  color: "emerald",
                },
                {
                  title: "Set Up Multiple Businesses",
                  description:
                    "Manage different entities, books, and categories from a single app.",
                  gradient: "from-sky-500/20 via-sky-400/10 to-primary/20",
                  icon: (
                    <svg
                      className="h-8 w-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  ),
                  color: "sky",
                },
                {
                  title: "Download PDF & Excel Reports",
                  description:
                    "Share passbooks, reconcile transactions, and keep records audit-ready.",
                  gradient: "from-amber-500/20 via-amber-400/10 to-primary/20",
                  icon: (
                    <svg
                      className="h-8 w-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  ),
                  color: "amber",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5 transition-all hover:scale-105 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10"
                >
                  {/* Decorative background gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity group-hover:opacity-100`}
                  ></div>

                  <div className="relative space-y-6">
                    {/* Icon */}
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-lg shadow-primary/10 transition-transform group-hover:scale-110 group-hover:rotate-6">
                      {feature.icon}
                    </div>

                    {/* Content */}
                    <div>
                      <h3 className="text-xl font-bold leading-tight text-slate-900 lg:text-2xl">
                        {feature.title}
                      </h3>
                      <p className="mt-3 text-base leading-relaxed text-slate-600 lg:text-lg">
                        {feature.description}
                      </p>
                    </div>

                    {/* Feature image placeholder */}
                    <div
                      className={`relative h-48 w-full overflow-hidden rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-inner transition-transform group-hover:scale-105`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        {feature.icon}
                      </div>
                    </div>
                  </div>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary via-primary/80 to-primary transition-all group-hover:w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-100/80 via-white to-slate-100/80 py-24">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>

          <div className="relative mx-auto max-w-6xl px-6">
            <div className="grid gap-6 md:grid-cols-4">
              {[
                {
                  title: "100% Safe and Secure",
                  icon: (
                    <svg
                      className="h-8 w-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  ),
                  gradient: "from-emerald-500/20 to-emerald-400/10",
                  color: "emerald",
                },
                {
                  title: "Easy User Interface",
                  icon: (
                    <svg
                      className="h-8 w-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                      />
                    </svg>
                  ),
                  gradient: "from-blue-500/20 to-blue-400/10",
                  color: "blue",
                },
                {
                  title: "24/7 Customer Support",
                  icon: (
                    <svg
                      className="h-8 w-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  ),
                  gradient: "from-purple-500/20 to-purple-400/10",
                  color: "purple",
                },
                {
                  title: "Verified by Play Protect",
                  icon: (
                    <svg
                      className="h-8 w-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ),
                  gradient: "from-amber-500/20 to-amber-400/10",
                  color: "amber",
                },
              ].map((benefit, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-8 text-center shadow-lg shadow-slate-900/5 transition-all hover:scale-105 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10"
                >
                  {/* Decorative background gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${benefit.gradient} opacity-0 transition-opacity group-hover:opacity-100`}
                  ></div>

                  <div className="relative space-y-4">
                    {/* Icon */}
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-lg shadow-primary/10 transition-transform group-hover:scale-110 group-hover:rotate-6">
                      {benefit.icon}
                    </div>

                    {/* Title */}
                    <p className="text-lg font-bold leading-snug text-slate-900 lg:text-xl">
                      {benefit.title}
                    </p>
                  </div>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary via-primary/80 to-primary transition-all group-hover:w-full"></div>
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
              <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-900 lg:text-5xl xl:text-6xl">
                <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                  Don't just take our word for it
                </span>
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600 lg:text-xl">
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
                    "HissabBook gives us unrivalled control over cash advances and daily reconciliation. Our team loves the mobile-first workflows.",
                  author: "Sanjay Jodun",
                  role: "Founder",
                  gradient: "from-blue-500/20 via-blue-400/10 to-blue-500/20",
                  borderGlow: "0 0 20px rgba(59, 130, 246, 0.3)",
                },
                {
                  company: "Jawai",
                  quote:
                    "With HissabBook, finances sync effortlessly with our accountants. Staff onboarding is fast and secure.",
                  author: "Arun Agarwal",
                  role: "Founder",
                  gradient: "from-purple-500/20 via-purple-400/10 to-purple-500/20",
                  borderGlow: "0 0 20px rgba(168, 85, 247, 0.3)",
                },
                {
                  company: "Swish",
                  quote:
                    "Multiple businesses, unified dashboards, and export-ready reports make HissabBook our go-to finance ally.",
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

        {/* Download App CTA Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary py-24">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
          </div>

          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2 text-xs font-bold uppercase tracking-[0.35em] text-white shadow-lg backdrop-blur-sm">
              Get Started
            </span>
            <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight text-white lg:text-5xl xl:text-6xl">
              Download the App Now!
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/90 lg:text-xl">
              Available on Android and iOS. Start managing your books within
              minutes.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <button className="group relative overflow-hidden rounded-full bg-white px-8 py-4 text-sm font-bold text-primary shadow-2xl shadow-black/20 transition-all hover:-translate-y-1 hover:shadow-3xl hover:shadow-black/30">
                <span className="relative z-10 flex items-center gap-2">
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.24-.84-.76-.84-1.35zm13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27zm3.35-4.94c.34-.34.34-.9 0-1.24L17.74 5.84c-.34-.34-.9-.34-1.24 0L14.23 8.11l2.27 2.27 3.66-3.66zm-8.36 3.66L9.17 11.64l8.49 8.49 2.27-2.27-8.49-8.49z" />
                  </svg>
                  Google Play
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-white opacity-0 transition-opacity group-hover:opacity-100"></div>
              </button>
              <button className="group relative overflow-hidden rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 text-sm font-bold text-white backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/20 hover:shadow-xl hover:shadow-white/20">
                <span className="relative z-10 flex items-center gap-2">
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  App Store
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 transition-opacity group-hover:opacity-100"></div>
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

