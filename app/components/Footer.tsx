import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-slate-200/50 bg-gradient-to-b from-white via-slate-50/30 to-white">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-primary/3 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-primary/3 blur-3xl"></div>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-20">
        {/* Main Footer Content */}
        <div className="grid gap-12 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Company Information */}
          <div className="space-y-6">
            {/* Logo and Name */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary shadow-lg shadow-primary/20 ring-2 ring-primary/10 transition-transform hover:scale-110">
                <span className="text-xl font-extrabold text-white">H</span>
              </div>
              <span className="text-2xl font-extrabold text-slate-900">
                HissabBook
              </span>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <p className="text-sm font-semibold leading-relaxed text-slate-700">
                HissabBook Enterprises Private Limited
              </p>
              <p className="text-sm leading-relaxed text-slate-600">
                2nd Floor, Wave Silver Tower,
                <br />
                Sector 18,
                <br />
                Dubai – 11551, UAE
              </p>
            </div>

            {/* Social Media Links */}
            <div className="flex items-center gap-3">
              {[
                { icon: "in", label: "LinkedIn", href: "#" },
                { icon: "x", label: "Twitter/X", href: "#" },
                { icon: "@", label: "Email", href: "#" },
                { icon: "yt", label: "YouTube", href: "#" },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  aria-label={social.label}
                  className="group flex h-11 w-11 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-xs font-bold text-slate-600 shadow-sm transition-all hover:scale-110 hover:border-primary hover:bg-primary hover:text-white hover:shadow-md hover:shadow-primary/20"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
              Company
            </h4>
            <ul className="space-y-4">
              {[
                { href: "/pricing", label: "Pricing" },
                { href: "/customers", label: "Customers" },
                { href: "/book-keeping", label: "Book Keeping" },
                { href: "/contact", label: "Contact Us" },
              ].map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="group text-sm font-medium text-slate-700 transition-all hover:text-primary"
                  >
                    <span className="relative inline-block">
                      {link.label}
                      <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary transition-all group-hover:w-full"></span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
              Resources
            </h4>
            <ul className="space-y-4">
              {[
                { href: "/business-guide", label: "Business Guide" },
                { href: "/expense-stories", label: "Expense Stories" },
                { href: "/blogs", label: "Blogs" },
                { href: "/upi-limits", label: "UPI Limits" },
              ].map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="group text-sm font-medium text-slate-700 transition-all hover:text-primary"
                  >
                    <span className="relative inline-block">
                      {link.label}
                      <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary transition-all group-hover:w-full"></span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
              Legal
            </h4>
            <ul className="space-y-4">
              {[
                { href: "/privacy-policy", label: "Privacy Policy" },
                {
                  href: "/anti-bribery-policy",
                  label: "Anti-bribery Policy",
                },
                {
                  href: "/terms-conditions",
                  label: "Terms & Conditions",
                },
                { href: "/refund-policy", label: "Refund Policy" },
              ].map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="group text-sm font-medium text-slate-700 transition-all hover:text-primary"
                  >
                    <span className="relative inline-block">
                      {link.label}
                      <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary transition-all group-hover:w-full"></span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 flex flex-col gap-6 border-t border-slate-200/60 pt-8 md:flex-row md:items-center md:justify-between">
          {/* Copyright */}
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-slate-700">
              © 2025 HissabBook. All rights reserved. <br />
              Build, Develop & Maintain By Algobasket
            </p>
          </div>

          {/* App Download Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button className="group relative flex items-center gap-3 rounded-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-5 py-3 shadow-lg shadow-slate-900/20 transition-all hover:scale-105 hover:shadow-xl hover:shadow-slate-900/30">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="relative flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                  <svg
                    className="h-5 w-5 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.53 12.9 20.18 13.18L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-white">Get it on Play Store</span>
              </div>
            </button>

            <button className="group relative flex items-center gap-3 rounded-full border-2 border-slate-300 bg-white px-5 py-3 shadow-lg transition-all hover:scale-105 hover:border-primary hover:shadow-xl hover:shadow-primary/10">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
              <div className="relative flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 transition-colors group-hover:bg-primary/10">
                  <svg
                    className="h-5 w-5 text-slate-700 transition-colors group-hover:text-primary"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-slate-700 transition-colors group-hover:text-primary">
                  Download on App Store
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}







