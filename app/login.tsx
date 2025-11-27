/* eslint-disable react/no-array-index-key */
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import OTPLoginForm from "./components/OTPLoginForm";
import EmailPasswordLoginForm from "./components/EmailPasswordLoginForm";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, "") || 
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "/backend");

const slides = [
  {
    title: "Understand your business health",
    description:
      "Download weekly or monthly reports on your business expenses and cash flow in PDF & Excel formats.",
    accent: "#2357FF",
    image: "/images/1.png",
  },
  {
    title: "Track every rupee with ease",
    description:
      "Keep receipts, payouts, and cashbooks organised in one secure place. Stay audit ready 24/7.",
    accent: "#00B8A9",
    image: "/images/2.png",
  },
  {
    title: "Collaborate with your entire team",
    description:
      "Invite accountants, partners, and vendors with role-based access so everyone stays aligned in real time.",
    accent: "#8B5CF6",
    image: "/images/3.png",
  },
];

export default function LoginPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loginMethod, setLoginMethod] = useState<"otp" | "email">("otp");
  const [smallLogoUrl, setSmallLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(timer);
  }, []);

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

  const slide = useMemo(() => slides[currentSlide], [currentSlide]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <section className="flex w-full flex-1 flex-col bg-[#edf1ff] px-8 pb-12 pt-10 lg:w-1/2 lg:px-16 lg:pb-16 lg:pt-14">
          <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-105">
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
            <div className={`logo-fallback flex items-center gap-3 ${smallLogoUrl ? 'hidden' : ''}`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-lg font-bold text-[#2357FF] shadow-sm">
                C
              </span>
              <span className="text-xl font-semibold text-[#2357FF]">
                HissabBook
              </span>
            </div>
          </Link>

          <div className="flex flex-1 flex-col items-center justify-center gap-10 pt-10 lg:pt-0">
            <div className="relative w-full max-w-md overflow-hidden rounded-[40px] shadow-[0_35px_90px_rgba(35,87,255,0.18)]">
              <Image
                src={slide.image}
                alt={slide.title}
                width={512}
                height={640}
                priority
                className="h-full w-full rounded-[40px] object-contain bg-transparent"
              />
              <div className="pointer-events-none absolute inset-0 rounded-[40px] border border-white/40" />
            </div>

            <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
              <div className="space-y-3">
                <span
                  className="inline-flex items-center rounded-full bg-white/80 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-[#2357FF]"
                  style={{ color: slide.accent }}
                >
                  Feature Highlight
                </span>
                <h2 className="text-3xl font-semibold text-[#0F172A] transition-all duration-500">
                  {slide.title}
                </h2>
                <p className="text-base text-slate-600 transition-opacity duration-500">
                  {slide.description}
                </p>
              </div>

              <div className="flex flex-col items-center gap-6">
                <div className="flex items-center gap-3">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => goToSlide(index)}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        currentSlide === index
                          ? "w-10 bg-[#2357FF]"
                          : "w-2.5 bg-slate-300 hover:bg-slate-400"
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-sm transition hover:border-[#2357FF] hover:text-[#2357FF]"
                    type="button"
                    aria-label="Previous slide"
                    onClick={() =>
                      setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
                    }
                  >
                    <span className="text-lg font-semibold">‹</span>
                  </button>
                  <button
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-sm transition hover:border-[#2357FF] hover:text-[#2357FF]"
                    type="button"
                    aria-label="Next slide"
                    onClick={goToNext}
                  >
                    <span className="text-lg font-semibold">›</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center px-6 py-10 lg:px-24 lg:py-16">
          <div className="w-full max-w-sm space-y-8">
            <div className="space-y-2 text-center">
              {smallLogoUrl ? (
                <Link href="/" className="flex justify-center mb-4 transition-transform hover:scale-105">
                  <img
                    src={smallLogoUrl}
                    alt="HissabBook"
                    className="h-[68px] w-auto object-contain cursor-pointer"
                    onError={(e) => {
                      // Fallback to default text if image fails to load
                      e.currentTarget.style.display = 'none';
                      const parent = e.currentTarget.parentElement?.parentElement;
                      if (parent) {
                        const fallback = parent.querySelector('.welcome-fallback');
                        if (fallback) fallback.classList.remove('hidden');
                      }
                    }}
                  />
                </Link>
              ) : null}
              <div className={`welcome-fallback ${smallLogoUrl ? 'hidden' : ''}`}>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Welcome to HissabBook <span className="inline-block">👋</span>
                </h1>
              </div>
              <p className="text-sm text-slate-500">
                Login/Register to HissabBook
              </p>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
              {loginMethod === "otp" ? (
                <OTPLoginForm onSwitchToEmail={() => setLoginMethod("email")} />
              ) : (
                <EmailPasswordLoginForm onSwitchToOtp={() => setLoginMethod("otp")} />
              )}
            </div>

            <p className="text-center text-xs text-slate-500">
              To know more about HissabBook please visit{" "}
              <Link className="font-semibold text-[#2357FF] hover:underline" href="#">
                HissabBook.in
              </Link>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

