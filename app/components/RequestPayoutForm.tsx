"use client";

import { useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "";

type StatusState =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("Unable to read file")); 
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function RequestPayoutForm() {
  const [amount, setAmount] = useState<string>("");
  const [utr, setUtr] = useState<string>("");
  const [remarks, setRemarks] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<StatusState>({ type: "idle" });

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!amount || Number(amount) <= 0) {
      setStatus({ type: "error", message: "Enter a valid amount" });
      return;
    }
    if (!utr) {
      setStatus({ type: "error", message: "UTR / reference number required" });
      return;
    }
    if (!file) {
      setStatus({ type: "error", message: "Upload payment proof" });
      return;
    }

    setStatus({ type: "loading" });

    try {
      const proof = await fileToBase64(file);

      const response = await fetch(`${API_BASE}/api/payout-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Number(amount),
          utr,
          remarks,
          proof,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit payout request");
      }

      setAmount("");
      setUtr("");
      setRemarks("");
      setFile(null);
      setStatus({ type: "success", message: "Payout request submitted." });
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error ? error.message : "Unable to submit payout request",
      });
    }
  };

  return (
    <form className="mt-6 space-y-6 text-sm" onSubmit={onSubmit}>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Amount*</span>
        <input
          className="mt-2 w-full rounded-xl border border-slate-200 bg-[#f8faff] px-3 py-3 text-[#1f2937]"
          placeholder="₹"
          type="number"
          min="0"
          required
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Payment screenshot* (proof)</span>
        <div className="relative mt-2 flex w-full items-center justify-center rounded-2xl border-2 border-dashed border-[#2f4bff]/40 bg-[#f8faff] p-6 text-center text-sm text-slate-500 transition hover:border-[#2f4bff] hover:bg-[#2f4bff]/5">
          <input
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            type="file"
            accept="image/*,application/pdf"
            required
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <div className="pointer-events-none">
            <p className="font-semibold text-[#1f2937]">
              {file ? file.name : "Drag & drop proof here, or click to browse"}
            </p>
            <p className="text-xs text-slate-400">Supported formats: JPG, PNG, PDF (max 5MB)</p>
          </div>
        </div>
      </label>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">UTR / reference number*</span>
        <input
          className="mt-2 w-full rounded-xl border border-slate-200 bg-[#f8faff] px-3 py-3 text-[#1f2937]"
          placeholder="e.g. 1234567890"
          type="text"
          required
          value={utr}
          onChange={(event) => setUtr(event.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Remarks*</span>
        <textarea
          className="mt-2 w-full rounded-xl border border-slate-200 bg-[#f8faff] px-3 py-3 text-[#1f2937]"
          rows={4}
          placeholder="Add any additional notes"
          required
          value={remarks}
          onChange={(event) => setRemarks(event.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={status.type === "loading"}
        className="w-full rounded-xl bg-[#2f4bff] px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(47,75,255,0.3)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status.type === "loading" ? "Submitting..." : "Submit payout request"}
      </button>
      {status.type === "success" && (
        <p className="text-sm font-semibold text-emerald-600">{status.message}</p>
      )}
      {status.type === "error" && (
        <p className="text-sm font-semibold text-rose-600">{status.message}</p>
      )}
    </form>
  );
}

