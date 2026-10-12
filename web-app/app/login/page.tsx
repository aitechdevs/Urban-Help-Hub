"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { API_URL } from "@/lib/api";

type UserRole = "customer" | "helper" | "admin";

type User = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: string;
};

type LoginResponse = {
  success: boolean;
  message: string;
  data?: {
    user: User;
    token: string;
  };
  errors?: Record<string, string[]>;
};

type UserResponse = {
  success: boolean;
  data?: {
    user: User;
  };
  message?: string;
};

function clearUrbanHelpHubAuth() {
  window.localStorage.removeItem("urbanhelphub_token");
  window.localStorage.removeItem("urbanhelphub_user");

  window.sessionStorage.removeItem("urbanhelphub_token");
  window.sessionStorage.removeItem("urbanhelphub_user");
}

function routeForRole(role: UserRole) {
  if (role === "admin") {
    return "/admin";
  }

  if (role === "helper") {
    return "/helper/dashboard";
  }

  return "/dashboard";
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3l18 18"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.6 10.6a2 2 0 0 0 2.8 2.8"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 5 9 8a10.8 10.8 0 0 1-2.1 3.8"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.6 6.6C4.4 8 3 10.3 3 12c0 3 3.5 8 9 8 1.4 0 2.7-.3 3.8-.8"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
      />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 12h14M13 6l6 6-6 6"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 11.5 12 4l9 7.5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.5 10v10h13V10M9.5 20v-6h5v6"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m6 12 4 4 8-9"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
      aria-hidden="true"
    />
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    if (!email.trim() || !password) {
      setError(
        "Please enter your email address and password."
      );
      return;
    }

    setLoading(true);

    try {
      /*
       * IMPORTANT:
       * Remove credentials from any previous Customer,
       * Helper or Admin before starting a new login.
       *
       * This prevents stale accounts in localStorage from
       * overriding a newer account in sessionStorage.
       */
      clearUrbanHelpHubAuth();

      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const result: LoginResponse =
        await response.json();

      if (
        !response.ok ||
        !result.success ||
        !result.data
      ) {
        if (result.errors?.email?.[0]) {
          throw new Error(result.errors.email[0]);
        }

        throw new Error(
          result.message ||
            "Unable to log in. Please try again."
        );
      }

      const token = result.data.token;

      /*
       * Do not trust only the role returned by the login
       * response. Ask Laravel who owns this token.
       */
      const verificationResponse = await fetch(
        `${API_URL}/user`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        }
      );

      const verificationResult: UserResponse =
        await verificationResponse.json();

      if (
        !verificationResponse.ok ||
        !verificationResult.success ||
        !verificationResult.data
      ) {
        /*
         * The token was issued but could not be verified.
         * Try to revoke it before stopping.
         */
        try {
          await fetch(`${API_URL}/logout`, {
            method: "POST",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
        } catch {
          // Nothing else required here.
        }

        throw new Error(
          "Your login could not be verified. Please try again."
        );
      }

      const verifiedUser =
        verificationResult.data.user;

      if (verifiedUser.status !== "active") {
        try {
          await fetch(`${API_URL}/logout`, {
            method: "POST",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          });
        } catch {
          // Nothing else required here.
        }

        throw new Error(
          "This account is not currently active."
        );
      }

      /*
       * Clear again immediately before saving.
       * This guarantees only ONE browser account exists.
       */
      clearUrbanHelpHubAuth();

      const storage = rememberMe
        ? window.localStorage
        : window.sessionStorage;

      storage.setItem(
        "urbanhelphub_token",
        token
      );

      storage.setItem(
        "urbanhelphub_user",
        JSON.stringify(verifiedUser)
      );

      /*
       * Replace rather than push so the browser Back button
       * does not immediately return to the login screen.
       */
      router.replace(
        routeForRole(verifiedUser.role)
      );
    } catch (err) {
      /*
       * Never leave partially written authentication state
       * after a failed login.
       */
      clearUrbanHelpHubAuth();

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
    <main className="min-h-screen bg-slate-50">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* LEFT / BRAND PANEL */}

        <section className="relative hidden overflow-hidden bg-[var(--navy)] lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full border border-white/30" />
            <div className="absolute left-32 top-32 h-96 w-96 rounded-full border border-white/20" />
            <div className="absolute bottom-[-120px] right-[-80px] h-[430px] w-[430px] rounded-full bg-[var(--green)] opacity-20 blur-3xl" />
          </div>

          <div className="relative z-10 p-10 xl:p-14">
            <Link
              href="/"
              title="Go to UrbanHelpHub home"
              className="inline-flex cursor-pointer rounded-2xl bg-white px-5 py-3 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-white/30"
            >
              <img
                src="/UrbanHelpHub-logo.png"
                alt="UrbanHelpHub"
                className="h-12 w-auto object-contain"
              />
            </Link>
          </div>

          <div className="relative z-10 max-w-2xl px-10 pb-12 xl:px-14 xl:pb-16">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-300" />
              Local help across Canada
            </div>

            <h1 className="text-5xl font-black leading-[1.02] tracking-[-0.055em] text-white xl:text-6xl">
              Welcome back to your local helping
              community.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Book trusted local help, manage your
              tasks, message Helpers and keep
              everything organised in one place.
            </p>

            <div className="mt-10 grid gap-4">
              {[
                "Find and book local Helpers",
                "Manage upcoming and completed tasks",
                "Keep messages and task updates together",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm font-bold text-white"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
                    <CheckIcon />
                  </span>

                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* RIGHT / LOGIN */}

        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-8 lg:px-12">
          <div className="w-full max-w-md">
            {/* MOBILE HEADER */}

            <div className="mb-10 flex items-center justify-between lg:hidden">
              <Link
                href="/"
                title="UrbanHelpHub home"
                className="cursor-pointer rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-100"
              >
                <img
                  src="/UrbanHelpHub-logo.png"
                  alt="UrbanHelpHub"
                  className="h-11 w-auto max-w-[210px] object-contain"
                />
              </Link>

              <Link
                href="/"
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-white hover:text-[var(--navy)] focus:outline-none focus:ring-4 focus:ring-slate-100"
              >
                <HomeIcon />
                Home
              </Link>
            </div>

            <div>
              <p className="text-sm font-black uppercase tracking-[0.17em] text-[var(--green)]">
                Welcome back
              </p>

              <h2 className="mt-2 text-4xl font-black tracking-[-0.045em] text-[var(--navy)]">
                Log in
              </h2>

              <p className="mt-3 leading-7 text-slate-500">
                Access your UrbanHelpHub account.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700"
              >
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-black">
                  !
                </span>

                <span>{error}</span>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-8 grid gap-5"
            >
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
                  disabled={loading}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-base font-semibold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-[var(--green)] focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label
                    htmlFor="password"
                    className="block text-sm font-black text-slate-700"
                  >
                    Password
                  </label>

                  <a
                    href="/forgot-password"
                    className="cursor-pointer rounded-lg px-2 py-1 text-sm font-bold text-[var(--green)] transition hover:bg-emerald-50 hover:underline focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  >
                    Forgot password?
                  </a>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    value={password}
                    disabled={loading}
                    onChange={(event) =>
                      setPassword(event.target.value)
                    }
                    placeholder="Enter your password"
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-28 text-base font-semibold text-slate-900 outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-slate-300 focus:border-[var(--green)] focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    disabled={loading}
                    title={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-3 top-1/2 inline-flex -translate-y-1/2 cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-black text-slate-500 transition hover:bg-slate-100 hover:text-[var(--navy)] focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <EyeIcon open={showPassword} />
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <label className="group flex cursor-pointer items-center gap-3 rounded-xl py-1">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  disabled={loading}
                  onChange={(event) =>
                    setRememberMe(
                      event.target.checked
                    )
                  }
                  className="h-4 w-4 cursor-pointer accent-[var(--green)] disabled:cursor-not-allowed"
                />

                <span className="text-sm font-semibold text-slate-600 transition group-hover:text-[var(--navy)]">
                  Keep me signed in on this device
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="group mt-1 flex h-14 cursor-pointer items-center justify-center gap-3 rounded-2xl bg-[var(--green)] px-6 text-base font-black text-white shadow-sm transition hover:-translate-y-0.5 hover:brightness-95 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-emerald-200 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <Spinner />
                    Verifying account...
                  </>
                ) : (
                  <>
                    Log in
                    <span className="transition-transform group-hover:translate-x-1">
                      <ArrowIcon />
                    </span>
                  </>
                )}
              </button>
            </form>

            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />

              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                New to UrbanHelpHub?
              </span>

              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <a
              href="/register"
              className="group flex h-14 cursor-pointer items-center justify-center gap-3 rounded-2xl border-2 border-[var(--navy)] bg-white px-6 text-base font-black text-[var(--navy)] transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm focus:outline-none focus:ring-4 focus:ring-slate-200 active:translate-y-0"
            >
              Create an account

              <span className="transition-transform group-hover:translate-x-1">
                <ArrowIcon />
              </span>
            </a>

            <p className="mt-8 text-center text-xs leading-5 text-slate-400">
              By continuing, you agree to
              UrbanHelpHub&apos;s Terms of Service and
              acknowledge the Privacy Policy.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
