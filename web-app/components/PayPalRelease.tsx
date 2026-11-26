"use client";

import { useState } from "react";

export default function PayPalRelease({ id, status, eligible, submitted, onAction, busy }: {
  id: number; status: string; eligible: boolean; submitted: boolean; busy: boolean;
  onAction: (id: number, action: "release" | "submit" | "refresh", data?: object) => Promise<void>;
}) {
  const [verified, setVerified] = useState(false);
  const [tax, setTax] = useState("");
  if (status === "pending") return <div className="w-full min-w-0 max-w-sm space-y-3">
    <p className="text-xs text-slate-500">Release requires customer completion confirmation and the full verified PayPal payment.</p>
    <label className="grid gap-1 text-sm">Applicable tax absorbed by platform (task currency)
      <input type="number" min="0" step="0.01" value={tax} onChange={(event) => setTax(event.target.value)} inputMode="decimal" className="min-h-11 w-28 rounded-lg border border-slate-300 px-3 py-2" placeholder="0.00" />
    </label>
    <label className="flex items-start gap-3 py-1 text-sm">
      <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0" checked={verified} onChange={(event) => setVerified(event.target.checked)} />
      <span>I confirmed with the customer that the work is complete and reviewed the tax amount.</span>
    </label>
    <button type="button" disabled={busy || !eligible || !verified || tax === "" || !Number.isFinite(Number(tax)) || Number(tax) < 0} onClick={() => onAction(id, "release", { customer_verified: true, tax_amount: tax })} className="min-h-11 rounded-xl bg-[#082f5b] px-4 py-2.5 text-sm max-sm:w-full font-bold text-white disabled:opacity-50">Release full helper payment via PayPal</button>
  </div>;
  if (status === "processing" && !submitted) return <button disabled={busy} onClick={() => onAction(id, "submit")} className="min-h-11 rounded-xl bg-[#082f5b] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Submit authorized PayPal payout</button>;
  return <button disabled={busy} onClick={() => onAction(id, "refresh")} className="min-h-11 rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-50">Refresh PayPal payout status</button>;
}
