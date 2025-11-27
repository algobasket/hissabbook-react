"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Footer from "../components/Footer";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || 
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

export default function AboutPage() {
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
  const [isScrolled, setIsScrolled] = useState(false);

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
    value = value.replace(/^(\+91\s)(.*)/, (_, prefix, rest) => {
      return prefix + rest.replace(/\D/g, "").slice(0, 10);
    });
    setFormData({ ...formData, phone: value });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    console.log("Form submitted:", formData);
    
    setTimeout(() => {
      setIsSubmitting(false);
      alert("Thank you! We'll get back to you soon.");
      setIsDemoModalOpen(false);
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
              className="relative transition-colors hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
            >
              Book Keeping
            </Link>
            <Link
              href="/about"
              className="relative font-semibold text-primary transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary"
            >
              About Us
            </Link>
            <Link
              href="/blogs"
              className="relative transition-colors hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
            >
              Blogs
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
        <section className="relative overflow-hidden bg-white py-20 lg:py-28">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
          </div>

          <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-2xl font-black text-primary shadow-lg shadow-primary/20">
              H
            </div>
            <div className="space-y-6">
              <h1 className="text-5xl font-black leading-[1.1] tracking-tight text-slate-900 lg:text-6xl xl:text-7xl">
                Empowering every Indian business with{" "}
                <span className="bg-gradient-to-r from-primary via-primary/90 to-primary bg-clip-text text-transparent">
                  real-time financial control
                </span>
                .
              </h1>
              <p className="mx-auto max-w-3xl text-lg leading-relaxed text-slate-600 lg:text-xl">
                Revolutionising expense management, disbursement, and
                reconciliation with India's first purpose-built UPI wallet
                platform. Built for finance teams, trusted by growth-focused
                businesses.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
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
            </div>
            <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
              <span className="transition-colors hover:text-primary">LangEed</span>
              <span className="transition-colors hover:text-primary">Mopra</span>
              <span className="transition-colors hover:text-primary">Gpay</span>
              <span className="transition-colors hover:text-primary">Swish</span>
              <span className="transition-colors hover:text-primary">Amplus</span>
              <span className="transition-colors hover:text-primary">TDK</span>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 py-24">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
          <div className="relative mx-auto max-w-4xl space-y-8 px-6 text-center">
            <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-900 lg:text-4xl xl:text-5xl">
              Our Vision: Modernizing India's Business Finance
            </h2>
            <div className="space-y-6 text-lg leading-relaxed text-slate-600 lg:text-xl">
              <p>
                At HissabBook, we're re-imagining how Indian businesses manage
                spending—from fleet logistics to retail operations and service
                enterprises. Our platform unifies UPI wallets, policies,
                automations and accounting sync so finance leaders can focus on
                growth, not paperwork.
              </p>
              <p>
                We believe every business deserves transparent, compliant, and
                easily scalable finance controls. With HissabBook, organisations
                of all sizes can issue wallets instantly, route approvals, set
                category policies and reconcile expenses in real time.
              </p>
            </div>
          </div>
        </section>

        {/* What We Do Section */}
        <section className="relative overflow-hidden bg-white py-24">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
            <div className="absolute bottom-1/4 left-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
          </div>

          <div className="relative mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h2 className="text-4xl font-black leading-tight tracking-tight text-slate-900 lg:text-5xl xl:text-6xl">
                What We Do
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600 lg:text-xl">
                Purpose-built UPI wallet platform for employee and vendor
                expense management.
              </p>
            </div>
            <div className="mt-16 grid gap-8 lg:grid-cols-2">
              {[
                {
                  title: "Instant Disbursements",
                  description:
                    "Disburse UPI wallets to staff instantly—eliminating reliance on corporate cards or cash allowances.",
                  gradient: "from-primary/15 via-white to-primary/25",
                },
                {
                  title: "Real-time Control",
                  description:
                    "Set real-time spend limits, category controls, and approval flows for every transaction.",
                  gradient: "from-sky-100 via-white to-primary/20",
                },
                {
                  title: "Intelligent Dashboards",
                  description:
                    "Track every rupee spent with intelligent dashboards and finance-first analytics.",
                  gradient: "from-emerald-100 via-white to-primary/20",
                },
                {
                  title: "Accounting Integrations",
                  description:
                    "Automate reconciliations with native integrations to Zoho Books, Tally, QuickBooks and more.",
                  gradient: "from-amber-100 via-white to-primary/20",
                },
              ].map((feature, i) => (
                <article
                  key={i}
                  className="group relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-lg shadow-slate-900/5 transition-all hover:scale-105 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10"
                >
                  {/* Decorative background gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                  ></div>

                  <div className="relative space-y-6">
                    <h3 className="text-xl font-bold leading-tight text-slate-900 lg:text-2xl">
                      {feature.title}
                    </h3>
                    <p className="text-base leading-relaxed text-slate-600 lg:text-lg">
                      {feature.description}
                    </p>
                    <div
                      className={`relative h-32 w-44 overflow-hidden rounded-3xl bg-gradient-to-br ${feature.gradient} shadow-inner transition-transform duration-500 group-hover:scale-105`}
                    ></div>
                  </div>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary via-primary/80 to-primary transition-all duration-700 group-hover:w-full"></div>
                </article>
              ))}
            </div>
            <p className="mt-12 text-center text-base leading-relaxed text-slate-600 lg:text-lg">
              Reinventing finance operations with no hidden fees, no MDR
              shocks, and zero merchant limitations.
            </p>
          </div>
        </section>

        {/* Mission Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-100/80 via-white to-slate-100/80 py-24">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5"></div>
          <div className="relative mx-auto max-w-5xl space-y-8 px-6 text-center">
            <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-900 lg:text-4xl xl:text-5xl">
              Our Mission: Powering India's Business Growth
            </h2>
            <p className="text-lg leading-relaxed text-slate-600 lg:text-xl">
              We exist to empower growing businesses—from startups to
              field-heavy enterprises—to manage expenses without friction. With
              HissabBook, finance leaders get the visibility, speed and security
              required to scale.
            </p>
          </div>
        </section>

        {/* Who We Are Section */}
        <section className="relative overflow-hidden bg-white py-24">
          <div className="relative mx-auto max-w-5xl px-6">
            <div className="group relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50 p-10 text-center shadow-lg shadow-slate-900/5 transition-all hover:scale-105 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10">
              {/* Decorative background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>

              <div className="relative space-y-6">
                <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-900 lg:text-4xl xl:text-5xl">
                  Who We Are
                </h2>
                <p className="mx-auto max-w-3xl text-lg leading-relaxed text-slate-600 lg:text-xl">
                  We are technologists, finance operators and product thinkers
                  backed by India's leading investors. From launching UPI-first
                  experiences to integrating with core accounting systems, we're
                  passionate about building tools that support companies thriving
                  on the ground—not just in boardrooms.
                </p>
              </div>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary via-primary/80 to-primary transition-all duration-700 group-hover:w-full"></div>
            </div>
          </div>
        </section>

        {/* In The News Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 py-24">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
          </div>

          <div className="relative mx-auto max-w-6xl px-6">
            <div className="text-center">
              <h2 className="text-4xl font-black leading-tight tracking-tight text-slate-900 lg:text-5xl xl:text-6xl">
                In The News
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600 lg:text-xl">
                What leading publications are saying about HissabBook.
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {[
                {
                  publication: "The Economic Times",
                  title:
                    "HissabBook raises $2.3M in seed round to modernise corporate UPI wallets.",
                },
                {
                  publication: "Business Standard",
                  title:
                    "HissabBook closes $3.2M seed round led by JAM Fund and Better Tomorrow Ventures.",
                },
                {
                  publication: "VC Circle",
                  title:
                    "SME-focused HissabBook secures funding to expand UPI wallet operations.",
                },
              ].map((news, i) => (
                <article
                  key={i}
                  className="group relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-6 shadow-lg shadow-slate-900/5 transition-all hover:scale-105 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10"
                >
                  {/* Decorative background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>

                  <div className="relative space-y-6">
                    <div className="h-32 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 shadow-inner transition-transform duration-500 group-hover:scale-105"></div>
                    <div className="space-y-3">
                      <p className="text-lg font-bold leading-tight text-slate-900 lg:text-xl">
                        {news.publication}
                      </p>
                      <p className="text-base leading-relaxed text-slate-600 lg:text-lg">
                        {news.title}
                      </p>
                      <a
                        href="#"
                        className="inline-block text-sm font-bold text-primary transition-colors hover:text-primary/80"
                      >
                        Read more →
                      </a>
                    </div>
                  </div>

                  {/* Bottom accent line */}
                  <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary via-primary/80 to-primary transition-all duration-700 group-hover:w-full"></div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Backed By Section */}
        <section className="relative overflow-hidden bg-white py-24">
          <div className="relative mx-auto max-w-5xl px-6">
            <div className="text-center">
              <span className="inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.35em] text-primary shadow-lg shadow-primary/10 backdrop-blur-sm">
                Backed by Industry Leaders
              </span>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {["Y Combinator", "JAM Fund", "Better Tomorrow Ventures"].map(
                (investor, i) => (
                  <div
                    key={i}
                    className="group relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-50 px-6 py-8 text-center text-lg font-bold text-slate-900 shadow-lg shadow-slate-900/5 transition-all hover:scale-105 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 lg:text-xl"
                  >
                    {/* Decorative background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
                    <span className="relative">{investor}</span>
                    {/* Bottom accent line */}
                    <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary via-primary/80 to-primary transition-all duration-700 group-hover:w-full"></div>
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative overflow-hidden py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="relative mx-auto max-w-5xl rounded-[40px] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12)_0%,rgba(15,23,42,0.95)_70%)] px-10 py-16 text-center text-white shadow-[0_40px_90px_rgba(12,20,38,0.5)]">
            <h2 className="text-4xl font-black leading-tight tracking-tight text-white lg:text-5xl xl:text-6xl">
              Experience the best way to manage employee expenses.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/90 lg:text-xl">
              The complete solution for managing employee spends with smart UPI
              wallets designed for finance-first teams.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="group relative overflow-hidden rounded-full bg-white px-8 py-4 text-base font-bold text-slate-900 shadow-2xl shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-3xl hover:shadow-black/30 hover:scale-105"
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
                <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              </button>
              <Link
                href="/login"
                className="group relative overflow-hidden rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/50 hover:bg-white/20 hover:shadow-xl hover:shadow-white/20 hover:scale-105"
              >
                <span className="relative z-10">Login/Register</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              </Link>
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
                    HissabBook Overview
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-slate-600 lg:text-lg">
                    Learn how HissabBook empowers Indian businesses with
                    real-time financial control.
                  </p>
                </div>
                <div className="hidden items-center gap-2 md:flex">
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
                  <span className="text-sm font-bold text-slate-500">4.8/5</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Request Modal */}
      {isDemoModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setIsDemoModalOpen(false)}
        >
          <div
            className="relative mx-4 w-full max-w-2xl animate-fade-in-up rounded-2xl bg-white shadow-2xl ring-1 ring-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsDemoModalOpen(false)}
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

            {/* Form */}
            <div className="rounded-2xl bg-white p-8">
              <h2 className="text-3xl font-black leading-tight tracking-tight text-slate-900 lg:text-4xl">
                Book a Demo
              </h2>
              <p className="mt-3 text-base leading-relaxed text-slate-600 lg:text-lg">
                Fill out the form below and we'll get back to you soon.
              </p>
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-bold text-slate-900"
                    >
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      required
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className="mt-2 w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-bold text-slate-900"
                    >
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      required
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      className="mt-2 w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="workEmail"
                    className="block text-sm font-bold text-slate-900"
                  >
                    Work Email *
                  </label>
                  <input
                    type="email"
                    id="workEmail"
                    required
                    value={formData.workEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, workEmail: e.target.value })
                    }
                    className="mt-2 w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="john@company.com"
                  />
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="companyName"
                      className="block text-sm font-bold text-slate-900"
                    >
                      Company Name *
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      required
                      value={formData.companyName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          companyName: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="Company Name"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="companyGstin"
                      className="block text-sm font-bold text-slate-900"
                    >
                      Company GSTIN
                    </label>
                    <input
                      type="text"
                      id="companyGstin"
                      value={formData.companyGstin}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          companyGstin: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="GSTIN (Optional)"
                    />
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="numberOfEmployees"
                      className="block text-sm font-bold text-slate-900"
                    >
                      Number of Employees *
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
                      className="mt-2 w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select</option>
                      <option value="1-10">1-10</option>
                      <option value="11-50">11-50</option>
                      <option value="51-200">51-200</option>
                      <option value="201-500">201-500</option>
                      <option value="500+">500+</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="referralSource"
                      className="block text-sm font-bold text-slate-900"
                    >
                      How did you hear about us?
                    </label>
                    <select
                      id="referralSource"
                      value={formData.referralSource}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          referralSource: e.target.value,
                        })
                      }
                      className="mt-2 w-full rounded-lg border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select</option>
                      <option value="Google">Google</option>
                      <option value="Social Media">Social Media</option>
                      <option value="Referral">Referral</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-gradient-to-r from-primary via-primary/95 to-primary px-8 py-4 text-base font-bold text-white shadow-[0_20px_50px_rgba(35,87,255,0.4)] transition-all duration-300 hover:shadow-[0_25px_60px_rgba(35,87,255,0.5)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}







