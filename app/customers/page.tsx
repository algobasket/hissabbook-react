"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Footer from "../components/Footer";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || 
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

export default function CustomersPage() {
  const [selectedFilter, setSelectedFilter] = useState("All");
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

  const filters = [
    "All",
    "Solar EPC",
    "Travel",
    "Manufacturing",
    "Retail",
    "D2C",
    "Education",
  ];

  const customerStories = [
    {
      category: "D2C",
      title: "How Deconstruct transformed reimbursements with HissabBook UPI wallets.",
    },
    {
      category: "Logistics",
      title: "Floating Walls saved late reimbursements with HissabBook wallets.",
    },
    {
      category: "Manufacturing",
      title: "The Rejold Group transforms team expenses with UPI wallets.",
    },
    {
      category: "Travel",
      title: "YoloBus puts the brakes on cash chaos with HissabBook UPI wallets.",
    },
    {
      category: "Travel",
      title: "How Zingbus keeps every rupee on track with HissabBook wallets.",
    },
    {
      category: "Solar EPC",
      title: "Heaven Solar scales faster with streamlined corporate wallets.",
    },
  ];

  const features = [
    {
      title: "Universal Acceptance",
      description: "Employees pay anyone on UPI—individuals and merchants.",
    },
    {
      title: "Secure & Certified",
      description: "NPCI certified, RBI-regulated partner bank custody, bank-grade encryption.",
    },
    {
      title: "Stop Cash Leakage",
      description: "Fund needs just-in-time and track every rupee in real time.",
    },
    {
      title: "Real-time Visibility",
      description: "Monitor spends across cities with a single dashboard.",
    },
    {
      title: "Zero Fuel Surcharge",
      description: "Avoid card surcharges by paying with UPI.",
    },
    {
      title: "Live Controls",
      description: "Set limits instantly and control access with policies.",
    },
    {
      title: "Save Time",
      description: "Close books faster with one-click sync to Zoho Books & Tally.",
    },
    {
      title: "Book a Demo",
      description: "Experience the best way to manage employee expenses.",
    },
  ];

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
              className="text-primary transition-colors hover:text-primary"
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
        {/* Hero Section */}
        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-3 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-primary">
                Customer Stories
              </span>
              <h1 className="text-4xl font-bold leading-tight text-slate-900 lg:text-[42px]">
                UPI Wallets trusted by{" "}
                <span className="text-primary">1,500+ businesses</span>.
              </h1>
              <p className="max-w-xl text-base text-slate-500">
                Discover how fast-growing Indian businesses manage corporate
                spends with HissabBook's UPI wallet platform.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setIsDemoModalOpen(true)}
                  className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-[0_20px_45px_rgba(35,87,255,0.3)] transition hover:-translate-y-0.5"
                >
                  Book a Demo
                </button>
                <button
                  onClick={() => setIsVideoModalOpen(true)}
                  className="rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:border-primary hover:text-primary"
                >
                  Watch Video
                </button>
              </div>
            </div>
            <div className="rounded-[32px] border border-slate-100 bg-slate-50 p-8 shadow-card">
              <h2 className="text-lg font-semibold text-slate-900">
                Featured Customers
              </h2>
              <div className="mt-6 grid gap-4 text-sm font-semibold text-slate-500 md:grid-cols-2">
                {[
                  "YoloBus",
                  "Swish",
                  "Mapro",
                  "Obus",
                  "Opus",
                  "Better Tomorrow",
                ].map((customer, i) => (
                  <span
                    key={i}
                    className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-center shadow-sm"
                  >
                    {customer}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Industries We Serve Section */}
        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">
              Industries We Serve
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">
              From startups to enterprises and everyone in between.
            </h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-6xl gap-6 px-6 md:grid-cols-3">
            <div className="group relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-card transition-transform hover:scale-[1.02]">
              <div className="h-56 rounded-3xl bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15)_0%,_rgba(15,23,42,0.8)_70%)] transition duration-500"></div>
              <div className="mt-6 space-y-2 text-white">
                <h3 className="text-lg font-semibold">
                  Travel & Transportation
                </h3>
                <p className="text-sm text-slate-300">
                  Control driver allowances and fleet spends with real-time
                  approvals.
                </p>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-[32px] bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 p-6 shadow-card transition-transform hover:scale-[1.02]">
              <div className="h-56 rounded-3xl bg-[radial-gradient(circle_at_top,_rgba(129,140,248,0.3)_0%,_rgba(15,23,42,0.85)_70%)] transition duration-500"></div>
              <div className="mt-6 space-y-2 text-white">
                <h3 className="text-lg font-semibold">Academic Institutes</h3>
                <p className="text-sm text-slate-300">
                  Digitise cash reimbursements for campuses, staff and vendors.
                </p>
              </div>
            </div>
            <div className="group relative overflow-hidden rounded-[32px] bg-gradient-to-br from-purple-900 via-slate-900 to-slate-900 p-6 shadow-card transition-transform hover:scale-[1.02]">
              <div className="h-56 rounded-3xl bg-[radial-gradient(circle_at_top,_rgba(196,181,253,0.35)_0%,_rgba(15,23,42,0.85)_70%)] transition duration-500"></div>
              <div className="mt-6 space-y-2 text-white">
                <h3 className="text-lg font-semibold">Healthcare</h3>
                <p className="text-sm text-slate-300">
                  Manage pharmacy spends, field operations and patient logistics.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Stories Section */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-3xl font-bold text-slate-900">
                Customer Stories
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`rounded-full px-4 py-2 transition ${
                      selectedFilter === filter
                        ? "bg-primary text-white"
                        : "border border-slate-200 hover:border-primary hover:text-primary"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {customerStories.map((story, i) => (
                <article
                  key={i}
                  className="rounded-[32px] border border-slate-100 bg-slate-50 p-5 shadow-card transition-transform hover:scale-[1.02]"
                >
                  <div className="h-36 rounded-2xl bg-slate-200"></div>
                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
                      {story.category}
                    </span>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {story.title}
                    </h3>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-slate-50 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-6 md:grid-cols-3">
              {features.map((feature, i) => (
                <article
                  key={i}
                  className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-card transition-transform hover:scale-[1.02]"
                >
                  <h3 className="text-lg font-semibold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm text-slate-500">
                    {feature.description}
                  </p>
                </article>
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

