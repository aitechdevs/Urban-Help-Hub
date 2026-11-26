"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import SiteLogo from "@/components/SiteLogo";
import { API_URL } from "@/lib/api";

async function sendRequest(path: string, data: Record<string, string>) {
  const response = await fetch(`${API_URL}/auth/email/${path}`, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (!response.ok || !result.success) {
    if (response.status === 429) throw new Error("Too many requests. Wait a minute and try again.");
    throw new Error(result.message || "We couldn’t process your request. Try again.");
  }
  return result as { message: string; activation_pending?: boolean };
}

export default function ConfirmEmailPage() {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const linkToken = new URLSearchParams(window.location.hash.slice(1)).get("token");
      setToken(linkToken && /^[a-f0-9]{64}$/.test(linkToken) ? linkToken : "");
      setSubmitted(new URLSearchParams(window.location.search).get("sent") === "1");
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function confirm() {
    if (busy || !token) return;
    setBusy(true);
    setError("");
    try {
      const result = await sendRequest("confirm", { token });
      window.location.replace(result.activation_pending ? "/login/?confirmed=pending" : "/login/?confirmed=1");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn’t confirm your email. Try again.");
      setBusy(false);
    }
  }

  async function resend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await sendRequest("resend", { email: email.trim() });
      setNotice(result.message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn’t request a new link. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 px-4 py-8 text-[#082f5b]">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <SiteLogo />
        <h1 className="mt-6 text-2xl font-bold sm:text-3xl">Confirm your email</h1>
        {!ready ? (
          <p className="mt-3 text-sm text-slate-600" role="status">Checking your confirmation link…</p>
        ) : (
          <>
            <p className="mt-3 leading-6 text-slate-600">
              {token ? "Confirm this email address for your UrbanHelpHub account. You’ll be taken to sign-in."
                : submitted ? "Your account was created. Allow a few minutes for the confirmation email and check your spam folder."
                : "Enter the email address you used to create your account to request a new confirmation link."}
            </p>
            {token && (
              <button type="button" disabled={busy} onClick={confirm} className="mt-5 min-h-11 w-full rounded-xl bg-[#082f5b] px-4 py-3 font-bold text-white disabled:opacity-50">
                {busy ? "Please wait…" : "Confirm email address"}
              </button>
            )}
            {(!token || error) && (
              <form onSubmit={resend} className="mt-5 space-y-3">
                <label className="block space-y-1 text-sm font-semibold">
                  Email address
                  <input type="email" required autoComplete="email" maxLength={255} value={email} onChange={(event) => setEmail(event.target.value)} className="input block font-normal" />
                </label>
                <button type="submit" disabled={busy} className="min-h-11 w-full rounded-xl border border-slate-300 px-4 py-3 font-bold disabled:opacity-50">
                  Send another confirmation link
                </button>
              </form>
            )}
            {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            {notice && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>}
          </>
        )}
        <Link href="/login/" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold underline">Back to sign in</Link>
      </section>
    </main>
  );
}
