import type { Metadata } from "next";
import AppShell from "../components/AppShell";

export const metadata: Metadata = {
  title: "HissabBook | Settings",
  description: "Configure account security and notification controls.",
};

export default function SettingsPage() {
  return (
    <AppShell activePath="/settings">
      <section className="max-w-2xl space-y-6">
        <div className="rounded-3xl border border-white/70 bg-white p-8 shadow-md">
          <h2 className="text-xl font-semibold text-[#1f2937]">Security</h2>
          <p className="mt-2 text-sm text-slate-500">Manage sign-in, authentication, and access control.</p>
          <div className="mt-6 space-y-4 text-sm text-slate-600">
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-[#f8faff] px-4 py-3">
              <span>Two-factor authentication</span>
              <input type="checkbox" defaultChecked className="h-5 w-5 cursor-pointer accent-[#2f4bff]" />
            </label>
            <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-[#f8faff] px-4 py-3">
              <span>Login alerts</span>
              <input type="checkbox" defaultChecked className="h-5 w-5 cursor-pointer accent-[#2f4bff]" />
            </label>
          </div>
        </div>
        <div className="rounded-3xl border border-white/70 bg-white p-8 shadow-md">
          <h2 className="text-xl font-semibold text-[#1f2937]">Notifications</h2>
          <p className="mt-2 text-sm text-slate-500">Choose how you’d like to hear about wallet activity.</p>
          <div className="mt-6 grid gap-4 text-sm text-slate-600">
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#2f4bff]" />
              Email notifications
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="h-4 w-4 accent-[#2f4bff]" />
              SMS notifications
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-[#2f4bff]" />
              Push notifications
            </label>
          </div>
        </div>
      </section>
    </AppShell>
  );
}


