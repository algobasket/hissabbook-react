"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import Footer from "./components/Footer";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || 
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

export default function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [smallLogoUrl, setSmallLogoUrl] = useState<string | null>(null);
  const [downloadLinks, setDownloadLinks] = useState({
    googlePlayUrl: null as string | null,
    appStoreUrl: null as string | null,
    apkDownloadUrl: null as string | null,
  });
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

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch small logo and download links from site settings
  useEffect(() => {
    const fetchSiteSettings = async () => {
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
          // Set download links
          // Construct full APK URL if it's just a filename
          let apkUrl = siteSettings.apkDownloadUrl || null;
          if (apkUrl && !apkUrl.startsWith('http')) {
            apkUrl = `${API_BASE}/uploads/${apkUrl}`;
          }
          
          setDownloadLinks({
            googlePlayUrl: siteSettings.googlePlayUrl || null,
            appStoreUrl: siteSettings.appStoreUrl || null,
            apkDownloadUrl: apkUrl,
          });
        }
      } catch (err) {
        console.warn("Failed to fetch site settings:", err);
        // Continue without logo and links - will show fallback
      }
    };
    fetchSiteSettings();
  }, []);

  // Handle ESC key to close modals and mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isVideoModalOpen) {
          setIsVideoModalOpen(false);
        }
        if (isDemoModalOpen) {
          setIsDemoModalOpen(false);
        }
        if (isDownloadModalOpen) {
          setIsDownloadModalOpen(false);
        }
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
        }
      }
    };
    if (isVideoModalOpen || isDemoModalOpen || isDownloadModalOpen || isMobileMenuOpen) {
      document.addEventListener("keydown", handleEscape);
      if (isVideoModalOpen || isDemoModalOpen || isDownloadModalOpen) {
        document.body.style.overflow = "hidden";
      }
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isVideoModalOpen, isDemoModalOpen, isDownloadModalOpen, isMobileMenuOpen]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
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
              className="relative transition-colors hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
            >
              Book Keeping
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
              className="text-slate-600 transition-colors hover:text-primary"
            >
              Login/Register
            </Link>
            <button 
              onClick={() => setIsDownloadModalOpen(true)}
              className="group relative overflow-hidden rounded-full border-2 border-primary/20 bg-gradient-to-r from-primary to-primary/90 px-6 py-2.5 text-white shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:border-primary hover:shadow-xl hover:shadow-primary/40"
            >
              <span className="relative z-10">Download App</span>
              <div className="absolute inset-0 -z-0 bg-gradient-to-r from-primary/90 to-primary opacity-0 transition-opacity group-hover:opacity-100"></div>
            </button>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 transition-colors hover:border-primary hover:bg-primary/5 lg:hidden"
            aria-label={isMobileMenuOpen ? "Close Menu" : "Open Menu"}
          >
            {isMobileMenuOpen ? (
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
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
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[73px] z-40 bg-white lg:hidden animate-fade-in">
          <div className="flex flex-col border-t border-slate-200 bg-white">
            <nav className="flex flex-col px-6 py-4 space-y-1">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-base font-medium text-slate-700 transition-colors hover:bg-primary/5 hover:text-primary"
              >
                Home
              </Link>
              <Link
                href="/customers"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-base font-medium text-slate-700 transition-colors hover:bg-primary/5 hover:text-primary"
              >
                Customers
              </Link>
              <Link
                href="/pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-base font-medium text-slate-700 transition-colors hover:bg-primary/5 hover:text-primary"
              >
                Pricing
              </Link>
              <Link
                href="/security"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-base font-medium text-slate-700 transition-colors hover:bg-primary/5 hover:text-primary"
              >
                Security
              </Link>
              <Link
                href="/book-keeping"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-base font-medium text-slate-700 transition-colors hover:bg-primary/5 hover:text-primary"
              >
                Book Keeping
              </Link>
              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-base font-medium text-slate-700 transition-colors hover:bg-primary/5 hover:text-primary"
              >
                About Us
              </Link>
            </nav>
            <div className="px-6 py-4 space-y-3 border-t border-slate-200">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-3 rounded-lg text-base font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-primary"
              >
                Login/Register
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsDownloadModalOpen(true);
                }}
                className="w-full rounded-full border-2 border-primary/20 bg-gradient-to-r from-primary to-primary/90 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:border-primary hover:shadow-xl hover:shadow-primary/40"
              >
                Download App
              </button>
            </div>
          </div>
        </div>
      )}

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-primary/5 to-white pb-0">
          {/* Animated background elements */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-primary/5 blur-3xl animate-pulse delay-700"></div>
          </div>

          <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 py-20 lg:grid-cols-2 lg:py-32">
            <div className="space-y-8 animate-fade-in-up">
              <span className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.35em] text-primary shadow-lg shadow-primary/10">
                <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                NPCI Certified • ISO 27001
              </span>
              <h1 className="text-5xl font-extrabold leading-tight text-slate-900 lg:text-6xl xl:text-7xl">
                UPI Wallets for{" "}
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                  Business Expenses
                </span>
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-slate-600">
                Issue UPI-powered digital wallets for your teams, set smart
                limits, approve spends in real time, and close books 5× faster.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setIsDemoModalOpen(true)}
                  className="group relative overflow-hidden rounded-full bg-gradient-to-r from-primary to-primary/90 px-8 py-4 text-sm font-bold text-white shadow-2xl shadow-primary/40 transition-all hover:scale-105 hover:shadow-primary/50"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Book a Demo
                    <svg
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary opacity-0 transition-opacity group-hover:opacity-100"></div>
                </button>
                <button
                  onClick={() => setIsVideoModalOpen(true)}
                  className="group flex items-center gap-2 rounded-full border-2 border-slate-200 bg-white px-8 py-4 text-sm font-bold text-slate-900 shadow-lg transition-all hover:scale-105 hover:border-primary hover:shadow-xl"
                >
                  <svg
                    className="h-5 w-5 text-primary transition-transform group-hover:scale-110"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Watch Video
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-white"
                      ></div>
                    ))}
                  </div>
                  <span className="font-semibold">
                    Trusted by 1,500+ businesses
                  </span>
                </div>
                <span className="inline-flex items-center gap-2 font-semibold">
                  <svg
                    className="h-5 w-5 text-amber-400"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  <span className="text-slate-900">4.8/5</span>
                  <span className="text-slate-500">(320+ reviews)</span>
                </span>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-lg animate-fade-in">
              <div className="relative rounded-[40px] bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5">
                <div className="absolute -inset-1 rounded-[40px] bg-gradient-to-r from-primary/20 to-primary/10 opacity-20 blur-xl"></div>
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-400"></div>
                      <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                      <div className="h-3 w-3 rounded-full bg-green-400"></div>
                    </div>
                    <span className="h-2 w-24 rounded-full bg-slate-200"></span>
                  </div>
                  <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Total Wallet Balance
                        </span>
                        <span className="mt-2 block text-3xl font-bold text-slate-900">
                          ₹ 12,60,000
                        </span>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-gradient-to-r from-emerald-100 to-emerald-50 px-4 py-2 text-xs font-bold text-emerald-600 shadow-lg shadow-emerald-500/20">
                        <svg
                          className="mr-1 h-3 w-3"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        +18.2%
                      </span>
                    </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <div className="group rounded-2xl border border-slate-100 bg-gradient-to-br from-primary/5 to-white p-5 transition-all hover:shadow-lg">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Approvals
                        </span>
                        <p className="mt-3 text-2xl font-bold text-slate-900">
                          14 Pending
                        </p>
                        <div className="mt-4 h-2.5 rounded-full bg-slate-100">
                          <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/30"></div>
                        </div>
                      </div>
                      <div className="group rounded-2xl border border-slate-100 bg-gradient-to-br from-amber-50 to-white p-5 transition-all hover:shadow-lg">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Spend Limits
                        </span>
                        <p className="mt-3 text-2xl font-bold text-slate-900">
                          ₹ 50,000
                        </p>
                        <div className="mt-4 h-2.5 rounded-full bg-slate-100">
                          <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 shadow-lg shadow-amber-400/30"></div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white p-5 md:col-span-2">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Recent Transactions
                        </span>
                        <div className="mt-4 space-y-3 text-sm">
                          {[
                            { name: "Fuel - Logistics", amount: "₹ 12,500" },
                            { name: "Vendor Payment - D2C", amount: "₹ 34,900" },
                            { name: "Travel Advances", amount: "₹ 9,300" },
                          ].map((txn, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between rounded-xl bg-white p-3 transition-all hover:shadow-md"
                            >
                              <span className="font-medium text-slate-600">
                                {txn.name}
                              </span>
                              <span className="font-bold text-slate-900">
                                {txn.amount}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Industry Categories Section */}
          <div className="relative overflow-hidden border-t border-slate-200/60 bg-gradient-to-b from-white via-white to-slate-50/30 pt-12 pb-16">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/2 left-1/4 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl"></div>
              <div className="absolute top-1/2 right-1/4 h-32 w-32 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl"></div>
            </div>
            
            <div className="relative mx-auto max-w-6xl px-6">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/8 to-primary/4 px-4 py-1.5 mb-3 shadow-sm">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-primary">
                    Trusted Across Industries
                  </p>
                </div>
                <p className="text-sm text-slate-600 font-medium">
                  Serving businesses of all sizes and sectors
                </p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
                {[
                  { 
                    name: "Logistics", 
                    icon: (
                      <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    ),
                    gradient: "from-blue-500/10 to-blue-100/5",
                    color: "text-blue-600"
                  },
                  { 
                    name: "Manufacturing", 
                    icon: (
                      <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                      </svg>
                    ),
                    gradient: "from-amber-500/10 to-amber-100/5",
                    color: "text-amber-600"
                  },
                  { 
                    name: "SAAS", 
                    icon: (
                      <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    ),
                    gradient: "from-purple-500/10 to-purple-100/5",
                    color: "text-purple-600"
                  },
                  { 
                    name: "Retail Chains", 
                    icon: (
                      <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    ),
                    gradient: "from-emerald-500/10 to-emerald-100/5",
                    color: "text-emerald-600"
                  },
                  { 
                    name: "Hospitality", 
                    icon: (
                      <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    ),
                    gradient: "from-rose-500/10 to-rose-100/5",
                    color: "text-rose-600"
                  },
                  { 
                    name: "Construction", 
                    icon: (
                      <svg className="h-4.5 w-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    ),
                    gradient: "from-slate-500/10 to-slate-100/5",
                    color: "text-slate-600"
                  },
                ].map((industry, i) => (
                  <div
                    key={i}
                    className={`group relative flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-gradient-to-br ${industry.gradient} bg-white/95 px-4 py-2.5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-primary/50 hover:bg-white hover:shadow-md hover:shadow-primary/10`}
                  >
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-primary shadow-xs transition-all group-hover:scale-110 group-hover:rotate-3 group-hover:bg-primary/10 ${industry.color} group-hover:text-primary`}>
                      {industry.icon}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.15em] text-slate-700 transition-colors group-hover:text-primary">
                      {industry.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* App Buttons Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50/50 to-white pt-20 pb-24 lg:pt-24 lg:pb-32">
          {/* Decorative Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 blur-3xl"></div>
            <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-tr from-primary/10 to-primary/5 blur-3xl"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(35,87,255,0.04),transparent_70%)]"></div>
          </div>

          <div className="relative mx-auto max-w-6xl px-6">
            <div className="flex flex-col items-center justify-center gap-12">
              {/* Header Content */}
              <div className="text-center space-y-4 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-2.5">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-xs font-bold uppercase tracking-[0.4em] text-primary">
                    Get the App
                  </p>
                </div>
                <h2 className="text-5xl font-extrabold leading-tight text-slate-900 lg:text-6xl xl:text-7xl">
                  Download{" "}
                  <span className="bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                    HissabBook
                  </span>
                </h2>
                <p className="mx-auto max-w-2xl text-xl leading-relaxed text-slate-600">
                  Manage expenses on the go with our mobile app. Available on all
                  platforms.
                </p>
              </div>

              {/* App Buttons */}
              <div className="flex flex-row flex-wrap items-center justify-center gap-5 md:gap-6 lg:gap-8">
                {/* Google Play Button */}
                <a
                  href="#"
                  className="group relative flex items-center gap-4 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-7 py-5 shadow-2xl shadow-slate-900/30 transition-all duration-300 hover:scale-110 hover:shadow-3xl hover:shadow-slate-900/40 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                  <div className="relative flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm transition-transform group-hover:scale-110 group-hover:rotate-3">
                      <svg
                        className="h-7 w-7 text-white"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" />
                      </svg>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-white/70 leading-tight">
                        GET IT ON
                      </span>
                      <span className="text-lg font-extrabold text-white leading-tight">
                        Google Play
                      </span>
                    </div>
                  </div>
                </a>

                {/* App Store Button */}
                <a
                  href="#"
                  className="group relative flex items-center gap-4 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-7 py-5 shadow-2xl shadow-slate-900/30 transition-all duration-300 hover:scale-110 hover:shadow-3xl hover:shadow-slate-900/40 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                  <div className="relative flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm transition-transform group-hover:scale-110 group-hover:-rotate-3">
                      <svg
                        className="h-7 w-7 text-white"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-white/70 leading-tight">
                        Download on the
                      </span>
                      <span className="text-lg font-extrabold text-white leading-tight">
                        App Store
                      </span>
                    </div>
                  </div>
                </a>

                {/* HissabBook Web Button */}
                <a
                  href="#"
                  className="group relative flex items-center gap-4 rounded-3xl bg-gradient-to-br from-primary via-primary/95 to-primary px-7 py-5 shadow-2xl shadow-primary/40 ring-2 ring-primary/20 transition-all duration-300 hover:scale-110 hover:shadow-3xl hover:shadow-primary/50 hover:-translate-y-1 hover:ring-primary/40"
                >
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                  <div className="relative flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-transform group-hover:scale-110 group-hover:rotate-12">
                      <svg
                        className="h-7 w-7 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                        />
                      </svg>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-white/90 leading-tight">
                        HissabBook Web
                      </span>
                      <span className="text-lg font-extrabold text-white leading-tight">
                        web.hissabbook.in
                      </span>
                    </div>
                  </div>
          </a>
        </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-600">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="h-10 w-10 rounded-full border-2 border-white bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg"
                      ></div>
                    ))}
                  </div>
                  <span className="font-bold text-slate-900">
                    Trusted by 1,500+ businesses
                  </span>
                </div>
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
                  <span className="font-bold text-slate-900">4.8/5</span>
                  <span className="text-slate-500">(320+ reviews)</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/30 to-white py-28 lg:py-32">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
            <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(35,87,255,0.04),transparent_60%)]"></div>
          </div>

          <div className="relative mx-auto max-w-7xl px-6">
            {/* Section Header */}
            <div className="mb-16 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/8 to-primary/4 px-4 py-1.5 mb-4 shadow-sm">
                <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                <p className="text-xs font-bold uppercase tracking-[0.4em] text-primary">
                  Key Features
                </p>
              </div>
              <h2 className="mt-4 text-4xl font-extrabold leading-tight text-slate-900 lg:text-5xl xl:text-6xl">
                Everything you need to{" "}
                <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  manage expenses
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
                Powerful features designed to streamline your expense management
                workflow
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  ),
                  title: "Universal Acceptance",
                  description:
                    "Issue wallets that work on every UPI network and accept QR & POS payments.",
                  gradient: "from-blue-500/15 via-blue-100/8 to-transparent",
                  iconBg: "from-blue-500/20 to-blue-100/10",
                  iconColor: "text-blue-600",
                  borderColor: "border-blue-200/50",
                },
                {
                  icon: (
                    <>
                      <circle cx="12" cy="12" r="9" strokeWidth="2" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3"
                      />
                    </>
                  ),
                  title: "Secure & Certified",
                  description:
                    "NPCI certified, ISO 27001 compliant, bank-grade encryption with role-based access.",
                  gradient: "from-emerald-500/15 via-emerald-100/8 to-transparent",
                  iconBg: "from-emerald-500/20 to-emerald-100/10",
                  iconColor: "text-emerald-600",
                  borderColor: "border-emerald-200/50",
                },
                {
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 7h14M5 12h14M5 17h14"
                    />
                  ),
                  title: "Stop Cash Leakage",
                  description:
                    "Configure dynamic spend controls and approval flows to eliminate cash losses.",
                  gradient: "from-red-500/15 via-red-100/8 to-transparent",
                  iconBg: "from-red-500/20 to-red-100/10",
                  iconColor: "text-red-600",
                  borderColor: "border-red-200/50",
                },
                {
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-3-3v6m8 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  ),
                  title: "Real-time Visibility",
                  description:
                    "Live dashboards, instant alerts, and receipt uploads keep finance in full control.",
                  gradient: "from-purple-500/15 via-purple-100/8 to-transparent",
                  iconBg: "from-purple-500/20 to-purple-100/10",
                  iconColor: "text-purple-600",
                  borderColor: "border-purple-200/50",
                },
                {
                  icon: (
                    <>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 6v6l3 3"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 12h14"
                      />
                    </>
                  ),
                  title: "Save Time",
                  description:
                    "Automate reconciliations and close monthly books 5× faster with verified data.",
                  gradient: "from-amber-500/15 via-amber-100/8 to-transparent",
                  iconBg: "from-amber-500/20 to-amber-100/10",
                  iconColor: "text-amber-600",
                  borderColor: "border-amber-200/50",
                },
                {
                  icon: (
                    <>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19.5 12a7.5 7.5 0 10-15 0 7.5 7.5 0 0015 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 7.5V12l2.25 2.25"
                      />
                    </>
                  ),
                  title: "Live Controls",
                  description:
                    "Freeze, top-up or restrict wallets instantly with advanced policy management.",
                  gradient: "from-indigo-500/15 via-indigo-100/8 to-transparent",
                  iconBg: "from-indigo-500/20 to-indigo-100/10",
                  iconColor: "text-indigo-600",
                  borderColor: "border-indigo-200/50",
                },
                {
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 4h4l2 6-2 6H5l2-6zM13 4h4l2 6-2 6h-4l2-6z"
                    />
                  ),
                  title: "Zero Fuel Surcharge",
                  description:
                    "Avoid credit card fuel surcharges by moving payments to controlled UPI wallets.",
                  gradient: "from-cyan-500/15 via-cyan-100/8 to-transparent",
                  iconBg: "from-cyan-500/20 to-cyan-100/10",
                  iconColor: "text-cyan-600",
                  borderColor: "border-cyan-200/50",
                },
                {
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7h8M8 12h8m-8 5h5"
                    />
                  ),
                  title: "Book a Demo",
                  description:
                    "See how HissabBook transforms employee spending for finance-first organisations.",
                  gradient: "from-primary/15 via-primary/8 to-transparent",
                  iconBg: "from-primary/20 to-primary/10",
                  iconColor: "text-primary",
                  borderColor: "border-primary/30",
                },
              ].map((feature, i) => (
                <article
                  key={i}
                  className={`group relative overflow-hidden rounded-3xl border ${feature.borderColor} bg-white/95 p-8 shadow-lg backdrop-blur-sm transition-all duration-500 hover:scale-[1.02] hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10`}
                >
                  {/* Animated gradient overlay */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                  ></div>

                  {/* Content */}
                  <div className="relative z-10 flex flex-col gap-5">
                    {/* Icon */}
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.iconBg} shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-lg`}
                    >
                      <svg
                        className={`h-7 w-7 ${feature.iconColor} transition-colors group-hover:text-primary`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {feature.icon}
                      </svg>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-extrabold leading-tight text-slate-900 transition-colors group-hover:text-primary">
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm leading-relaxed text-slate-600">
                      {feature.description}
                    </p>
                  </div>

                  {/* Decorative corner element */}
                  <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Industries Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-white py-28 lg:py-32">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
            <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(35,87,255,0.03),transparent_70%)]"></div>
          </div>

          <div className="relative mx-auto max-w-7xl px-6">
            {/* Section Header */}
            <div className="mb-16 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/8 to-primary/4 px-4 py-1.5 mb-4 shadow-sm">
                <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                <p className="text-xs font-bold uppercase tracking-[0.4em] text-primary">
                  Industries We Serve
                </p>
              </div>
              <h2 className="mt-4 text-4xl font-extrabold leading-tight text-slate-900 lg:text-5xl xl:text-6xl">
                From startups to{" "}
                <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  enterprises
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
                Designed for logistics, D2C brands, manufacturing plants, field
                teams and every business in between.
              </p>
            </div>

            {/* Industry Cards Grid */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  gradient:
                    "from-slate-900 via-slate-800 to-slate-900",
                  radial:
                    "rgba(255,255,255,0.15)_0%,_rgba(15,23,42,0.9)_80%",
                  title: "Logistics",
                  description:
                    "Track driver spends, fuel payouts and route advances with zero paperwork.",
                  hoverShadow: "0_25px_50px_-12px_rgba(59,130,246,0.3)",
                },
                {
                  gradient: "from-indigo-900 via-purple-900 to-slate-900",
                  radial:
                    "rgba(129,140,248,0.25)_0%,_rgba(15,23,42,0.9)_80%",
                  title: "D2C",
                  description:
                    "Empower store and warehouse teams with controlled petty cash wallets.",
                  hoverShadow: "0_25px_50px_-12px_rgba(168,85,247,0.3)",
                },
                {
                  gradient: "from-purple-900 via-pink-900 to-slate-900",
                  radial:
                    "rgba(196,181,253,0.3)_0%,_rgba(15,23,42,0.9)_80%",
                  title: "Manufacturing",
                  description:
                    "Manage plant procurement, field travel and vendor payments on one platform.",
                  hoverShadow: "0_25px_50px_-12px_rgba(236,72,153,0.3)",
                },
              ].map((industry, i) => {
                const images = ["4.png", "5.png", "6.png"];
                return (
                  <div
                    key={i}
                    className={`group relative overflow-hidden rounded-[40px] bg-gradient-to-br ${industry.gradient} p-8 shadow-2xl ring-1 ring-white/10 transition-all duration-700 hover:scale-[1.03] hover:shadow-3xl hover:ring-white/20`}
                  >
                    {/* Decorative background glow on hover */}
                    <div 
                      className="absolute -inset-1 opacity-0 blur-2xl transition-opacity duration-700 group-hover:opacity-40"
                      style={{
                        background: i === 0 
                          ? "linear-gradient(135deg, rgba(59,130,246,0.4), transparent)"
                          : i === 1
                          ? "linear-gradient(135deg, rgba(168,85,247,0.4), transparent)"
                          : "linear-gradient(135deg, rgba(236,72,153,0.4), transparent)",
                      }}
                    ></div>

                    {/* Image Container */}
                    <div className="relative z-10 h-72 w-full overflow-hidden rounded-3xl ring-1 ring-white/10">
                      <Image
                        src={`/images/${images[i]}`}
                        alt={industry.title}
                        fill
                        className="object-contain object-center transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority={i === 0}
                      />
                      {/* Overlay gradient for better visual effect */}
                      <div
                        className="absolute inset-0 rounded-3xl transition-opacity duration-500 group-hover:opacity-30"
                        style={{
                          background: `radial-gradient(circle at center, ${industry.radial.replace(/_/g, " ")})`,
                        }}
                      ></div>
                      {/* Shine effect on hover */}
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full"></div>
                    </div>

                    {/* Content */}
                    <div className="relative z-10 mt-8 space-y-4">
                      <h3 className="text-2xl font-extrabold text-white transition-transform duration-300 group-hover:translate-x-1">
                        {industry.title}
                      </h3>
                      <p className="text-sm leading-relaxed text-slate-200/90">
                        {industry.description}
                      </p>
                    </div>

                    {/* Bottom accent line */}
                    <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary via-purple-500 to-pink-500 transition-all duration-700 group-hover:w-full"></div>
                  </div>
                );
              })}
            </div>

            {/* Call to Action Button */}
            <div className="mt-16 flex justify-center">
              <button className="group relative overflow-hidden rounded-full border-2 border-slate-200 bg-white px-8 py-4 text-sm font-bold text-slate-700 shadow-lg ring-1 ring-slate-200/50 transition-all duration-300 hover:scale-105 hover:border-primary hover:bg-primary hover:text-white hover:shadow-xl hover:shadow-primary/30 hover:ring-primary/50">
                <span className="relative z-10 flex items-center">
                  See all industries
                  <svg
                    className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/90 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              </button>
            </div>
          </div>
        </section>

        {/* Features Detail Section */}
        <section className="relative bg-gradient-to-b from-slate-50 via-white to-slate-50 py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(35,87,255,0.03),transparent_50%)]"></div>
          <div className="relative mx-auto max-w-6xl px-6">
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-[0.4em] text-primary">
                Features
              </p>
              <h2 className="mt-4 text-4xl font-extrabold text-slate-900 lg:text-5xl">
                What makes HissabBook stand out
              </h2>
            </div>
            <div className="mt-16 grid gap-8 lg:grid-cols-2">
              {[
                {
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v18m9-9H3"
                    />
                  ),
                  title: "Issue Employee Wallets",
                  description:
                    "Invite teammates, complete KYC and issue branded UPI wallets in minutes with policy-based permissions.",
                  gradient: "from-primary/20 via-white to-primary/10",
                },
                {
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 10h4l3 8 4-16 3 8h4"
                    />
                  ),
                  title: "Scan & Pay",
                  description:
                    "Employees scan any QR, pay via POS or online while HissabBook enforces category rules and spend limits.",
                  gradient: "from-emerald-100 via-white to-primary/10",
                },
                {
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 7h14M5 12h14M5 17h14"
                    />
                  ),
                  title: "Zoho & Tally Integrations",
                  description:
                    "Sync categories, ledgers, receipts and GST information into your accounting suite automatically.",
                  gradient: "from-amber-100 via-white to-primary/10",
                },
                {
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 12l3 3 7-7"
                    />
                  ),
                  title: "Approvals",
                  description:
                    "Route spends to managers or finance heads with Slack, email or in-app nudges for instant decisions.",
                  gradient: "from-slate-100 via-white to-primary/10",
                },
                {
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 5v14m7-7H5"
                    />
                  ),
                  title: "Set Spend Limits",
                  description:
                    "Configure daily, weekly or monthly budgets, card categories, and automated top-ups per business unit.",
                  gradient: "from-sky-100 via-white to-primary/10",
                },
                {
                  icon: (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v12m6-6H6"
                    />
                  ),
                  title: "Expense Analytics",
                  description:
                    "Drill into spend by cost centre, geography or employee with export-ready reports for leadership.",
                  gradient: "from-primary/15 via-white to-primary/20",
                },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-[40px] bg-white p-10 shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                  <div className="relative flex items-start gap-6">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary transition-transform group-hover:scale-110 group-hover:rotate-3">
                      <svg
                        className="h-8 w-8"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                      >
                        {feature.icon}
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900">
                        {feature.title}
                      </h3>
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">
                        {feature.description}
                      </p>
                      <div
                        className={`mt-6 h-32 w-48 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-60 transition-opacity group-hover:opacity-100`}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-white py-28 lg:py-32">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 right-10 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
            <div className="absolute bottom-20 left-10 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(35,87,255,0.03),transparent_70%)]"></div>
          </div>

          <div className="relative mx-auto max-w-7xl px-6">
            {/* Section Header */}
            <div className="mb-16 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-gradient-to-r from-primary/8 to-primary/4 px-4 py-1.5 mb-4 shadow-sm">
                <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                <p className="text-xs font-bold uppercase tracking-[0.4em] text-primary">
                  Testimonials
                </p>
              </div>
              <h2 className="mt-4 text-4xl font-extrabold leading-tight text-slate-900 lg:text-5xl xl:text-6xl">
                Don&apos;t just take our{" "}
                <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  word for it
                </span>
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-600">
                See what our customers have to say about their experience with HissabBook
              </p>
            </div>

            {/* Testimonials Grid */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  company: "YoloBus",
                  quote:
                    "We manage daily allowances for 300+ drivers across India. HissabBook gives us real-time controls on fuel, tolls and repairs with automated approvals.",
                  author: "Sanjoy Mandal",
                  role: "Founder • Kolkata",
                  bg: "from-slate-900 via-slate-800 to-slate-900",
                  text: "text-white",
                  borderColor: "border-slate-700/50",
                  accent: "from-blue-500/20 to-blue-600/10",
                  initials: "SM",
                },
                {
                  company: "Aava",
                  quote:
                    "Receipt automation and Zoho sync help us close books in record time. Branch managers love the simple mobile experience.",
                  author: "Aarti Agarwal",
                  role: "Finance Lead • Pune",
                  bg: "from-white via-white to-slate-50",
                  text: "text-slate-900",
                  borderColor: "border-slate-200",
                  accent: "from-primary/10 to-primary/5",
                  initials: "AA",
                },
                {
                  company: "Qube",
                  quote:
                    "With card issuance, UPI support and granular controls, reimbursements dropped from 12 days to 48 hours.",
                  author: "Sonia Mehta",
                  role: "Operations • Mumbai",
                  bg: "from-white via-white to-slate-50",
                  text: "text-slate-900",
                  borderColor: "border-slate-200",
                  accent: "from-purple-500/10 to-purple-600/5",
                  initials: "SM",
                },
              ].map((testimonial, i) => (
                <article
                  key={i}
                  className={`group relative overflow-hidden rounded-[40px] border ${testimonial.borderColor} bg-gradient-to-br ${testimonial.bg} p-8 shadow-xl ring-1 ring-white/20 backdrop-blur-sm transition-all duration-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-primary/10 hover:ring-white/40`}
                >
                  {/* Decorative accent gradient */}
                  <div
                    className={`absolute -inset-1 bg-gradient-to-br ${testimonial.accent} opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-100`}
                  ></div>

                  {/* Quote icon */}
                  <div className="relative z-10 mb-6">
                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${testimonial.accent} ${testimonial.text === "text-white" ? "text-blue-300" : "text-primary"} shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                      <svg
                        className="h-6 w-6"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.984zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                      </svg>
                    </div>
                  </div>

                  {/* Company badge */}
                  <div className="relative z-10 mb-6">
                    <span className={`inline-flex items-center rounded-full border ${testimonial.text === "text-white" ? "border-primary/30 bg-primary/10 text-primary" : "border-primary/20 bg-primary/5 text-primary"} px-4 py-1.5 text-xs font-bold uppercase tracking-[0.3em] shadow-sm`}>
                      {testimonial.company}
                    </span>
                  </div>

                  {/* Quote */}
                  <div className="relative z-10 mb-8">
                    <p
                      className={`text-base leading-relaxed ${
                        testimonial.text === "text-white"
                          ? "text-slate-200"
                          : "text-slate-700"
                      }`}
                    >
                      {testimonial.quote}
                    </p>
                  </div>

                  {/* Author info */}
                  <div className="relative z-10 mt-auto flex items-center justify-between border-t pt-6">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${testimonial.accent} ${testimonial.text === "text-white" ? "text-white ring-2 ring-white/20" : "text-slate-700 ring-2 ring-slate-200"} shadow-md transition-transform duration-300 group-hover:scale-110`}>
                        <span className="text-sm font-bold">
                          {testimonial.initials}
                        </span>
                      </div>
                      <div>
                        <p
                          className={`text-sm font-bold ${
                            testimonial.text === "text-white"
                              ? "text-white"
                              : "text-slate-900"
                          }`}
                        >
                          {testimonial.author}
                        </p>
                        <p
                          className={`mt-0.5 text-xs ${
                            testimonial.text === "text-white"
                              ? "text-slate-300"
                              : "text-slate-500"
                          }`}
                        >
                          {testimonial.role}
                        </p>
                      </div>
                    </div>

                    {/* Star rating */}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`h-4 w-4 ${testimonial.text === "text-white" ? "text-amber-400" : "text-amber-500"}`}
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                      ))}
                    </div>
                  </div>

                  {/* Bottom accent line */}
                  <div className={`absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r ${testimonial.text === "text-white" ? "from-blue-500 via-primary to-purple-500" : "from-primary via-purple-500 to-pink-500"} transition-all duration-700 group-hover:w-full`}></div>

                  {/* Decorative corner element */}
                  <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${testimonial.accent} opacity-0 transition-opacity duration-500 group-hover:opacity-30`}></div>
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
                <span className="font-bold text-slate-900">4.8/5</span>
                <span className="text-slate-500">average rating</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-8 w-8 rounded-full border-2 border-white bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg"
                    ></div>
                  ))}
                </div>
                <span className="font-bold text-slate-900">
                  Trusted by 1,500+ businesses
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-24">
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl"></div>
          </div>
          <div className="relative mx-auto flex max-w-5xl flex-col items-center gap-8 rounded-[50px] bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 px-10 py-20 text-center text-white shadow-2xl backdrop-blur-sm ring-1 ring-white/10">
            <span className="rounded-full border border-white/30 bg-white/10 px-6 py-3 text-xs font-bold uppercase tracking-[0.45em] text-primary backdrop-blur-sm">
              Smart Expense Automation
            </span>
            <h2 className="text-4xl font-extrabold lg:text-5xl">
              Experience the best way to manage employee expenses.
            </h2>
            <p className="max-w-2xl text-lg leading-relaxed text-slate-300">
              Issue UPI wallets instantly, route approvals to the right leaders,
              and push reconciled data into accounting with one click.
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="group relative overflow-hidden rounded-full bg-white px-8 py-4 text-sm font-bold text-slate-900 shadow-2xl transition-all hover:scale-105 hover:shadow-white/30"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Book a Demo
                  <svg
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              </button>
              <Link
                href="/login"
                className="rounded-full border-2 border-white/40 bg-white/10 px-8 py-4 text-sm font-bold text-white backdrop-blur-sm transition-all hover:scale-105 hover:border-white/60 hover:bg-white/20"
              >
                Login/Register
              </Link>
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="bg-gradient-to-b from-white to-slate-50 py-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <p className="text-sm font-bold uppercase tracking-[0.4em] text-primary">
              FAQs
            </p>
            <h2 className="mt-4 text-4xl font-extrabold text-slate-900 lg:text-5xl">
              All your questions — answered
            </h2>
            <div className="mt-12 space-y-4 text-left">
              {[
                {
                  question: "How is HissabBook different from corporate cards?",
                  answer:
                    "HissabBook issues UPI wallets with programmable limits, approvals and accounting sync—without hidden card fees or long settlement cycles.",
                },
                {
                  question: "Is there a setup cost or long-term contract?",
                  answer:
                    "No setup charges. Choose monthly or annual billing and pay only for active wallets. Cancel anytime without penalties.",
                },
                {
                  question: "How secure is my money?",
                  answer:
                    "Funds are safeguarded through RBI-regulated partner banks, NPCI certification, encryption at rest and in transit, and granular access controls.",
                },
                {
                  question: "Do employees need another UPI app?",
                  answer:
                    "No. The HissabBook app lets them scan UPI, add receipts, request approvals and track balances in one place.",
                },
                {
                  question: "Can I integrate with Zoho Books or Tally?",
                  answer:
                    "Yes. Native integrations push reconciled expenses, ledgers and attachments to Zoho Books, Tally and other ERPs in real time.",
                },
              ].map((faq, i) => (
                <details
                  key={i}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-lg transition-all hover:shadow-xl"
                >
                  <summary className="flex cursor-pointer items-center justify-between text-base font-bold text-slate-900">
                    {faq.question}
                    <span className="ml-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary transition-all group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed text-slate-600">
                    {faq.answer}
                  </p>
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
                  <h3 className="text-xl font-bold text-slate-900">
                    HissabBook Overview
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Learn how HissabBook transforms expense management for
                    businesses of all sizes.
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

      {/* Download App Modal */}
      {isDownloadModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setIsDownloadModalOpen(false)}
        >
          <div
            className="relative mx-4 w-full max-w-md rounded-2xl bg-white shadow-2xl animate-fade-in-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsDownloadModalOpen(false)}
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

            {/* Modal Content */}
            <div className="p-8 md:p-10">
              <h2 className="mb-2 text-2xl font-bold text-slate-900 text-center">
                Download HissabBook App
              </h2>
              <p className="mb-8 text-center text-sm text-slate-600">
                Choose your platform to download
              </p>

              {/* Download Buttons */}
              <div className="flex flex-col gap-4">
                {/* Google Play Button */}
                <a
                  href={downloadLinks.googlePlayUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex items-center gap-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-4 shadow-xl shadow-slate-900/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-slate-900/40"
                  onClick={(e) => !downloadLinks.googlePlayUrl && e.preventDefault()}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                  <div className="relative flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm transition-transform group-hover:scale-110 group-hover:rotate-3">
                      <svg
                        className="h-7 w-7 text-white"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" />
                      </svg>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-white/70 leading-tight">
                        GET IT ON
                      </span>
                      <span className="text-lg font-extrabold text-white leading-tight">
                        Google Play
                      </span>
                    </div>
                  </div>
                </a>

                {/* App Store Button */}
                <a
                  href={downloadLinks.appStoreUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative flex items-center gap-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-6 py-4 shadow-xl shadow-slate-900/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-slate-900/40"
                  onClick={(e) => !downloadLinks.appStoreUrl && e.preventDefault()}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                  <div className="relative flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm transition-transform group-hover:scale-110 group-hover:-rotate-3">
                      <svg
                        className="h-7 w-7 text-white"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-white/70 leading-tight">
                        Download on the
                      </span>
                      <span className="text-lg font-extrabold text-white leading-tight">
                        App Store
                      </span>
                    </div>
                  </div>
                </a>

                {/* Download APK Button */}
                <a
                  href={downloadLinks.apkDownloadUrl || "#"}
                  download
                  className="group relative flex items-center gap-4 rounded-2xl bg-gradient-to-br from-primary via-primary/95 to-primary px-6 py-4 shadow-xl shadow-primary/40 ring-2 ring-primary/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/50 hover:ring-primary/40"
                  onClick={(e) => !downloadLinks.apkDownloadUrl && e.preventDefault()}
                >
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
                  <div className="relative flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-transform group-hover:scale-110 group-hover:rotate-12">
                      <svg
                        className="h-7 w-7 text-white"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
                        />
                      </svg>
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-white/90 leading-tight">
                        DIRECT DOWNLOAD
                      </span>
                      <span className="text-lg font-extrabold text-white leading-tight">
                        Download APK
                      </span>
                    </div>
                  </div>
                </a>
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
