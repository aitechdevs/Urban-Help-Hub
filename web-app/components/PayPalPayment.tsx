"use client";

import { useEffect, useRef, useState } from "react";
import { API_URL } from "@/lib/api";
import { formatMoney } from "@/lib/regions";

export type PayPalPaymentSummary = {
  id: number;
  provider: string;
  currency: string;
  total_amount: string | number;
  customer_confirmed_at?: string | null;
  status: string;
  installments?: { stage: string; amount_minor: number; status: string; has_order?: number | string }[];
};

function headers() {
  const token = sessionStorage.getItem("urbanhelphub_token") || localStorage.getItem("urbanhelphub_token");
  return { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token || ""}` };
}

export default function PayPalPayment({ payment }: { payment: PayPalPaymentSummary }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (message) errorRef.current?.focus();
  }, [message]);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const order = query.get("token");
    if (query.get("paypal_payment") !== String(payment.id) || !order) return;
    let active = true;
    async function capture() {
      setBusy(true);
      try {
        const response = await fetch(`${API_URL}/customer/payments/${payment.id}/capture`, {
          method: "POST", headers: headers(), body: JSON.stringify({ order_id: order }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to verify PayPal payment. Please retry.");
        const url = new URL(window.location.href);
        ["token", "PayerID", "paypal_payment"].forEach((key) => url.searchParams.delete(key));
        window.location.replace(url.toString());
      } catch (error) {
        if (active) setMessage(error instanceof Error ? error.message : "Unable to verify payment. Refresh to retry.");
      } finally {
        if (active) setBusy(false);
      }
    }
    const timer = window.setTimeout(() => { void capture(); }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [payment.id]);

  async function pay(stage: string) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`${API_URL}/customer/payments/${payment.id}/checkout`, {
        method: "POST", headers: headers(), body: JSON.stringify({ stage }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to open PayPal.");
      if (result.data.confirmed) window.location.reload();
      else window.location.assign(result.data.url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to open PayPal.");
      setBusy(false);
    }
  }

  const installments = payment.installments ?? [];
  const commitment = installments.find((item) => item.stage === "commitment");
  const balance = installments.find((item) => item.stage === "balance");
  const full = installments.find((item) => item.stage === "full");
  const checkoutAvailable = !["blocked", "refunded", "failed", "paid"].includes(payment.status);
  const canPayFull = checkoutAvailable && payment.status === "pending" && installments.length === 2
    && installments.every((item) => item.status === "pending" && Number(item.has_order) === 0);
  const actions = [
    ...(checkoutAvailable && (canPayFull || full?.status === "pending")
      ? [{ stage: "full", label: full ? "Continue full payment" : "Pay 100% upfront" }] : []),
    ...(checkoutAvailable && !full && commitment?.status === "pending"
      ? [{ stage: "commitment", label: "Pay 50% commitment" }] : []),
    ...(checkoutAvailable && balance?.status === "pending" && commitment?.status === "completed" && payment.customer_confirmed_at
      ? [{ stage: "balance", label: "Pay remaining balance" }] : []),
  ];
  const summaries = full
    ? [{ label: "Full payment", item: full }]
    : [{ label: "Commitment", item: commitment }, { label: "Final balance", item: balance }];

  return <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
    <p className="font-black">PayPal · {payment.status.replaceAll("_", " ")}</p>
    <p className="mt-1">Agreed total: {formatMoney(payment.total_amount, payment.currency)}.</p>
    {canPayFull && <p className="mt-1">Pay in full upfront or pay 50% now and the balance after confirming completion.</p>}
    <p className="mt-1">The helper receives 60%. The platform covers PayPal fees and applicable taxes from its 40%. Earnings stay held until customer confirmation, full payment and admin release.</p>
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {summaries.map(({ label, item }) => item && <p key={label}><strong>{label}:</strong> {formatMoney(item.amount_minor / 100, payment.currency)} · {item.status}</p>)}
    </div>
    {actions.length > 0 && <div className={`mt-3 grid gap-2 ${actions.length > 1 ? "sm:grid-cols-2" : ""}`}>
      {actions.map(({ stage, label }) => <button key={stage} type="button" disabled={busy} onClick={() => pay(stage)}
        className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-900 px-4 py-2 font-bold text-white transition-colors hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900 disabled:cursor-not-allowed disabled:opacity-50">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5 shrink-0">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18M7 15h4" strokeLinecap="round" />
        </svg>
        <span>{busy ? "Processing…" : `${label} with PayPal`}</span>
      </button>)}
    </div>}
    {message && <p ref={errorRef} tabIndex={-1} role="alert" className="mt-3 text-red-700">{message}</p>}
  </div>;
}

export function PayPalAccount() {
  const [accountEmail, setAccountEmail] = useState<string | null>();
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const messageRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (message && !saved) messageRef.current?.focus();
  }, [message, saved]);

  useEffect(() => {
    fetch(`${API_URL}/helper/paypal/payout-account`, { headers: headers(), cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to load PayPal payout settings.");
        setAccountEmail(result.data.email || null);
        setEmail(result.data.email || "");
      }).catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load settings."));
  }, []);

  return <section className="rounded-3xl border border-slate-200 bg-white p-6">
    <h2 className="font-bold text-[#082f5b]">PayPal payouts</h2>
    <p className="mt-2 text-sm text-slate-600">You receive 60% of the agreed total. The platform covers PayPal fees and taxes. Your full earnings remain held until the customer confirms completion, pays the balance and an admin releases them.</p>
    {accountEmail === undefined && !message && <p role="status" className="mt-3 text-sm text-slate-600">Loading payout account…</p>}
    {accountEmail && !editing && <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-emerald-700">PayPal payout account saved</p>
        <p className="break-all text-sm text-slate-700">{accountEmail}</p>
      </div>
      <button type="button" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-[#082f5b]" onClick={() => {
        setEmail(accountEmail);
        setMessage("");
        setEditing(true);
      }}>Change PayPal email</button>
    </div>}
    {(accountEmail === null || editing) && <form onSubmit={async (event) => {
      event.preventDefault();
      if (busy || (accountEmail && email.trim().toLowerCase() === accountEmail.toLowerCase())) return;
      setBusy(true);
      setSaved(false);
      setMessage("");
      try {
        const normalizedEmail = email.trim().toLowerCase();
        const response = await fetch(`${API_URL}/helper/paypal/payout-account`, {
          method: "PUT", headers: headers(), body: JSON.stringify({ email: normalizedEmail, password }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to save PayPal email.");
        setAccountEmail(normalizedEmail);
        setPassword("");
        setEditing(false);
        setSaved(true);
        setMessage("PayPal payout email saved.");
      } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save PayPal email."); }
      finally { setBusy(false); }
    }}>
      <label className="mt-3 block text-sm font-semibold">Your PayPal account email
        <input type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-300 p-3" />
      </label>
      <label className="mt-3 block text-sm font-semibold">Current Urban Help Hub password
        <input type="password" autoComplete="current-password" required maxLength={1024} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-300 p-3" />
      </label>
      <p className="mt-2 text-sm text-slate-600">Confirm your password when setting up or changing where your earnings are sent.</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button disabled={busy || email.trim().toLowerCase() === accountEmail?.toLowerCase()} className="rounded-xl bg-[#082f5b] px-4 py-2 font-bold text-white disabled:opacity-50">{busy ? "Saving…" : "Save PayPal email"}</button>
        {editing && <button type="button" disabled={busy} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={() => {
          setPassword("");
          setMessage("");
          setEditing(false);
        }}>Cancel</button>}
      </div>
    </form>}
    {message && <p ref={messageRef} tabIndex={-1} role={saved ? "status" : "alert"} className={`mt-2 text-sm ${saved ? "text-emerald-700" : "text-red-700"}`}>{message}</p>}
  </section>;
}
