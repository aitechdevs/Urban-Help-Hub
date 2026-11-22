"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";
import { formatMoney } from "@/lib/regions";

export type PayPalPaymentSummary = {
  id: number;
  provider: string;
  currency: string;
  total_amount: string | number;
  customer_confirmed_at?: string | null;
  status: string;
  installments?: { stage: string; amount_minor: number; status: string }[];
};

function headers() {
  const token = sessionStorage.getItem("urbanhelphub_token") || localStorage.getItem("urbanhelphub_token");
  return { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${token || ""}` };
}

export default function PayPalPayment({ payment }: { payment: PayPalPaymentSummary }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

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
    void capture();
    return () => { active = false; };
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

  const depositPaid = payment.installments?.some((item) => item.stage === "commitment" && item.status === "completed");
  return <div className="mt-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
    <p className="font-black">PayPal · {payment.status.replaceAll("_", " ")}</p>
    <p className="mt-1">Agreed total: {formatMoney(payment.total_amount, payment.currency)}. Pay 50% to commit and the remainder after confirming completion.</p>
    <p className="mt-1">The helper receives 60%. The platform covers PayPal fees and applicable taxes from its 40%. Earnings stay held until customer confirmation, full payment and admin release.</p>
    <div className="mt-3 flex flex-wrap gap-3">{payment.installments?.map((item) => <div key={item.stage}>
      <p>{item.stage === "commitment" ? "Commitment" : "Final balance"}: {formatMoney(item.amount_minor / 100, payment.currency)} · {item.status}</p>
      {item.status === "pending" && !["blocked", "refunded", "failed"].includes(payment.status) && (item.stage === "commitment" || (depositPaid && payment.customer_confirmed_at)) && <button type="button" disabled={busy} onClick={() => pay(item.stage)} className="mt-2 rounded-xl bg-blue-900 px-4 py-2 font-bold text-white disabled:opacity-50">{busy ? "Processing…" : `Pay ${item.stage === "commitment" ? "commitment" : "balance"} with PayPal`}</button>}
    </div>)}</div>
    {message && <p role="alert" className="mt-3 text-red-700">{message}</p>}
  </div>;
}

export function PayPalAccount() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch(`${API_URL}/helper/paypal`, { headers: headers() })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Unable to load PayPal payout settings.");
        setEmail(result.data.paypal_email || "");
      }).catch((error) => setMessage(error instanceof Error ? error.message : "Unable to load settings."));
  }, []);
  return <form className="rounded-3xl border border-slate-200 bg-white p-6" onSubmit={async (event) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch(`${API_URL}/helper/paypal`, { method: "PUT", headers: headers(), body: JSON.stringify({ paypal_email: email }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to save PayPal email.");
      setMessage("PayPal payout email saved. Check it carefully before your first payout.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save."); }
    finally { setBusy(false); }
  }}>
    <h2 className="font-bold text-[#082f5b]">PayPal payouts</h2>
    <p className="mt-2 text-sm text-slate-600">You receive 60% of the agreed total. The platform covers PayPal fees and taxes. Your full earnings remain held until the customer confirms completion, pays the balance and an admin releases them.</p>
    <label className="mt-3 block text-sm font-semibold">Your PayPal account email<input type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 block w-full rounded-xl border border-slate-300 p-3" /></label>
    <button disabled={busy} className="mt-3 rounded-xl bg-[#082f5b] px-4 py-2 font-bold text-white disabled:opacity-50">{busy ? "Saving…" : "Save PayPal email"}</button>
    {message && <p role="status" className="mt-2 text-sm">{message}</p>}
  </form>;
}
