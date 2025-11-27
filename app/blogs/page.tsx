"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Footer from "../components/Footer";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || 
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

export default function BlogsPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
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

  const categories = ["All", "Finance", "Technology", "Business", "Updates", "Tips"];
  
  const blogPosts = [
    {
      id: 1,
      title: "How UPI Wallets are Transforming Business Expense Management",
      excerpt: "Discover how modern businesses are leveraging UPI wallets to streamline expense management and improve financial control.",
      category: "Finance",
      author: "HissabBook Team",
      date: "March 15, 2025",
      readTime: "5 min read",
      image: "/images/blog-1.jpg",
    },
    {
      id: 2,
      title: "The Future of Digital Payments in India",
      excerpt: "Exploring the rapid growth of digital payment solutions and how they're reshaping the business landscape in India.",
      category: "Technology",
      author: "HissabBook Team",
      date: "March 10, 2025",
      readTime: "7 min read",
      image: "/images/blog-2.jpg",
    },
    {
      id: 3,
      title: "5 Ways to Improve Your Business Cash Flow Management",
      excerpt: "Learn practical strategies to optimize cash flow and gain better visibility into your business finances.",
      category: "Business",
      author: "HissabBook Team",
      date: "March 5, 2025",
      readTime: "6 min read",
      image: "/images/blog-3.jpg",
    },
    {
      id: 4,
      title: "Introducing New Features: Real-time Analytics Dashboard",
      excerpt: "We're excited to announce our new analytics dashboard that provides real-time insights into your business expenses.",
      category: "Updates",
      author: "HissabBook Team",
      date: "February 28, 2025",
      readTime: "4 min read",
      image: "/images/blog-4.jpg",
    },
    {
      id: 5,
      title: "Best Practices for Employee Expense Reimbursement",
      excerpt: "Streamline your reimbursement process with these proven tips and best practices for managing employee expenses.",
      category: "Tips",
      author: "HissabBook Team",
      date: "February 20, 2025",
      readTime: "5 min read",
      image: "/images/blog-5.jpg",
    },
    {
      id: 6,
      title: "Understanding UPI Transaction Limits and Compliance",
      excerpt: "A comprehensive guide to UPI transaction limits, compliance requirements, and how to stay within regulatory guidelines.",
      category: "Finance",
      author: "HissabBook Team",
      date: "February 15, 2025",
      readTime: "8 min read",
      image: "/images/blog-6.jpg",
    },
  ];

  const filteredPosts =
    selectedCategory === "All"
      ? blogPosts
      : blogPosts.filter((post) => post.category === selectedCategory);

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
              className="relative transition-colors hover:text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all hover:after:w-full"
            >
              About Us
            </Link>
            <Link
              href="/blogs"
              className="relative font-semibold text-primary transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary"
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

          <div className="relative mx-auto max-w-6xl px-6 text-center">
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
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
              Blog
            </span>
            <h1 className="mt-6 text-5xl font-black leading-[1.1] tracking-tight text-slate-900 lg:text-6xl xl:text-7xl">
              <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                Insights & Updates
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600 lg:text-xl">
              Stay informed with the latest news, tips, and insights on business
              finance, expense management, and digital payments.
            </p>
          </div>
        </section>

        {/* Category Filter */}
        <section className="border-b border-slate-200 bg-white py-6">
          <div className="mx-auto max-w-6xl px-6">
            <div className="flex flex-wrap items-center justify-center gap-3">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full px-5 py-2 text-sm font-bold transition-all duration-300 ${
                    selectedCategory === category
                      ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-lg shadow-primary/20"
                      : "border-2 border-slate-200 bg-white text-slate-700 hover:border-primary hover:bg-primary/5 hover:text-primary"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50 py-24">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
            <div className="absolute bottom-1/4 left-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl"></div>
          </div>

          <div className="relative mx-auto max-w-6xl px-6">
            {filteredPosts.length > 0 ? (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {filteredPosts.map((post) => (
                  <article
                    key={post.id}
                    className="group relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-white shadow-lg shadow-slate-900/5 transition-all hover:scale-105 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10"
                  >
                    {/* Decorative background gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>

                    {/* Blog Image */}
                    <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                          className="h-16 w-16 text-slate-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Blog Content */}
                    <div className="relative p-6 space-y-4">
                      {/* Category Badge */}
                      <span className="inline-flex items-center rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                        {post.category}
                      </span>

                      {/* Title */}
                      <h3 className="text-xl font-bold leading-tight text-slate-900 transition-colors group-hover:text-primary lg:text-2xl">
                        {post.title}
                      </h3>

                      {/* Excerpt */}
                      <p className="text-base leading-relaxed text-slate-600 lg:text-lg">
                        {post.excerpt}
                      </p>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 pt-2 text-sm text-slate-500">
                        <span className="font-medium">{post.author}</span>
                        <span>•</span>
                        <span>{post.date}</span>
                        <span>•</span>
                        <span>{post.readTime}</span>
                      </div>

                      {/* Read More Link */}
                      <Link
                        href={`/blogs/${post.id}`}
                        className="inline-flex items-center gap-2 text-sm font-bold text-primary transition-all hover:gap-3"
                      >
                        Read more
                        <svg
                          className="h-4 w-4 transition-transform group-hover:translate-x-1"
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
                      </Link>
                    </div>

                    {/* Bottom accent line */}
                    <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary via-primary/80 to-primary transition-all duration-700 group-hover:w-full"></div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-lg text-slate-600">
                  No blog posts found in this category.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Newsletter CTA Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary py-24">
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-white/10 blur-3xl"></div>
          </div>

          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-4xl font-black leading-tight tracking-tight text-white lg:text-5xl xl:text-6xl">
              Stay Updated
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-white/90 lg:text-xl">
              Subscribe to our newsletter to get the latest insights and updates
              delivered to your inbox.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="rounded-full border-2 border-white/30 bg-white/10 px-6 py-4 text-base text-white placeholder-white/70 backdrop-blur-sm transition-all focus:border-white/50 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 lg:w-80"
              />
              <button className="rounded-full bg-white px-8 py-4 text-base font-bold text-primary shadow-2xl shadow-black/20 transition-all hover:-translate-y-0.5 hover:shadow-3xl hover:shadow-black/30 hover:scale-105">
                Subscribe
              </button>
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
            <div className="rounded-b-2xl bg-gradient-to-b from-white to-slate-50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold leading-tight text-slate-900 lg:text-2xl">
                    HissabBook Overview
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-slate-600 lg:text-lg">
                    Learn how HissabBook empowers Indian businesses.
                  </p>
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

