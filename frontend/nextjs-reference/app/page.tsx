"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";

type ServiceCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image: string | null;
  is_active: boolean;
  sort_order: number;
  requires_verification: boolean;
  requires_background_check: boolean;
  requires_driving_documents: boolean;
  requires_specialist_documents: boolean;
};

type CategoryCard = ServiceCategory & {
  displayIcon: string;
  displayImage: string;
};

const categoryPresentation: Record<
  string,
  { icon: string; image: string }
> = {
  "mobile-salon": {
    icon: "✂️",
    image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=900&q=80",
  },
  cleaning: {
    icon: "✨",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=900&q=80",
  },
  "moving-help": {
    icon: "📦",
    image:
      "https://images.unsplash.com/photo-1600518464441-9154a4dea21b?auto=format&fit=crop&w=900&q=80",
  },
  "furniture-assembly": {
    icon: "🪑",
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80",
  },
  "delivery-errands": {
    icon: "🚚",
    image:
      "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=900&q=80",
  },
  "home-repairs": {
    icon: "🛠️",
    image:
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80",
  },
  mounting: {
    icon: "🔩",
    image:
      "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80",
  },
  "yard-outdoor": {
    icon: "🌿",
    image:
      "https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=900&q=80",
  },
  "personal-help": {
    icon: "🤝",
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
  },
  "snow-removal": {
    icon: "❄️",
    image:
      "https://images.unsplash.com/photo-1483664852095-d6cc6870702d?auto=format&fit=crop&w=900&q=80",
  },
  "personal-driving": {
    icon: "🚗",
    image:
      "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=900&q=80",
  },
  babysitting: {
    icon: "🧸",
    image:
      "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=900&q=80",
  },
};

const providers = [
  {
    name: "Maya R.",
    role: "Home Cleaning",
    rating: "4.98",
    jobs: 312,
    price: "$38/hr",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Daniel K.",
    role: "Furniture Assembly",
    rating: "4.96",
    jobs: 227,
    price: "$42/hr",
    image:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Priya S.",
    role: "Errands & Personal Help",
    rating: "5.00",
    jobs: 164,
    price: "$34/hr",
    image:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=500&q=80",
  },
  {
    name: "Andre T.",
    role: "Moving & Delivery",
    rating: "4.95",
    jobs: 401,
    price: "$49/hr",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80",
  },
];

const cities = [
  "Toronto",
  "Vancouver",
  "Calgary",
  "Ottawa",
  "Edmonton",
  "Mississauga",
  "Winnipeg",
  "Montreal",
];

export default function Home() {
  const [selected, setSelected] = useState("Popular");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const [categories, setCategories] = useState<CategoryCard[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        setCategoriesError("");

        const response = await fetch(
          `${API_URL}/service-categories`
        );

        if (!response.ok) {
          throw new Error("Unable to load service categories.");
        }

        const result = await response.json();

        const formatted: CategoryCard[] = result.data.map(
          (category: ServiceCategory) => {
            const presentation = categoryPresentation[category.slug];

            return {
              ...category,
              displayIcon: category.icon || presentation?.icon || "✓",
              displayImage:
                category.image ||
                presentation?.image ||
                "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
            };
          }
        );

        setCategories(formatted);
      } catch (error) {
        console.error(error);

        setCategoriesError(
          "Services are temporarily unavailable. Please try again."
        );
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  const visible = useMemo(() => {
    if (!query.trim()) {
      return categories;
    }

    return categories.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, categories]);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <main className="min-h-screen bg-white text-slate-950">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-5 lg:px-8">

          {/* LOGO */}
          <Link href="/" className="flex min-w-0 items-center">
            <img
              src="/UrbanHelpHub-logo.png"
              alt="UrbanHelpHub"
              className="h-11 w-auto max-w-[210px] object-contain sm:h-12 sm:max-w-[250px] lg:h-14"
            />
          </Link>

          {/* DESKTOP NAVIGATION */}
          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-700 lg:flex">

            <a
              href="#services"
              className="hover:text-[var(--green)]"
            >
              Services
            </a>

            <a
              href="#how"
              className="hover:text-[var(--green)]"
            >
              How it works
            </a>

            <a
              href="#trust"
              className="hover:text-[var(--green)]"
            >
              Trust & Safety
            </a>

            <a
              href="#cities"
              className="hover:text-[var(--green)]"
            >
              Cities
            </a>

          </nav>

          {/* DESKTOP ACTIONS */}
          <div className="hidden items-center gap-2 lg:flex">

            <a
              href="/login"
              className="rounded-full px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
            >
              Log in
            </a>

            <a
              href="/become-a-helper"
              className="rounded-full border border-[var(--navy)] px-4 py-2 text-sm font-bold text-[var(--navy)] hover:bg-slate-50"
            >
              Become a Helper
            </a>

            <a
              href="/post-a-task"
              className="rounded-full bg-[var(--green)] px-5 py-2.5 text-sm font-black text-white shadow-sm hover:brightness-95"
            >
              Post a Task
            </a>

          </div>

          {/* MOBILE HAMBURGER BUTTON */}
          <button
            type="button"
            onClick={() => setMenuOpen((current) => !current)}
            aria-label="Open navigation menu"
            aria-expanded={menuOpen}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[var(--navy)] shadow-sm lg:hidden"
          >

            {menuOpen ? (
              <span className="text-3xl font-light leading-none">
                ×
              </span>
            ) : (
              <div className="flex flex-col gap-[5px]">
                <span className="block h-[2px] w-5 rounded bg-current" />
                <span className="block h-[2px] w-5 rounded bg-current" />
                <span className="block h-[2px] w-5 rounded bg-current" />
              </div>
            )}

          </button>

        </div>

        {/* MOBILE MENU */}
        {menuOpen && (
          <div className="border-t border-slate-100 bg-white shadow-xl lg:hidden">

            <div className="mx-auto max-w-7xl px-5 py-5">

              <nav className="grid">

                <a
                  href="#services"
                  onClick={closeMenu}
                  className="border-b border-slate-100 py-4 text-base font-bold text-[var(--navy)]"
                >
                  Services
                </a>

                <a
                  href="#how"
                  onClick={closeMenu}
                  className="border-b border-slate-100 py-4 text-base font-bold text-[var(--navy)]"
                >
                  How it works
                </a>

                <a
                  href="#trust"
                  onClick={closeMenu}
                  className="border-b border-slate-100 py-4 text-base font-bold text-[var(--navy)]"
                >
                  Trust & Safety
                </a>

                <a
                  href="#cities"
                  onClick={closeMenu}
                  className="border-b border-slate-100 py-4 text-base font-bold text-[var(--navy)]"
                >
                  Cities
                </a>

              </nav>

              <div className="mt-5 grid gap-3">

                <a
                  href="/login"
                  onClick={closeMenu}
                  className="rounded-2xl border border-slate-200 px-5 py-3.5 text-center font-bold text-[var(--navy)]"
                >
                  Log in
                </a>

                <a
                  href="/become-a-helper"
                  onClick={closeMenu}
                  className="rounded-2xl border-2 border-[var(--navy)] px-5 py-3.5 text-center font-black text-[var(--navy)]"
                >
                  Become a Helper
                </a>

                <a
                  href="/post-a-task"
                  onClick={closeMenu}
                  className="rounded-2xl bg-[var(--green)] px-5 py-4 text-center font-black text-white shadow-sm"
                >
                  Post a Task
                </a>

              </div>

            </div>

          </div>
        )}

      </header>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="relative overflow-hidden">

        <div className="absolute inset-0 hero-grid opacity-60" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-5 pb-14 pt-10 sm:pt-14 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pb-24 lg:pt-20">

          {/* HERO TEXT */}
          <div className="flex flex-col justify-center">

            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-800 sm:px-4 sm:text-sm">

              <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--green)]" />

              Local help, made easier across Canada

            </div>

            <h1 className="max-w-3xl text-[42px] font-black leading-[.98] tracking-[-0.055em] text-[var(--navy)] sm:text-6xl lg:text-7xl">
              Get reliable help for life&apos;s everyday tasks.
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-xl sm:leading-8">
              Find trusted local helpers for cleaning, moving, assembly,
              delivery, errands, home repairs and more — with transparent
              profiles, reviews, scheduling and secure payments.
            </p>

            {/* SEARCH BOX */}
            <div className="mt-7 rounded-[26px] border border-slate-200 bg-white p-3 shadow-[0_18px_60px_rgba(15,23,42,.10)] sm:mt-8">

              <div className="grid gap-3 md:grid-cols-[1fr_190px_auto]">

                <label className="flex min-h-14 items-center gap-3 rounded-2xl bg-slate-50 px-4">

                  <span className="text-xl">
                    ⌕
                  </span>

                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-w-0 w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400 sm:text-base"
                    placeholder="What do you need help with?"
                  />

                </label>

                <label className="flex min-h-14 items-center gap-3 rounded-2xl bg-slate-50 px-4">

                  <span>
                    📍
                  </span>

                  <input
                    className="min-w-0 w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
                    placeholder="Postal code"
                  />

                </label>

                <a
                  href="/post-a-task"
                  className="flex min-h-14 items-center justify-center rounded-2xl bg-[var(--green)] px-6 font-black text-white hover:brightness-95"
                >
                  Find help
                </a>

              </div>

            </div>

            {/* QUICK CATEGORIES */}
            <div className="mt-5 flex flex-wrap gap-2">

              {[
                "Cleaning",
                "Moving Help",
                "Furniture Assembly",
                "Delivery & Errands",
                "Yard & Outdoor",
              ].map((x) => (
                <button
                  key={x}
                  onClick={() => setQuery(x)}
                  className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 sm:px-4 sm:text-sm"
                >
                  {x}
                </button>
              ))}

            </div>

          </div>

          {/* HERO IMAGE */}
          <div className="relative min-h-[360px] overflow-hidden rounded-[30px] bg-slate-100 shadow-2xl sm:min-h-[460px] lg:min-h-[500px] lg:rounded-[36px]">

            <img
              src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=90"
              alt="Local helper providing home services"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-x-4 bottom-4 rounded-[24px] bg-white/95 p-4 shadow-xl backdrop-blur sm:inset-x-5 sm:bottom-5 sm:p-5">

              <div className="flex items-center justify-between gap-3">

                <div>

                  <div className="text-xs font-black text-[var(--green)] sm:text-sm">
                    Available today
                  </div>

                  <div className="mt-1 text-base font-black text-[var(--navy)] sm:text-xl">
                    Choose by skills, price & reviews
                  </div>

                </div>

                <div className="shrink-0 rounded-2xl bg-slate-950 px-3 py-2 text-center text-white sm:px-4 sm:py-3">

                  <div className="text-[10px] font-bold text-slate-300 sm:text-xs">
                    Rating
                  </div>

                  <div className="text-sm font-black sm:text-lg">
                    ★ 4.9+
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          SERVICES
      ===================================================== */}

      <section
        id="services"
        className="border-y border-slate-100 bg-slate-50/70 py-14 lg:py-16"
      >

        <div className="mx-auto max-w-7xl px-5 lg:px-8">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <p className="text-sm font-black uppercase tracking-[.18em] text-[var(--green)]">
                Explore services
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] text-[var(--navy)] sm:text-5xl">
                Help for every kind of to-do.
              </h2>

            </div>

            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">

              {[
                "Popular",
                "Home",
                "Moving",
                "Outdoor",
                "Personal",
              ].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelected(tab)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-black ${
                    selected === tab
                      ? "bg-[var(--navy)] text-white"
                      : "border border-slate-200 bg-white text-slate-600"
                  }`}
                >
                  {tab}
                </button>
              ))}

            </div>

          </div>

          {categoriesLoading && (
            <p className="mt-8 font-semibold text-slate-500">
              Loading services...
            </p>
          )}

          {categoriesError && (
            <p className="mt-8 rounded-2xl bg-red-50 p-4 font-semibold text-red-600">
              {categoriesError}
            </p>
          )}

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {visible.map((item) => (
              <a
                key={item.id}
                href={`/post-a-task?service=${item.slug}`}
                className="group overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >

                <div className="aspect-[4/3] overflow-hidden bg-slate-100">

                  <img
                    src={item.displayImage}
                    alt={item.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />

                </div>

                <div className="flex items-center justify-between p-5">

                  <div>

                    <div className="text-sm text-slate-400">
                      {item.displayIcon}
                    </div>

                    <div className="mt-1 text-lg font-black text-[var(--navy)]">
                      {item.name}
                    </div>

                  </div>

                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-lg transition group-hover:bg-[var(--green)] group-hover:text-white">
                    →
                  </span>

                </div>

              </a>
            ))}

          </div>

        </div>

      </section>

      {/* =====================================================
          TRUST & SAFETY
      ===================================================== */}

      <section
        id="trust"
        className="py-14 lg:py-20"
      >

        <div className="mx-auto grid max-w-7xl gap-5 px-5 md:grid-cols-3 lg:px-8">

          {[
            [
              "✓",
              "Verified profiles",
              "Identity, documents and service eligibility can be reviewed before providers go live.",
            ],
            [
              "★",
              "Real reviews",
              "Compare helpers using completed-job history, ratings and customer feedback.",
            ],
            [
              "↺",
              "Support when needed",
              "Clear cancellation, dispute and support flows keep both sides informed.",
            ],
          ].map(([icon, title, copy]) => (
            <div
              key={title}
              className="rounded-[26px] border border-slate-200 p-6 sm:p-7"
            >

              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-xl font-black text-[var(--green)]">
                {icon}
              </div>

              <h3 className="mt-5 text-2xl font-black tracking-[-.03em] text-[var(--navy)]">
                {title}
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                {copy}
              </p>

            </div>
          ))}

        </div>

      </section>

      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}

      <section
        id="how"
        className="bg-[var(--navy)] py-14 text-white lg:py-20"
      >

        <div className="mx-auto max-w-7xl px-5 lg:px-8">

          <div className="max-w-2xl">

            <p className="text-sm font-black uppercase tracking-[.18em] text-emerald-300">
              How it works
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-[-0.045em] sm:text-5xl">
              From task to done in three clear steps.
            </h2>

          </div>

          <div className="mt-9 grid gap-5 md:grid-cols-3">

            {[
              [
                "01",
                "Describe what you need",
                "Choose the service, share task details, your location and preferred date.",
              ],
              [
                "02",
                "Choose the right helper",
                "Compare experience, pricing, availability, verification and reviews.",
              ],
              [
                "03",
                "Book, chat and complete",
                "Keep the conversation, updates, payment and review in one place.",
              ],
            ].map(([num, title, copy]) => (
              <div
                key={num}
                className="rounded-[26px] border border-white/15 bg-white/5 p-6 sm:p-7"
              >

                <div className="text-sm font-black text-emerald-300">
                  {num}
                </div>

                <h3 className="mt-6 text-2xl font-black sm:mt-8">
                  {title}
                </h3>

                <p className="mt-3 leading-7 text-slate-300">
                  {copy}
                </p>

              </div>
            ))}

          </div>

        </div>

      </section>

      {/* =====================================================
          TOP HELPERS
      ===================================================== */}

      <section className="py-14 lg:py-20">

        <div className="mx-auto max-w-7xl px-5 lg:px-8">

          <div className="flex items-end justify-between gap-6">

            <div>

              <p className="text-sm font-black uppercase tracking-[.18em] text-[var(--green)]">
                Top local helpers
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] text-[var(--navy)] sm:text-5xl">
                People you can choose with confidence.
              </h2>

            </div>

            <button className="hidden rounded-full border border-slate-200 px-5 py-2.5 text-sm font-black text-[var(--navy)] md:block">
              Browse helpers
            </button>

          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {providers.map((p) => (
              <article
                key={p.name}
                className="overflow-hidden rounded-[28px] border border-slate-200 bg-white"
              >

                <div className="aspect-square overflow-hidden bg-slate-100">

                  <img
                    src={p.image}
                    alt={p.name}
                    className="h-full w-full object-cover"
                  />

                </div>

                <div className="p-5">

                  <div className="flex items-start justify-between gap-3">

                    <div>

                      <h3 className="text-xl font-black text-[var(--navy)]">
                        {p.name}
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {p.role}
                      </p>

                    </div>

                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                      Verified
                    </span>

                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 text-sm">

                    <span className="font-black text-slate-800">
                      ★ {p.rating}
                    </span>

                    <span className="text-slate-500">
                      {p.jobs} jobs
                    </span>

                    <span className="font-black text-[var(--navy)]">
                      {p.price}
                    </span>

                  </div>

                </div>

              </article>
            ))}

          </div>

        </div>

      </section>

      {/* =====================================================
          FEATURED
      ===================================================== */}

      <section className="bg-slate-50 py-14 lg:py-20">

        <div className="mx-auto max-w-7xl px-5 lg:px-8">

          <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">

            <div>

              <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[.16em] text-amber-800">
                Featured this week
              </span>

              <h2 className="mt-5 text-3xl font-black tracking-[-0.045em] text-[var(--navy)] sm:text-5xl">
                Quick wins for your home and schedule.
              </h2>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Discover seasonal services, helpful local picks and practical
                ways to get more done.
              </p>

              <a
                href="#services"
                className="mt-7 inline-block rounded-full bg-[var(--navy)] px-6 py-3 font-black text-white"
              >
                See featured services
              </a>

            </div>

            <div className="grid gap-5 sm:grid-cols-2">

              {[
                [
                  "Weekend cleaning",
                  "Freshen up your space before Monday.",
                  "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=800&q=80",
                ],
                [
                  "Moving help",
                  "Extra hands for lifting, loading and setup.",
                  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
                ],
              ].map(([title, copy, image]) => (
                <article
                  key={title}
                  className="overflow-hidden rounded-[26px] bg-white shadow-sm"
                >

                  <img
                    src={image}
                    alt={title}
                    className="aspect-[4/3] w-full object-cover"
                  />

                  <div className="p-5">

                    <h3 className="text-xl font-black text-[var(--navy)]">
                      {title}
                    </h3>

                    <p className="mt-2 leading-6 text-slate-600">
                      {copy}
                    </p>

                    <a
                      href="#services"
                      className="mt-4 inline-block text-sm font-black text-[var(--green)]"
                    >
                      Explore →
                    </a>

                  </div>

                </article>
              ))}

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          CITIES
      ===================================================== */}

      <section
        id="cities"
        className="py-14 lg:py-20"
      >

        <div className="mx-auto max-w-7xl px-5 lg:px-8">

          <div className="rounded-[30px] bg-emerald-50 p-6 sm:p-10 lg:rounded-[36px] lg:p-12">

            <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">

              <div>

                <p className="text-sm font-black uppercase tracking-[.18em] text-[var(--green)]">
                  Growing across Canada
                </p>

                <h2 className="mt-3 text-3xl font-black tracking-[-.045em] text-[var(--navy)] sm:text-4xl">
                  Find help near you.
                </h2>

                <p className="mt-4 leading-7 text-slate-600">
                  Discover local helpers and services across major Canadian
                  cities.
                </p>

              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                {cities.map((city) => (
                  <a
                    key={city}
                    href="#services"
                    className="rounded-2xl bg-white px-3 py-3 text-center text-sm font-black text-[var(--navy)] shadow-sm transition hover:-translate-y-0.5 sm:px-4"
                  >
                    {city}
                  </a>
                ))}

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          HELPER CTA
      ===================================================== */}

      <section className="pb-14 lg:pb-20">

        <div className="mx-auto max-w-7xl px-5 lg:px-8">

          <div className="overflow-hidden rounded-[30px] bg-[var(--navy)] px-6 py-11 text-center text-white sm:px-10 lg:rounded-[36px] lg:py-16">

            <p className="text-sm font-black uppercase tracking-[.18em] text-emerald-300">
              Earn with UrbanHelpHub
            </p>

            <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black tracking-[-0.045em] sm:text-5xl">
              Turn your skills and free time into meaningful local work.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Create a profile, choose the services you offer, set your
              availability and build your reputation.
            </p>

            <a
              href="/become-a-helper"
              className="mt-8 inline-block rounded-full bg-[var(--green)] px-7 py-3.5 font-black text-white"
            >
              Become a Helper
            </a>

          </div>

        </div>

      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="border-t border-slate-200 bg-white">

        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-5 lg:px-8">

          <div className="lg:col-span-2">

            <img
              src="/UrbanHelpHub-logo.png"
              alt="UrbanHelpHub"
              className="h-14 w-auto max-w-[240px] object-contain sm:h-16"
            />

            <p className="mt-4 max-w-sm leading-7 text-slate-500">
              A Canadian marketplace connecting people who need help with
              trusted local people ready to work.
            </p>

          </div>

          {[
            [
              "Explore",
              [
                "Services",
                "Cities",
                "How it works",
                "Safety",
              ],
            ],
            [
              "For Helpers",
              [
                "Become a Helper",
                "Earnings",
                "Verification",
                "Support",
              ],
            ],
            [
              "Company",
              [
                "About",
                "Contact",
                "Privacy",
                "Terms",
              ],
            ],
          ].map(([title, links]) => (
            <div key={title as string}>

              <h3 className="font-black text-[var(--navy)]">
                {title}
              </h3>

              <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-500">

                {(links as string[]).map((link) => (
                  <a
                    href="#"
                    key={link}
                    className="hover:text-[var(--green)]"
                  >
                    {link}
                  </a>
                ))}

              </div>

            </div>
          ))}

        </div>

        <div className="border-t border-slate-100 px-5 py-5 text-center text-xs font-semibold text-slate-400">
          © 2026 UrbanHelpHub. Canada.
        </div>

      </footer>

    </main>
  );
}
