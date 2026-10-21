"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/api";

type AccountRole = "customer" | "helper";

type RegisterResponse = {
  success: boolean;
  message?: string;
  data?: {
    user: {
      id: number;
      name: string;
      email: string;
      phone?: string | null;
      role: AccountRole;
      status: string;
    };
    token: string;
  };
  errors?: Record<string, string[]>;
};

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState<AccountRole>("customer");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] =
    useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !passwordConfirmation
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Your password must contain at least 8 characters."
      );
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Your passwords do not match.");
      return;
    }

    if (!acceptedTerms) {
      setError(
        "Please accept the Terms of Service and Privacy Policy."
      );
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() || null,
            password,
            password_confirmation: passwordConfirmation,
            role,
          }),
        }
      );

      const result: RegisterResponse =
        await response.json();

      if (!response.ok || !result.success || !result.data) {
        if (result.errors) {
          const firstError = Object.values(
            result.errors
          )[0]?.[0];

          if (firstError) {
            throw new Error(firstError);
          }
        }

        throw new Error(
          result.message ||
            "Unable to create your account."
        );
      }

      /*
       * DEVELOPMENT AUTH STORAGE
       *
       * This lets us test the complete application flow.
       * Before production, web authentication will be moved
       * to secure HttpOnly cookie/session authentication.
       */

      window.sessionStorage.setItem(
        "urbanhelphub_token",
        result.data.token
      );

      window.sessionStorage.setItem(
        "urbanhelphub_user",
        JSON.stringify(result.data.user)
      );

      if (role === "helper") {
        router.push("/become-a-helper");
        return;
      }

      router.push("/dashboard");
    } catch (err) {
      if (err instanceof TypeError) {
        setError(
          "Unable to connect to UrbanHelpHub. Please make sure the local API is running."
        );
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Something went wrong. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f9fb]">

      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">

        {/* LEFT BRAND PANEL */}

        <section className="relative hidden overflow-hidden bg-[var(--navy)] lg:flex lg:flex-col lg:justify-between">

          <div className="absolute inset-0">
            <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full border border-white/10" />

            <div className="absolute left-20 top-16 h-[500px] w-[500px] rounded-full border border-white/10" />

            <div className="absolute -bottom-48 -right-40 h-[550px] w-[550px] rounded-full bg-[var(--green)] opacity-20 blur-3xl" />
          </div>

          {/* REAL LOGO */}

          <div className="relative z-10 p-10 xl:p-14">
            <Link
              href="/"
              className="inline-flex rounded-2xl bg-white px-5 py-3 shadow-xl"
            >
              <img
                src="/UrbanHelpHub-logo.png"
                alt="UrbanHelpHub"
                className="h-12 w-auto object-contain"
              />
            </Link>
          </div>

          <div className="relative z-10 max-w-2xl px-10 pb-12 xl:px-14 xl:pb-16">

            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-black text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />

              Built around local communities
            </div>

            <h1 className="mt-6 text-5xl font-black leading-[1.02] tracking-[-0.055em] text-white xl:text-6xl">
              Need a hand?
              <br />
              Or ready to lend one?
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              UrbanHelpHub brings customers and trusted local
              Helpers together for everyday tasks across Canada.
            </p>

            <div className="mt-10 grid gap-4">

              {[
                "Find help that fits your schedule",
                "Compare skills, ratings and experience",
                "Build trust through verified profiles",
                "Manage tasks and conversations in one place",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm font-bold text-white"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
                    ✓
                  </span>

                  {item}
                </div>
              ))}

            </div>
          </div>
        </section>

        {/* REGISTRATION PANEL */}

        <section className="flex items-center justify-center px-5 py-8 sm:px-8 lg:px-12">

          <div className="w-full max-w-xl">

            {/* MOBILE HEADER */}

            <div className="mb-9 flex items-center justify-between lg:hidden">

              <Link href="/">
                <img
                  src="/UrbanHelpHub-logo.png"
                  alt="UrbanHelpHub"
                  className="h-11 w-auto max-w-[210px] object-contain"
                />
              </Link>

              <Link
                href="/"
                className="text-sm font-bold text-slate-500"
              >
                ← Home
              </Link>

            </div>

            <div>

              <p className="text-sm font-black uppercase tracking-[0.17em] text-[var(--green)]">
                Join UrbanHelpHub
              </p>

              <h2 className="mt-2 text-4xl font-black tracking-[-0.045em] text-[var(--navy)] sm:text-5xl">
                Create your account.
              </h2>

              <p className="mt-3 leading-7 text-slate-500">
                First, tell us how you want to use
                UrbanHelpHub.
              </p>

            </div>

            {/* ROLE SELECTION */}

            <div className="mt-7 grid gap-3 sm:grid-cols-2">

              <button
                type="button"
                onClick={() => setRole("customer")}
                className={`relative rounded-[22px] border-2 p-5 text-left transition ${
                  role === "customer"
                    ? "border-[var(--green)] bg-emerald-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                {role === "customer" && (
                  <span className="absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full bg-[var(--green)] text-xs font-black text-white">
                    ✓
                  </span>
                )}

                <div className="text-2xl">
                  🏠
                </div>

                <h3 className="mt-3 text-lg font-black text-[var(--navy)]">
                  I need help
                </h3>

                <p className="mt-1 pr-5 text-sm leading-6 text-slate-500">
                  Find trusted Helpers for tasks around your
                  home and everyday life.
                </p>

              </button>

              <button
                type="button"
                onClick={() => setRole("helper")}
                className={`relative rounded-[22px] border-2 p-5 text-left transition ${
                  role === "helper"
                    ? "border-[var(--green)] bg-emerald-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                {role === "helper" && (
                  <span className="absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full bg-[var(--green)] text-xs font-black text-white">
                    ✓
                  </span>
                )}

                <div className="text-2xl">
                  🤝
                </div>

                <h3 className="mt-3 text-lg font-black text-[var(--navy)]">
                  I want to be a Helper
                </h3>

                <p className="mt-1 pr-5 text-sm leading-6 text-slate-500">
                  Offer your skills, find local work and build
                  your reputation.
                </p>

              </button>

            </div>

            {/* ERROR */}

            {error && (
              <div
                role="alert"
                className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700"
              >
                {error}
              </div>
            )}

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="mt-7 grid gap-5"
            >

              <div>

                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-black text-slate-700"
                >
                  Full name
                </label>

                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  placeholder="Your full name"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 font-semibold outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-[var(--green)] focus:ring-4 focus:ring-emerald-100"
                />

              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-black text-slate-700"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 font-semibold outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-[var(--green)] focus:ring-4 focus:ring-emerald-100"
                  />

                </div>

                <div>

                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-black text-slate-700"
                  >
                    Phone
                    <span className="ml-1 font-semibold text-slate-400">
                      (optional)
                    </span>
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    placeholder="+1 416 555 0123"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 font-semibold outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-[var(--green)] focus:ring-4 focus:ring-emerald-100"
                  />

                </div>

              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                <div>

                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-black text-slate-700"
                  >
                    Password
                  </label>

                  <div className="relative">

                    <input
                      id="password"
                      type={
                        showPassword ? "text" : "password"
                      }
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="At least 8 characters"
                      className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-16 font-semibold outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-[var(--green)] focus:ring-4 focus:ring-emerald-100"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) => !current
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>

                  </div>

                </div>

                <div>

                  <label
                    htmlFor="password-confirmation"
                    className="mb-2 block text-sm font-black text-slate-700"
                  >
                    Confirm password
                  </label>

                  <input
                    id="password-confirmation"
                    type={
                      showPassword ? "text" : "password"
                    }
                    autoComplete="new-password"
                    value={passwordConfirmation}
                    onChange={(event) =>
                      setPasswordConfirmation(
                        event.target.value
                      )
                    }
                    placeholder="Enter it again"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 font-semibold outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-[var(--green)] focus:ring-4 focus:ring-emerald-100"
                  />

                </div>

              </div>

              {/* HELPER NOTICE */}

              {role === "helper" && (
                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">

                  <div className="flex gap-3">

                    <span className="text-lg">
                      🛡️
                    </span>

                    <div>

                      <h4 className="text-sm font-black text-[var(--navy)]">
                        Helper verification comes next
                      </h4>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        After creating your account, we&apos;ll
                        guide you through services, availability
                        and any verification required for the work
                        you want to offer.
                      </p>

                    </div>

                  </div>

                </div>
              )}

              {/* TERMS */}

              <label className="flex cursor-pointer items-start gap-3">

                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) =>
                    setAcceptedTerms(event.target.checked)
                  }
                  className="mt-1 h-4 w-4 shrink-0 accent-[var(--green)]"
                />

                <span className="text-sm leading-6 text-slate-500">
                  I agree to the{" "}
                  <a
                    href="/terms"
                    className="font-bold text-[var(--navy)] hover:underline"
                  >
                    Terms of Service
                  </a>{" "}
                  and acknowledge the{" "}
                  <a
                    href="/privacy"
                    className="font-bold text-[var(--navy)] hover:underline"
                  >
                    Privacy Policy
                  </a>
                  .
                </span>

              </label>

              {/* SUBMIT */}

              <button
                type="submit"
                disabled={loading}
                className="flex h-14 items-center justify-center rounded-2xl bg-[var(--green)] px-6 text-base font-black text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Creating your account..."
                  : role === "helper"
                  ? "Create Helper account"
                  : "Create my account"}
              </button>

            </form>

            {/* LOGIN */}

            <div className="mt-7 border-t border-slate-200 pt-6 text-center">

              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="font-black text-[var(--green)] hover:underline"
                >
                  Log in
                </a>
              </p>

            </div>

            <p className="mt-6 text-center text-xs leading-5 text-slate-400">
              UrbanHelpHub will never ask you to send your
              password to another customer or Helper.
            </p>

          </div>

        </section>

      </div>

    </main>
  );
}
