"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import Footer from "../components/Footer";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || 
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

export default function SecurityPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [smallLogoUrl, setSmallLogoUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "+91 ",
    workEmail: "",
    companyName: "",
    companyGstin: "",
    numberOfEmployees: "",
    referralSource: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Handle ESC key to close modals
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isVideoModalOpen) {
          setIsVideoModalOpen(false);
        }
        if (isDemoModalOpen) {
          setIsDemoModalOpen(false);
        }
      }
    };
    if (isVideoModalOpen || isDemoModalOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isVideoModalOpen, isDemoModalOpen]);

  // Handle phone number formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (!value.startsWith("+91 ")) {
      value = "+91 " + value.replace(/^\+91\s*/, "");
    }
    // Only allow numbers after +91
    value = value.replace(/^(\+91\s)(.*)/, (_, prefix, rest) => {
      return prefix + rest.replace(/\D/g, "").slice(0, 10);
    });
    setFormData({ ...formData, phone: value });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // TODO: Add API call to submit form data
    console.log("Form submitted:", formData);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Thank you! We'll get back to you soon.");
      setIsDemoModalOpen(false);
      // Reset form
      setFormData({
        fullName: "",
        phone: "+91 ",
        workEmail: "",
        companyName: "",
        companyGstin: "",
        numberOfEmployees: "",
        referralSource: "",
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur transition-all duration-300">
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
              className="transition-colors hover:text-primary"
            >
              Pricing
            </Link>
            <Link
              href="/security"
              className="text-primary transition-colors hover:text-primary"
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
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-white py-20 lg:py-28">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
          </div>

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
            <div className="space-y-8">
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
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016a11.959 11.959 0 00-8.618-3.04"
                  />
                </svg>
                Security First
              </span>
              <div className="space-y-4">
                <h1 className="text-5xl font-black leading-[1.1] tracking-tight text-slate-900 lg:text-6xl xl:text-7xl">
                  <span className="block">
                    Secure spends.
                  </span>
                  <span className="block bg-gradient-to-r from-primary via-primary/90 to-primary bg-clip-text text-transparent">
                    Zero stress.
                  </span>
                </h1>
                <p className="text-lg leading-relaxed text-slate-600 max-w-xl lg:text-xl">
                  Every swipe, every invoice, and every employee expense on
                  HissabBook is protected by the same controls India's leading
                  banks rely on.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => setIsDemoModalOpen(true)}
                  className="group relative overflow-hidden rounded-full bg-gradient-to-r from-primary via-primary/95 to-primary px-8 py-4 text-base font-bold text-white shadow-[0_20px_50px_rgba(35,87,255,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_25px_60px_rgba(35,87,255,0.5)] hover:scale-105"
                >
                  <span className="relative z-10 flex items-center gap-2.5">
                    Book a Demo
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
                <button
                  onClick={() => setIsVideoModalOpen(true)}
                  className="group relative overflow-hidden rounded-full border-2 border-slate-300 bg-white px-8 py-4 text-base font-bold text-slate-700 shadow-sm transition-all duration-300 hover:border-primary hover:bg-primary/5 hover:text-primary hover:shadow-md hover:scale-105"
                >
                  <span className="relative z-10 flex items-center gap-2.5">
                    Watch Video
                    <svg
                      className="h-5 w-5 transition-transform duration-300 group-hover:scale-110"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"
                      />
                    </svg>
                  </span>
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
                <span className="transition-colors hover:text-primary">UPI</span>
                <span className="transition-colors hover:text-primary">NPCI</span>
                <span className="transition-colors hover:text-primary">Razorpay</span>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="relative w-full overflow-hidden rounded-[40px] bg-gradient-to-br from-primary/5 via-white to-primary/10 shadow-lg">
                  <Image
                    src="/images/7.png"
                    alt="Security illustration"
                    width={400}
                    height={600}
                    className="h-auto w-full"
                    sizes="(max-width: 768px) 100vw, 448px"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Features Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 py-24">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
            <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
          </div>

          <div className="relative mx-auto max-w-7xl px-6">
            {/* Section Header */}
            <div className="text-center">
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
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016a11.959 11.959 0 00-8.618-3.04"
                  />
                </svg>
                Security
              </span>
              <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-900 lg:text-5xl xl:text-6xl">
                <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                  Security Features
                </span>
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600 lg:text-xl">
                Your safety comes first. Bank-grade security for every transaction.
              </p>
            </div>

            {/* Features Grid */}
            <div className="mt-16 grid gap-6 md:grid-cols-2">
              {[
                {
                  title: "Secure Screen Authentications",
                  description:
                    "Protected with fingerprint/face ID, wallet PIN and OTP for every authentication.",
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
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  ),
                  gradient: "from-blue-500/20 via-blue-400/10 to-blue-500/20",
                },
                {
                  title: "Bank Grade Encryption",
                  description:
                    "Industry-standard encryption protocols and multi-factor authentication.",
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
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  ),
                  gradient: "from-purple-500/20 via-purple-400/10 to-purple-500/20",
                },
                {
                  title: "Security Audits",
                  description:
                    "Annual security audits by CERT-IN empanelled partners.",
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
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                  ),
                  gradient: "from-emerald-500/20 via-emerald-400/10 to-emerald-500/20",
                },
                {
                  title: "Approved by NPCI",
                  description:
                    "Certified to enable UPI transactions with comprehensive regulatory coverage.",
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
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ),
                  gradient: "from-amber-500/20 via-amber-400/10 to-amber-500/20",
                },
              ].map((feature, i) => (
                <article
                  key={i}
                  className="group relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5 ring-1 ring-slate-200/50 transition-all hover:scale-105 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:ring-primary/20"
                >
                  {/* Decorative background gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                  ></div>

                  {/* Icon */}
                  <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-lg shadow-primary/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    {feature.icon}
                  </div>

                  {/* Content */}
                  <div className="relative space-y-3">
                    <h3 className="text-xl font-bold leading-tight text-slate-900 transition-colors group-hover:text-primary lg:text-2xl">
                      {feature.title}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-slate-600 lg:text-lg">
                      {feature.description}
                    </p>
                  </div>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary via-primary/80 to-primary transition-all duration-700 group-hover:w-full"></div>

                  {/* Corner decoration */}
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br from-primary/10 to-transparent opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100"></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Our Customers Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50/30 to-white py-20">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/3 blur-3xl"></div>
          </div>

          <div className="relative mx-auto max-w-6xl px-6 text-center">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.35em] text-primary shadow-lg shadow-primary/10 backdrop-blur-sm">
              Trusted By
            </span>
            <p className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-900 lg:text-4xl xl:text-5xl">
              UPI wallets trusted by <span className="bg-gradient-to-r from-primary via-primary/90 to-primary bg-clip-text text-transparent">1,500+ businesses</span>.
            </p>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm font-semibold text-slate-600">
              {[
                "LangEed",
                "Mapro",
                "Opus",
                "Swish",
                "YoloBus",
                "Better Tomorrow",
              ].map((customer, i) => (
                <span
                  key={i}
                  className="rounded-full border border-slate-200 bg-white px-6 py-3 shadow-sm transition-all hover:scale-110 hover:border-primary hover:bg-primary/5 hover:text-primary hover:shadow-md"
                >
                  {customer}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Your Safety Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 py-24">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-10 px-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="group relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-10 text-center shadow-lg shadow-slate-900/5 ring-1 ring-slate-200/50 transition-all hover:scale-[1.02] hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:ring-primary/20">
              {/* Decorative background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>

              <div className="relative space-y-8">
                <div>
                  <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-900 transition-colors group-hover:text-primary lg:text-4xl xl:text-5xl">
                    Your safety is our priority
                  </h2>
                  <p className="mt-5 text-lg leading-relaxed text-slate-600 lg:text-xl">
                    We are committed to providing a safe and secure platform.
                    Every workflow is built with compliance-first principles.
                  </p>
                </div>
                <div className="relative h-64 rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-primary/25 shadow-lg ring-2 ring-primary/10 transition-transform duration-500 group-hover:scale-105">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="h-24 w-24 text-primary/30"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="space-y-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                    HissabBook Payments maintains the highest level of security
                    standards
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                    <span className="rounded-full border border-primary/20 bg-primary/5 px-4 py-2 shadow-sm">
                      Ensuring Secure Payments
                    </span>
                    <span className="rounded-full border border-primary/20 bg-primary/5 px-4 py-2 shadow-sm">
                      Introduced HissabBook Payments
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary via-primary/80 to-primary transition-all duration-700 group-hover:w-full"></div>
            </div>

            <div className="space-y-6">
              <div className="group relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5 ring-1 ring-slate-200/50 transition-all hover:scale-105 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 hover:ring-primary/20">
                {/* Decorative background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-red-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>

                <div className="relative space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/10 to-red-500/5 text-red-600 shadow-lg shadow-red-500/10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold leading-tight text-slate-900 transition-colors group-hover:text-red-600 lg:text-2xl">
                    Found anything suspicious?
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-slate-600 lg:text-lg">
                    Report it to us immediately. Our compliance team monitors
                    fraudulent behaviour 24/7.
                  </p>
                  <button className="mt-6 w-full rounded-full border-2 border-slate-200 bg-white px-6 py-4 text-base font-bold text-slate-900 shadow-sm transition-all duration-300 hover:border-red-500 hover:bg-red-50 hover:text-red-600 hover:shadow-md hover:scale-105">
                    Report Fraud
                  </button>
                </div>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-red-500 via-red-400 to-red-500 transition-all duration-700 group-hover:w-full"></div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.35em] text-primary shadow-lg shadow-primary/10 backdrop-blur-sm">
              FAQs
            </span>
            <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-900 lg:text-5xl xl:text-6xl">
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                All your questions — answered
              </span>
            </h2>
            <div className="mt-10 space-y-4 text-left">
              {[
                {
                  question: "How secure is my information on HissabBook?",
                  answer:
                    "We protect all information with bank-grade encryption, access controls, and regular security audits.",
                },
                {
                  question: "Is it safe to transfer money through the app?",
                  answer:
                    "Yes. UPI transactions are routed through RBI-regulated partner banks with NPCI-certified compliance.",
                },
                {
                  question: "What can I do to keep my transactions safe?",
                  answer:
                    "Enable biometric authentication, set wallet PINs, and configure spend limits for every employee wallet.",
                },
                {
                  question: "What if someone tries to login to my account?",
                  answer:
                    "We alert you instantly via email/SMS and require OTP verification. You can freeze wallets with one tap.",
                },
                {
                  question: "How do I register a fraud complaint?",
                  answer:
                    "Contact our 24/7 compliance desk or raise a ticket within the app. We respond within four working hours.",
                },
              ].map((faq, i) => (
                <details
                  key={i}
                  className="group rounded-2xl border border-slate-100 bg-slate-50 p-6 shadow-card transition-all hover:shadow-lg"
                >
                  <summary className="flex cursor-pointer items-center justify-between text-base font-bold leading-relaxed text-slate-900 transition-colors hover:text-primary lg:text-lg">
                    {faq.question}
                    <span className="ml-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary transition-all group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 text-base leading-relaxed text-slate-600 lg:text-lg">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setIsVideoModalOpen(false)}
        >
          <div
            className="relative mx-4 w-full max-w-5xl animate-fade-in-up rounded-2xl bg-white shadow-2xl ring-1 ring-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute -right-4 -top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-600 shadow-xl ring-2 ring-white/50 transition-all hover:scale-110 hover:bg-slate-100 hover:text-slate-900 hover:ring-primary/30"
              aria-label="Close modal"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Video Container */}
            <div className="relative aspect-video w-full overflow-hidden rounded-t-2xl bg-gradient-to-br from-slate-900 to-slate-800">
              <iframe
                className="h-full w-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0&modestbranding=1"
                title="HissabBook Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>

            {/* Video Info */}
            <div className="rounded-b-2xl bg-gradient-to-b from-white to-slate-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold leading-tight text-slate-900 lg:text-2xl">
                    HissabBook Security Overview
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-slate-600 lg:text-lg">
                    Learn how HissabBook ensures bank-grade security for all your
                    transactions.
                  </p>
                </div>
                <div className="hidden items-center gap-2 md:flex">
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
                  <span className="text-xs font-bold text-slate-500">4.8/5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Request Modal */}
      {isDemoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setIsDemoModalOpen(false)}
        >
          <div
            className="relative mx-4 my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsDemoModalOpen(false)}
              className="absolute -right-4 -top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-lg transition-all hover:scale-110 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close modal"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Form Container */}
            <div className="p-8 md:p-10">
              <h2 className="mb-8 text-3xl font-bold text-slate-900">
                HissabBook UPI - Demo Request
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name and Phone Number */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="fullName"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      required
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      placeholder="Enter your full name"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Phone number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      required
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      placeholder="+91 8062180067"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Work Email */}
                <div>
                  <label
                    htmlFor="workEmail"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Work Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="workEmail"
                    required
                    value={formData.workEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, workEmail: e.target.value })
                    }
                    placeholder="Enter your work email address"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Company Name and GSTIN */}
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="companyName"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Company name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      required
                      value={formData.companyName}
                      onChange={(e) =>
                        setFormData({ ...formData, companyName: e.target.value })
                      }
                      placeholder="Enter company name"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="companyGstin"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Company GSTIN
                    </label>
                    <input
                      type="text"
                      id="companyGstin"
                      value={formData.companyGstin}
                      onChange={(e) =>
                        setFormData({ ...formData, companyGstin: e.target.value })
                      }
                      placeholder="Enter company GSTIN"
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                {/* Number of Employees */}
                <div>
                  <label
                    htmlFor="numberOfEmployees"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Number of Employees You Plan to Issue UPI Wallets To?{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="numberOfEmployees"
                    required
                    value={formData.numberOfEmployees}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numberOfEmployees: e.target.value,
                      })
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_1rem_center] bg-no-repeat px-4 py-3 pr-10 text-sm text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select number of employees...</option>
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-100">51-100</option>
                    <option value="101-500">101-500</option>
                    <option value="501-1000">501-1000</option>
                    <option value="1000+">1000+</option>
                  </select>
                </div>

                {/* Referral Source */}
                <div>
                  <label
                    htmlFor="referralSource"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    How did you know about HissabBook UPI wallets?{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="referralSource"
                    required
                    value={formData.referralSource}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        referralSource: e.target.value,
                      })
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_1rem_center] bg-no-repeat px-4 py-3 pr-10 text-sm text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="">Select how did you know...</option>
                    <option value="google">Google Search</option>
                    <option value="social-media">Social Media</option>
                    <option value="referral">Referral</option>
                    <option value="advertisement">Advertisement</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded-xl bg-slate-900 px-6 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

