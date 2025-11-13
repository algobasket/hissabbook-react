import type { Metadata } from "next";
import AppShell from "../components/AppShell";
import RequestPayoutForm from "../components/RequestPayoutForm";

export const metadata: Metadata = {
  title: "HissabBook | Request Payout",
  description: "Submit payout proof and reference details.",
};

export default function RequestPayoutPage() {
  return (
    <AppShell activePath="/request-payout">
      <section className="max-w-3xl rounded-3xl border border-white/70 bg-white p-8 shadow-md">
        <h2 className="text-xl font-semibold text-[#1f2937]">Request payout</h2>
        <p className="mt-2 text-sm text-slate-500">
          Provide the transaction details to record a payout request.
        </p>
        <RequestPayoutForm />
      </section>
    </AppShell>
  );
}
