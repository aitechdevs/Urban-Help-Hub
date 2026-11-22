"use client";

import { useState } from "react";

export default function PayPalRelease({ id, status, eligible, submitted, onAction, busy }: {
  id: number; status: string; eligible: boolean; submitted: boolean; busy: boolean;
  onAction: (id: number, action: "release" | "submit" | "refresh", data?: object) => Promise<void>;
}) {
  const [verified, setVerified] = useState(false);
  const [tax, setTax] = useState("");
  if (status === "pending") return <div className="space-y-2">
    <p className="text-xs text-slate-500">Release requires customer completion confirmation and both verified PayPal payments.</p>
    <label className="block text-sm">Applicable tax absorbed by platform (task currency)
      <input type="number" min="0" step="0.01" value={tax} onChange={(event) => setTax(event.target.value)} className="ml-2 w-28 rounded-lg border p-2" placeholder="0.00" />
    </label>
    <label className="block text-sm"><input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} /> I confirmed with the customer that the work is complete and reviewed the tax amount.</label>
    <button type="button" disabled={busy || !eligible || !verified || tax === "" || !Number.isFinite(Number(tax)) || Number(tax) < 0} onClick={() => onAction(id, "release", { customer_verified: true, tax_amount: tax })} className="rounded-xl bg-[#082f5b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Release full helper payment via PayPal</button>
  </div>;
  if (status === "processing" && !submitted) return <button disabled={busy} onClick={() => onAction(id, "submit")} className="rounded-xl bg-[#082f5b] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Submit authorized PayPal payout</button>;
  return <button disabled={busy} onClick={() => onAction(id, "refresh")} className="rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-50">Refresh PayPal payout status</button>;
}
