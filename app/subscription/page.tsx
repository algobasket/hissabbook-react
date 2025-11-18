"use client";

import AppShell from "../components/AppShell";
import ProtectedRoute from "../components/ProtectedRoute";

export default function SubscriptionPage() {
  return (
    <ProtectedRoute>
      <AppShell activePath="/subscription">
        <section className="max-w-2xl space-y-6">
          <div className="rounded-3xl border border-white/70 bg-white p-8 shadow-md">
            <h2 className="text-xl font-semibold text-[#1f2937]">Subscription</h2>
            <p className="mt-2 text-sm text-slate-500">Manage your subscription plan and billing information.</p>
            <div className="mt-6 space-y-4">
              <p className="text-sm text-slate-600">Subscription management features coming soon...</p>
            </div>
          </div>
        </section>
      </AppShell>
    </ProtectedRoute>
  );
}

