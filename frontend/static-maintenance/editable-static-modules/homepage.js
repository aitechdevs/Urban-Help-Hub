(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  "object" == typeof document ? document.currentScript : void 0,
  31713,
  (e) => {
    "use strict";
    var t = e.i(43476),
      r = e.i(71645),
      a = e.i(22016),
      s = e.i(54858);
    let l = {
        "mobile-salon": {icon:"✂️",image:"https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=900&q=80"},
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
      },
      n = [
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
      ],
      o = [
        "Toronto",
        "Vancouver",
        "Calgary",
        "Ottawa",
        "Edmonton",
        "Mississauga",
        "Winnipeg",
        "Montreal",
      ],
      i = {
        Services: "#services",
        Cities: "#cities",
        "How it works": "#how",
        Safety: "#safety",
        "Become a Helper": "/become-a-helper",
        Support: "/contact",
        Contact: "/contact",
        Privacy: "/privacy",
        Terms: "/terms",
        Refunds: "/refund-policy",
      },
      c = ["Popular", "Home", "Moving", "Outdoor", "Personal"],
      d = {
        Popular: [],
        Home: ["cleaning", "furniture-assembly", "home-repairs", "mounting"],
        Moving: ["moving-help", "delivery-errands"],
        Outdoor: ["yard-outdoor", "snow-removal"],
        Personal: ["personal-help", "personal-driving", "babysitting", "mobile-salon"],
      };
    e.s([
      "default",
      0,
      function () {
        let [e, m] = (0, r.useState)("Popular"),
          [p, x] = (0, r.useState)(""),
          [u, h] = (0, r.useState)(!1),
          [f, g] = (0, r.useState)([]),
          [b, v] = (0, r.useState)(!0),
          [y, j] = (0, r.useState)("");
        (0, r.useEffect)(() => {
          (async () => {
            try {
              (v(!0), j(""));
              let e = await fetch(`${s.API_URL}/service-categories`);
              if (!e.ok) throw Error("Unable to load service categories.");
              let t = (await e.json()).data.map((e) => {
                let t = l[e.slug];
                return {
                  ...e,
                  displayIcon: e.icon || t?.icon || "✓",
                  displayImage:
                    e.image ||
                    t?.image ||
                    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
                };
              });
              g(t);
            } catch (e) {
              (console.error(e),
                j("Services are temporarily unavailable. Please try again."));
            } finally {
              v(!1);
            }
          })();
        }, []);
        let w = (0, r.useMemo)(() => {
            let t = d[e];
            return f.filter((r) => {
              let a = "Popular" === e || t.includes(r.slug),
                s =
                  !p.trim() ||
                  r.name.toLowerCase().includes(p.trim().toLowerCase());
              return a && s;
            });
          }, [p, f, e]),
          N = () => {
            h(!1);
          };
        return (0, t.jsxs)("main", {
          className: "min-h-screen bg-white text-slate-950",
          children: [
            (0, t.jsxs)("header", {
              className:
                "sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur",
              children: [
                (0, t.jsxs)("div", {
                  className:
                    "mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-5 lg:px-8",
                  children: [
                    (0, t.jsx)(a.default, {
                      href: "/",
                      className: "flex min-w-0 items-center",
                      children: (0, t.jsx)("img", {
                        src: "/UrbanHelpHub-logo.png",
                        alt: "UrbanHelpHub",
                        className:
                          "h-11 w-auto max-w-[210px] object-contain sm:h-12 sm:max-w-[250px] lg:h-14",
                      }),
                    }),
                    (0, t.jsxs)("nav", {
                      className:
                        "hidden items-center gap-7 text-sm font-semibold text-slate-700 lg:flex",
                      children: [
                        (0, t.jsx)("a", {
                          href: "#services",
                          className: "hover:text-[var(--green)]",
                          children: "Services",
                        }),
                        (0, t.jsx)("a", {
                          href: "#how",
                          className: "hover:text-[var(--green)]",
                          children: "How it works",
                        }),
                        (0, t.jsx)("a", {
                          href: "#trust",
                          className: "hover:text-[var(--green)]",
                          children: "Trust & Safety",
                        }),
                        (0, t.jsx)("a", {
                          href: "#cities",
                          className: "hover:text-[var(--green)]",
                          children: "Cities",
                        }),
                      ],
                    }),
                    (0, t.jsxs)("div", {
                      className: "hidden items-center gap-2 lg:flex",
                      children: [
                        (0, t.jsx)("a", {
                          href: "/login",
                          className:
                            "rounded-full px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100",
                          children: "Log in",
                        }),
                        (0, t.jsx)("a", {
                          href: "/become-a-helper",
                          className:
                            "rounded-full border border-[var(--navy)] px-4 py-2 text-sm font-bold text-[var(--navy)] hover:bg-slate-50",
                          children: "Become a Helper",
                        }),
                        (0, t.jsx)("a", {
                          href: "/post-a-task",
                          className:
                            "rounded-full bg-[var(--green)] px-5 py-2.5 text-sm font-black text-white shadow-sm hover:brightness-95",
                          children: "Post a Task",
                        }),
                      ],
                    }),
                    (0, t.jsx)("button", {
                      type: "button",
                      onClick: () => h((e) => !e),
                      "aria-label": "Open navigation menu",
                      "aria-expanded": u,
                      className:
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[var(--navy)] shadow-sm lg:hidden",
                      children: u
                        ? (0, t.jsx)("span", {
                            className: "text-3xl font-light leading-none",
                            children: "×",
                          })
                        : (0, t.jsxs)("div", {
                            className: "flex flex-col gap-[5px]",
                            children: [
                              (0, t.jsx)("span", {
                                className:
                                  "block h-[2px] w-5 rounded bg-current",
                              }),
                              (0, t.jsx)("span", {
                                className:
                                  "block h-[2px] w-5 rounded bg-current",
                              }),
                              (0, t.jsx)("span", {
                                className:
                                  "block h-[2px] w-5 rounded bg-current",
                              }),
                            ],
                          }),
                    }),
                  ],
                }),
                u &&
                  (0, t.jsx)("div", {
                    className:
                      "border-t border-slate-100 bg-white shadow-xl lg:hidden",
                    children: (0, t.jsxs)("div", {
                      className: "mx-auto max-w-7xl px-5 py-5",
                      children: [
                        (0, t.jsxs)("nav", {
                          className: "grid",
                          children: [
                            (0, t.jsx)("a", {
                              href: "#services",
                              onClick: N,
                              className:
                                "border-b border-slate-100 py-4 text-base font-bold text-[var(--navy)]",
                              children: "Services",
                            }),
                            (0, t.jsx)("a", {
                              href: "#how",
                              onClick: N,
                              className:
                                "border-b border-slate-100 py-4 text-base font-bold text-[var(--navy)]",
                              children: "How it works",
                            }),
                            (0, t.jsx)("a", {
                              href: "#trust",
                              onClick: N,
                              className:
                                "border-b border-slate-100 py-4 text-base font-bold text-[var(--navy)]",
                              children: "Trust & Safety",
                            }),
                            (0, t.jsx)("a", {
                              href: "#cities",
                              onClick: N,
                              className:
                                "border-b border-slate-100 py-4 text-base font-bold text-[var(--navy)]",
                              children: "Cities",
                            }),
                          ],
                        }),
                        (0, t.jsxs)("div", {
                          className: "mt-5 grid gap-3",
                          children: [
                            (0, t.jsx)("a", {
                              href: "/login",
                              onClick: N,
                              className:
                                "rounded-2xl border border-slate-200 px-5 py-3.5 text-center font-bold text-[var(--navy)]",
                              children: "Log in",
                            }),
                            (0, t.jsx)("a", {
                              href: "/become-a-helper",
                              onClick: N,
                              className:
                                "rounded-2xl border-2 border-[var(--navy)] px-5 py-3.5 text-center font-black text-[var(--navy)]",
                              children: "Become a Helper",
                            }),
                            (0, t.jsx)("a", {
                              href: "/post-a-task",
                              onClick: N,
                              className:
                                "rounded-2xl bg-[var(--green)] px-5 py-4 text-center font-black text-white shadow-sm",
                              children: "Post a Task",
                            }),
                          ],
                        }),
                      ],
                    }),
                  }),
              ],
            }),
            (0, t.jsxs)("section", {
              className: "relative overflow-hidden",
              children: [
                (0, t.jsx)("div", {
                  className: "absolute inset-0 hero-grid opacity-60",
                }),
                (0, t.jsxs)("div", {
                  className:
                    "relative mx-auto grid max-w-7xl gap-10 px-5 pb-14 pt-10 sm:pt-14 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pb-24 lg:pt-20",
                  children: [
                    (0, t.jsxs)("div", {
                      className: "flex flex-col justify-center",
                      children: [
                        (0, t.jsxs)("div", {
                          className:
                            "mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-extrabold text-emerald-800 sm:px-4 sm:text-sm",
                          children: [
                            (0, t.jsx)("span", {
                              className:
                                "h-2 w-2 shrink-0 rounded-full bg-[var(--green)]",
                            }),
                            "Local help, made easier across Canada",
                          ],
                        }),
                        (0, t.jsx)("h1", {
                          className:
                            "max-w-3xl text-[42px] font-black leading-[.98] tracking-[-0.055em] text-[var(--navy)] sm:text-6xl lg:text-7xl",
                          children:
                            "Get reliable help for life's everyday tasks.",
                        }),
                        (0, t.jsx)("p", {
                          className:
                            "mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-xl sm:leading-8",
                          children:
                            "Find trusted local helpers for cleaning, moving, assembly, delivery, errands, home repairs and more — with transparent profiles, reviews, scheduling and secure payments.",
                        }),
                        (0, t.jsx)("div", {
                          className:
                            "mt-7 rounded-[26px] border border-slate-200 bg-white p-3 shadow-[0_18px_60px_rgba(15,23,42,.10)] sm:mt-8",
                          children: (0, t.jsxs)("div", {
                            className:
                              "grid gap-3 md:grid-cols-[1fr_190px_auto]",
                            children: [
                              (0, t.jsxs)("label", {
                                className:
                                  "flex min-h-14 items-center gap-3 rounded-2xl bg-slate-50 px-4",
                                children: [
                                  (0, t.jsx)("span", {
                                    className: "text-xl",
                                    children: "⌕",
                                  }),
                                  (0, t.jsx)("input", {
                                    value: p,
                                    onChange: (e) => x(e.target.value),
                                    className:
                                      "min-w-0 w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400 sm:text-base",
                                    placeholder: "What do you need help with?",
                                  }),
                                ],
                              }),
                              (0, t.jsxs)("label", {
                                className:
                                  "flex min-h-14 items-center gap-3 rounded-2xl bg-slate-50 px-4",
                                children: [
                                  (0, t.jsx)("span", { children: "📍" }),
                                  (0, t.jsx)("input", {
                                    className:
                                      "min-w-0 w-full bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400",
                                    placeholder: "Postal code",
                                  }),
                                ],
                              }),
                              (0, t.jsx)("a", {
                                href: "/post-a-task",
                                className:
                                  "flex min-h-14 items-center justify-center rounded-2xl bg-[var(--green)] px-6 font-black text-white hover:brightness-95",
                                children: "Find help",
                              }),
                            ],
                          }),
                        }),
                        (0, t.jsx)("div", {
                          className: "mt-5 flex flex-wrap gap-2",
                          children: [
                            "Cleaning",
                            "Moving Help",
                            "Furniture Assembly",
                            "Delivery & Errands",
                            "Yard & Outdoor",
                          ].map((e) =>
                            (0, t.jsx)(
                              "button",
                              {
                                onClick: () => x(e),
                                className:
                                  "rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 sm:px-4 sm:text-sm",
                                children: e,
                              },
                              e,
                            ),
                          ),
                        }),
                      ],
                    }),
                    (0, t.jsxs)("div", {
                      className:
                        "relative min-h-[360px] overflow-hidden rounded-[30px] bg-slate-100 shadow-2xl sm:min-h-[460px] lg:min-h-[500px] lg:rounded-[36px]",
                      children: [
                        (0, t.jsx)("img", {
                          src: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1400&q=90",
                          alt: "Local helper providing home services",
                          className:
                            "absolute inset-0 h-full w-full object-cover",
                        }),
                        (0, t.jsx)("div", {
                          className:
                            "absolute inset-x-4 bottom-4 rounded-[24px] bg-white/95 p-4 shadow-xl backdrop-blur sm:inset-x-5 sm:bottom-5 sm:p-5",
                          children: (0, t.jsxs)("div", {
                            className:
                              "flex items-center justify-between gap-3",
                            children: [
                              (0, t.jsxs)("div", {
                                children: [
                                  (0, t.jsx)("div", {
                                    className:
                                      "text-xs font-black text-[var(--green)] sm:text-sm",
                                    children: "Available today",
                                  }),
                                  (0, t.jsx)("div", {
                                    className:
                                      "mt-1 text-base font-black text-[var(--navy)] sm:text-xl",
                                    children:
                                      "Choose by skills, price & reviews",
                                  }),
                                ],
                              }),
                              (0, t.jsxs)("div", {
                                className:
                                  "shrink-0 rounded-2xl bg-slate-950 px-3 py-2 text-center text-white sm:px-4 sm:py-3",
                                children: [
                                  (0, t.jsx)("div", {
                                    className:
                                      "text-[10px] font-bold text-slate-300 sm:text-xs",
                                    children: "Rating",
                                  }),
                                  (0, t.jsx)("div", {
                                    className: "text-sm font-black sm:text-lg",
                                    children: "★ 4.9+",
                                  }),
                                ],
                              }),
                            ],
                          }),
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            (0, t.jsx)("section", {
              id: "services",
              className:
                "border-y border-slate-100 bg-slate-50/70 py-14 lg:py-16",
              children: (0, t.jsxs)("div", {
                className: "mx-auto max-w-7xl px-5 lg:px-8",
                children: [
                  (0, t.jsxs)("div", {
                    className:
                      "flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between",
                    children: [
                      (0, t.jsxs)("div", {
                        children: [
                          (0, t.jsx)("p", {
                            className:
                              "text-sm font-black uppercase tracking-[.18em] text-[var(--green)]",
                            children: "Explore services",
                          }),
                          (0, t.jsx)("h2", {
                            className:
                              "mt-2 text-3xl font-black tracking-[-0.045em] text-[var(--navy)] sm:text-5xl",
                            children: "Help for every kind of to-do.",
                          }),
                        ],
                      }),
                      (0, t.jsx)("div", {
                        className: "-mx-1 flex gap-2 overflow-x-auto px-1 pb-2",
                        children: c.map((r) =>
                          (0, t.jsx)(
                            "button",
                            {
                              onClick: () => m(r),
                              className: `whitespace-nowrap rounded-full px-4 py-2 text-sm font-black ${e === r ? "bg-[var(--navy)] text-white" : "border border-slate-200 bg-white text-slate-600"}`,
                              children: r,
                            },
                            r,
                          ),
                        ),
                      }),
                    ],
                  }),
                  b &&
                    (0, t.jsx)("p", {
                      className: "mt-8 font-semibold text-slate-500",
                      children: "Loading services...",
                    }),
                  y &&
                    (0, t.jsx)("p", {
                      className:
                        "mt-8 rounded-2xl bg-red-50 p-4 font-semibold text-red-600",
                      children: y,
                    }),
                  (0, t.jsx)("div", {
                    className: "mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4",
                    children: w.map((e) =>
                      (0, t.jsxs)(
                        "a",
                        {
                          href: `/services/${e.slug}/`,
                          className:
                            "group overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl",
                          children: [
                            (0, t.jsx)("div", {
                              className:
                                "aspect-[4/3] overflow-hidden bg-slate-100",
                              children: (0, t.jsx)("img", {
                                src: e.displayImage,
                                alt: e.name,
                                className:
                                  "h-full w-full object-cover transition duration-500 group-hover:scale-105",
                              }),
                            }),
                            (0, t.jsxs)("div", {
                              className:
                                "flex items-center justify-between p-5",
                              children: [
                                (0, t.jsxs)("div", {
                                  children: [
                                    (0, t.jsx)("div", {
                                      className: "text-sm text-slate-400",
                                      children: e.displayIcon,
                                    }),
                                    (0, t.jsx)("div", {
                                      className:
                                        "mt-1 text-lg font-black text-[var(--navy)]",
                                      children: e.name,
                                    }),
                                  ],
                                }),
                                (0, t.jsx)("span", {
                                  className:
                                    "grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-lg transition group-hover:bg-[var(--green)] group-hover:text-white",
                                  children: "→",
                                }),
                              ],
                            }),
                          ],
                        },
                        e.id,
                      ),
                    ),
                  }),
                  !b &&
                    !y &&
                    0 === w.length &&
                    (0, t.jsxs)("div", {
                      className:
                        "mt-8 rounded-[26px] border-2 border-dashed border-slate-200 bg-white px-6 py-10 text-center",
                      children: [
                        (0, t.jsxs)("p", {
                          className: "font-black text-[var(--navy)]",
                          children: ["No services found in ", e, "."],
                        }),
                        (0, t.jsx)("p", {
                          className: "mt-2 text-sm text-slate-500",
                          children: "Try another category or search term.",
                        }),
                      ],
                    }),
                ],
              }),
            }),
            (0, t.jsx)("section", {
              id: "trust",
              className: "py-14 lg:py-20",
              children: (0, t.jsx)("div", {
                className:
                  "mx-auto grid max-w-7xl gap-5 px-5 md:grid-cols-3 lg:px-8",
                children: [
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
                ].map(([e, r, a]) =>
                  (0, t.jsxs)(
                    "div",
                    {
                      className:
                        "rounded-[26px] border border-slate-200 p-6 sm:p-7",
                      children: [
                        (0, t.jsx)("div", {
                          className:
                            "grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-xl font-black text-[var(--green)]",
                          children: e,
                        }),
                        (0, t.jsx)("h3", {
                          className:
                            "mt-5 text-2xl font-black tracking-[-.03em] text-[var(--navy)]",
                          children: r,
                        }),
                        (0, t.jsx)("p", {
                          className: "mt-3 leading-7 text-slate-600",
                          children: a,
                        }),
                      ],
                    },
                    r,
                  ),
                ),
              }),
            }),
            (0, t.jsx)("section", {
              id: "how",
              className: "bg-[var(--navy)] py-14 text-white lg:py-20",
              children: (0, t.jsxs)("div", {
                className: "mx-auto max-w-7xl px-5 lg:px-8",
                children: [
                  (0, t.jsxs)("div", {
                    className: "max-w-2xl",
                    children: [
                      (0, t.jsx)("p", {
                        className:
                          "text-sm font-black uppercase tracking-[.18em] text-emerald-300",
                        children: "How it works",
                      }),
                      (0, t.jsx)("h2", {
                        className:
                          "mt-3 text-3xl font-black tracking-[-0.045em] sm:text-5xl",
                        children: "From task to done in three clear steps.",
                      }),
                    ],
                  }),
                  (0, t.jsx)("div", {
                    className: "mt-9 grid gap-5 md:grid-cols-3",
                    children: [
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
                    ].map(([e, r, a]) =>
                      (0, t.jsxs)(
                        "div",
                        {
                          className:
                            "rounded-[26px] border border-white/15 bg-white/5 p-6 sm:p-7",
                          children: [
                            (0, t.jsx)("div", {
                              className: "text-sm font-black text-emerald-300",
                              children: e,
                            }),
                            (0, t.jsx)("h3", {
                              className: "mt-6 text-2xl font-black sm:mt-8",
                              children: r,
                            }),
                            (0, t.jsx)("p", {
                              className: "mt-3 leading-7 text-slate-300",
                              children: a,
                            }),
                          ],
                        },
                        e,
                      ),
                    ),
                  }),
                ],
              }),
            }),
            (0, t.jsx)("section", {
              className: "py-14 lg:py-20",
              children: (0, t.jsxs)("div", {
                className: "mx-auto max-w-7xl px-5 lg:px-8",
                children: [
                  (0, t.jsxs)("div", {
                    className: "flex items-end justify-between gap-6",
                    children: [
                      (0, t.jsxs)("div", {
                        children: [
                          (0, t.jsx)("p", {
                            className:
                              "text-sm font-black uppercase tracking-[.18em] text-[var(--green)]",
                            children: "Top local helpers",
                          }),
                          (0, t.jsx)("h2", {
                            className:
                              "mt-2 text-3xl font-black tracking-[-0.045em] text-[var(--navy)] sm:text-5xl",
                            children: "People you can choose with confidence.",
                          }),
                        ],
                      }),
                      (0, t.jsx)("button", {
                        className:
                          "hidden rounded-full border border-slate-200 px-5 py-2.5 text-sm font-black text-[var(--navy)] md:block",
                        children: "Browse helpers",
                      }),
                    ],
                  }),
                  (0, t.jsx)("div", {
                    className: "mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4",
                    children: n.map((e) =>
                      (0, t.jsxs)(
                        "article",
                        {
                          className:
                            "overflow-hidden rounded-[28px] border border-slate-200 bg-white",
                          children: [
                            (0, t.jsx)("div", {
                              className:
                                "aspect-square overflow-hidden bg-slate-100",
                              children: (0, t.jsx)("img", {
                                src: e.image,
                                alt: e.name,
                                className: "h-full w-full object-cover",
                              }),
                            }),
                            (0, t.jsxs)("div", {
                              className: "p-5",
                              children: [
                                (0, t.jsxs)("div", {
                                  className:
                                    "flex items-start justify-between gap-3",
                                  children: [
                                    (0, t.jsxs)("div", {
                                      children: [
                                        (0, t.jsx)("h3", {
                                          className:
                                            "text-xl font-black text-[var(--navy)]",
                                          children: e.name,
                                        }),
                                        (0, t.jsx)("p", {
                                          className:
                                            "mt-1 text-sm font-semibold text-slate-500",
                                          children: e.role,
                                        }),
                                      ],
                                    }),
                                    (0, t.jsx)("span", {
                                      className:
                                        "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700",
                                      children: "Verified",
                                    }),
                                  ],
                                }),
                                (0, t.jsxs)("div", {
                                  className:
                                    "mt-4 flex items-center justify-between gap-2 text-sm",
                                  children: [
                                    (0, t.jsxs)("span", {
                                      className: "font-black text-slate-800",
                                      children: ["★ ", e.rating],
                                    }),
                                    (0, t.jsxs)("span", {
                                      className: "text-slate-500",
                                      children: [e.jobs, " jobs"],
                                    }),
                                    (0, t.jsx)("span", {
                                      className:
                                        "font-black text-[var(--navy)]",
                                      children: e.price,
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        },
                        e.name,
                      ),
                    ),
                  }),
                ],
              }),
            }),
            (0, t.jsx)("section", {
              className: "bg-slate-50 py-14 lg:py-20",
              children: (0, t.jsx)("div", {
                className: "mx-auto max-w-7xl px-5 lg:px-8",
                children: (0, t.jsxs)("div", {
                  className:
                    "grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center",
                  children: [
                    (0, t.jsxs)("div", {
                      children: [
                        (0, t.jsx)("span", {
                          className:
                            "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[.16em] text-amber-800",
                          children: "Featured this week",
                        }),
                        (0, t.jsx)("h2", {
                          className:
                            "mt-5 text-3xl font-black tracking-[-0.045em] text-[var(--navy)] sm:text-5xl",
                          children: "Quick wins for your home and schedule.",
                        }),
                        (0, t.jsx)("p", {
                          className:
                            "mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8",
                          children:
                            "Discover seasonal services, helpful local picks and practical ways to get more done.",
                        }),
                        (0, t.jsx)("a", {
                          href: "#services",
                          className:
                            "mt-7 inline-block rounded-full bg-[var(--navy)] px-6 py-3 font-black text-white",
                          children: "See featured services",
                        }),
                      ],
                    }),
                    (0, t.jsx)("div", {
                      className: "grid gap-5 sm:grid-cols-2",
                      children: [
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
                      ].map(([e, r, a]) =>
                        (0, t.jsxs)(
                          "article",
                          {
                            className:
                              "overflow-hidden rounded-[26px] bg-white shadow-sm",
                            children: [
                              (0, t.jsx)("img", {
                                src: a,
                                alt: e,
                                className: "aspect-[4/3] w-full object-cover",
                              }),
                              (0, t.jsxs)("div", {
                                className: "p-5",
                                children: [
                                  (0, t.jsx)("h3", {
                                    className:
                                      "text-xl font-black text-[var(--navy)]",
                                    children: e,
                                  }),
                                  (0, t.jsx)("p", {
                                    className: "mt-2 leading-6 text-slate-600",
                                    children: r,
                                  }),
                                  (0, t.jsx)("a", {
                                    href: "#services",
                                    className:
                                      "mt-4 inline-block text-sm font-black text-[var(--green)]",
                                    children: "Explore →",
                                  }),
                                ],
                              }),
                            ],
                          },
                          e,
                        ),
                      ),
                    }),
                  ],
                }),
              }),
            }),
            (0, t.jsx)("section", {
              id: "cities",
              className: "py-14 lg:py-20",
              children: (0, t.jsx)("div", {
                className: "mx-auto max-w-7xl px-5 lg:px-8",
                children: (0, t.jsx)("div", {
                  className:
                    "rounded-[30px] bg-emerald-50 p-6 sm:p-10 lg:rounded-[36px] lg:p-12",
                  children: (0, t.jsxs)("div", {
                    className:
                      "grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end",
                    children: [
                      (0, t.jsxs)("div", {
                        children: [
                          (0, t.jsx)("p", {
                            className:
                              "text-sm font-black uppercase tracking-[.18em] text-[var(--green)]",
                            children: "Growing across Canada",
                          }),
                          (0, t.jsx)("h2", {
                            className:
                              "mt-3 text-3xl font-black tracking-[-.045em] text-[var(--navy)] sm:text-4xl",
                            children: "Find help near you.",
                          }),
                          (0, t.jsx)("p", {
                            className: "mt-4 leading-7 text-slate-600",
                            children:
                              "Discover local helpers and services across major Canadian cities.",
                          }),
                        ],
                      }),
                      (0, t.jsx)("div", {
                        className: "grid grid-cols-2 gap-3 sm:grid-cols-4",
                        children: o.map((e) =>
                          (0, t.jsx)(
                            "a",
                            {
                              href: "#services",
                              className:
                                "rounded-2xl bg-white px-3 py-3 text-center text-sm font-black text-[var(--navy)] shadow-sm transition hover:-translate-y-0.5 sm:px-4",
                              children: e,
                            },
                            e,
                          ),
                        ),
                      }),
                    ],
                  }),
                }),
              }),
            }),
            (0, t.jsx)("section", {
              className: "pb-14 lg:pb-20",
              children: (0, t.jsx)("div", {
                className: "mx-auto max-w-7xl px-5 lg:px-8",
                children: (0, t.jsxs)("div", {
                  className:
                    "overflow-hidden rounded-[30px] bg-[var(--navy)] px-6 py-11 text-center text-white sm:px-10 lg:rounded-[36px] lg:py-16",
                  children: [
                    (0, t.jsx)("p", {
                      className:
                        "text-sm font-black uppercase tracking-[.18em] text-emerald-300",
                      children: "Earn with UrbanHelpHub",
                    }),
                    (0, t.jsx)("h2", {
                      className:
                        "mx-auto mt-3 max-w-3xl text-3xl font-black tracking-[-0.045em] sm:text-5xl",
                      children:
                        "Turn your skills and free time into meaningful local work.",
                    }),
                    (0, t.jsx)("p", {
                      className:
                        "mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8",
                      children:
                        "Create a profile, choose the services you offer, set your availability and build your reputation.",
                    }),
                    (0, t.jsx)("a", {
                      href: "/become-a-helper",
                      className:
                        "mt-8 inline-block rounded-full bg-[var(--green)] px-7 py-3.5 font-black text-white",
                      children: "Become a Helper",
                    }),
                  ],
                }),
              }),
            }),
            (0, t.jsxs)("footer", {
              className: "border-t border-slate-200 bg-white",
              children: [
                (0, t.jsxs)("div", {
                  className:
                    "mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-5 lg:px-8",
                  children: [
                    (0, t.jsxs)("div", {
                      className: "lg:col-span-2",
                      children: [
                        (0, t.jsx)("img", {
                          src: "/UrbanHelpHub-logo.png",
                          alt: "UrbanHelpHub",
                          className:
                            "h-14 w-auto max-w-[240px] object-contain sm:h-16",
                        }),
                        (0, t.jsx)("p", {
                          className: "mt-4 max-w-sm leading-7 text-slate-500",
                          children:
                            "A Canadian marketplace connecting people who need help with trusted local people ready to work.",
                        }),
                      ],
                    }),
                    [
                      [
                        "Explore",
                        ["Services", "Cities", "How it works", "Safety"],
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
                        ["About", "Contact", "Privacy", "Terms", "Refunds"],
                      ],
                    ].map(([e, r]) =>
                      (0, t.jsxs)(
                        "div",
                        {
                          children: [
                            (0, t.jsx)("h3", {
                              className: "font-black text-[var(--navy)]",
                              children: e,
                            }),
                            (0, t.jsx)("div", {
                              className:
                                "mt-4 grid gap-3 text-sm font-semibold text-slate-500",
                              children: r.map((e) =>
                                (0, t.jsx)(
                                  "a",
                                  {
                                    href: i[e] || "#",
                                    className: "hover:text-[var(--green)]",
                                    children: e,
                                  },
                                  e,
                                ),
                              ),
                            }),
                          ],
                        },
                        e,
                      ),
                    ),
                  ],
                }),
                (0, t.jsx)("div", {
                  className:
                    "border-t border-slate-100 px-5 py-5 text-center text-xs font-semibold text-slate-400",
                  children: "© 2026 UrbanHelpHub. Canada.",
                }),
              ],
            }),
          ],
        });
      },
    ]);
  },
  54858,
  (e) => {
    "use strict";
    e.i(47167);
    let t = (
      "https://api.urbanhelphub.com/api".trim() || "http://127.0.0.1:8000/api"
    ).replace(/\/$/, "");
    e.s(["API_URL", 0, t]);
  },
  22016,
  (e, t, r) => {
    "use strict";
    (e.i(47167), Object.defineProperty(r, "__esModule", { value: !0 }));
    var a = {
      default: function () {
        return g;
      },
      useLinkStatus: function () {
        return v;
      },
    };
    for (var s in a) Object.defineProperty(r, s, { enumerable: !0, get: a[s] });
    let l = e.r(90809),
      n = e.r(43476),
      o = l._(e.r(71645)),
      i = e.r(95057),
      c = e.r(8372),
      d = e.r(18581),
      m = e.r(18967),
      p = e.r(5550),
      x = e.r(88540),
      u = e.r(91949),
      h = e.r(73668),
      f = e.r(9396);
    function g(t) {
      var r;
      let a,
        s,
        l,
        [g, v] = (0, o.useOptimistic)(u.IDLE_LINK_STATUS),
        y = (0, o.useRef)(null),
        {
          href: j,
          as: w,
          children: N,
          prefetch: k = null,
          passHref: C,
          replace: P,
          shallow: S,
          scroll: E,
          onClick: _,
          onMouseEnter: T,
          onTouchStart: O,
          legacyBehavior: R = !1,
          onNavigate: L,
          transitionTypes: H,
          ref: A,
          unstable_dynamicOnHover: M,
          ...U
        } = t;
      ((a = N),
        R &&
          ("string" == typeof a || "number" == typeof a) &&
          (a = (0, n.jsx)("a", { children: a })));
      let $ = o.default.useContext(c.AppRouterContext),
        I = !1 !== k,
        q = !1 === k ? "none" : !0 === k ? "full" : "auto",
        F =
          "none" !== q
            ? "auto" === q
              ? f.FetchStrategy.PPR
              : f.FetchStrategy.Full
            : f.FetchStrategy.PPR,
        B = "string" == typeof (r = w || j) ? r : (0, i.formatUrl)(r);
      if (R) {
        if (a?.$$typeof === Symbol.for("react.lazy"))
          throw Object.defineProperty(
            Error(
              "`<Link legacyBehavior>` received a direct child that is either a Server Component, or JSX that was loaded with React.lazy(). This is not supported. Either remove legacyBehavior, or make the direct child a Client Component that renders the Link's `<a>` tag.",
            ),
            "__NEXT_ERROR_CODE",
            { value: "E863", enumerable: !1, configurable: !0 },
          );
        s = o.default.Children.only(a);
      }
      let D = R ? s && "object" == typeof s && s.ref : A,
        K,
        z = o.default.useCallback(
          (e) => (
            null !== $ &&
              (y.current = (0, u.mountLinkInstance)(e, B, $, F, I, v, K)),
            () => {
              (y.current &&
                ((0, u.unmountLinkForCurrentNavigation)(y.current),
                (y.current = null)),
                (0, u.unmountPrefetchableInstance)(e));
            }
          ),
          [I, B, $, F, v, K],
        ),
        V = {
          ref: (0, d.useMergedRef)(z, D),
          onClick(t) {
            (R || "function" != typeof _ || _(t),
              R &&
                s.props &&
                "function" == typeof s.props.onClick &&
                s.props.onClick(t),
              !$ ||
                t.defaultPrevented ||
                (function (t, r, a, s, l, n, i, c = "none") {
                  if ("u" > typeof window) {
                    let d,
                      { nodeName: m } = t.currentTarget;
                    if (
                      ("A" === m.toUpperCase() &&
                        (((d = t.currentTarget.getAttribute("target")) &&
                          "_self" !== d) ||
                          t.metaKey ||
                          t.ctrlKey ||
                          t.shiftKey ||
                          t.altKey ||
                          (t.nativeEvent && 2 === t.nativeEvent.which))) ||
                      t.currentTarget.hasAttribute("download")
                    )
                      return;
                    if (!(0, h.isLocalURL)(r)) {
                      s && (t.preventDefault(), location.replace(r));
                      return;
                    }
                    if ((t.preventDefault(), n)) {
                      let e = !1;
                      if (
                        (n({
                          preventDefault: () => {
                            e = !0;
                          },
                        }),
                        e)
                      )
                        return;
                    }
                    let { dispatchNavigateAction: p } = e.r(99781);
                    o.default.startTransition(() => {
                      p(
                        r,
                        s ? "replace" : "push",
                        !1 === l
                          ? x.ScrollBehavior.NoScroll
                          : x.ScrollBehavior.Default,
                        a.current,
                        i,
                        c,
                      );
                    });
                  }
                })(t, B, y, P, E, L, H, q));
          },
          onMouseEnter(e) {
            (R || "function" != typeof T || T(e),
              R &&
                s.props &&
                "function" == typeof s.props.onMouseEnter &&
                s.props.onMouseEnter(e),
              $ && I && (0, u.onNavigationIntent)(e.currentTarget, !0 === M));
          },
          onTouchStart: function (e) {
            (R || "function" != typeof O || O(e),
              R &&
                s.props &&
                "function" == typeof s.props.onTouchStart &&
                s.props.onTouchStart(e),
              $ && I && (0, u.onNavigationIntent)(e.currentTarget, !0 === M));
          },
        };
      return (
        (0, m.isAbsoluteUrl)(B)
          ? (V.href = B)
          : (R && !C && ("a" !== s.type || "href" in s.props)) ||
            (V.href = (0, p.addBasePath)(B)),
        (l = R
          ? o.default.cloneElement(s, V)
          : (0, n.jsx)("a", { ...U, ...V, children: a })),
        (0, n.jsx)(b.Provider, { value: g, children: l })
      );
    }
    let b = (0, o.createContext)(u.IDLE_LINK_STATUS),
      v = () => (0, o.useContext)(b);
    ("function" == typeof r.default ||
      ("object" == typeof r.default && null !== r.default)) &&
      void 0 === r.default.__esModule &&
      (Object.defineProperty(r.default, "__esModule", { value: !0 }),
      Object.assign(r.default, r),
      (t.exports = r.default));
  },
  18581,
  (e, t, r) => {
    "use strict";
    (Object.defineProperty(r, "__esModule", { value: !0 }),
      Object.defineProperty(r, "useMergedRef", {
        enumerable: !0,
        get: function () {
          return s;
        },
      }));
    let a = e.r(71645);
    function s(e, t) {
      let r = (0, a.useRef)(null),
        s = (0, a.useRef)(null);
      return (0, a.useCallback)(
        (a) => {
          if (null === a) {
            let e = r.current;
            e && ((r.current = null), e());
            let t = s.current;
            t && ((s.current = null), t());
          } else (e && (r.current = l(e, a)), t && (s.current = l(t, a)));
        },
        [e, t],
      );
    }
    function l(e, t) {
      if ("function" != typeof e)
        return (
          (e.current = t),
          () => {
            e.current = null;
          }
        );
      {
        let r = e(t);
        return "function" == typeof r ? r : () => e(null);
      }
    }
    ("function" == typeof r.default ||
      ("object" == typeof r.default && null !== r.default)) &&
      void 0 === r.default.__esModule &&
      (Object.defineProperty(r.default, "__esModule", { value: !0 }),
      Object.assign(r.default, r),
      (t.exports = r.default));
  },
  18967,
  (e, t, r) => {
    "use strict";
    (e.i(47167), Object.defineProperty(r, "__esModule", { value: !0 }));
    var a = {
      DecodeError: function () {
        return g;
      },
      MiddlewareNotFoundError: function () {
        return j;
      },
      MissingStaticPage: function () {
        return y;
      },
      NormalizeError: function () {
        return b;
      },
      PageNotFoundError: function () {
        return v;
      },
      SP: function () {
        return h;
      },
      ST: function () {
        return f;
      },
      WEB_VITALS: function () {
        return l;
      },
      execOnce: function () {
        return n;
      },
      getDisplayName: function () {
        return m;
      },
      getLocationOrigin: function () {
        return c;
      },
      getURL: function () {
        return d;
      },
      isAbsoluteUrl: function () {
        return i;
      },
      isResSent: function () {
        return p;
      },
      loadGetInitialProps: function () {
        return u;
      },
      normalizeRepeatedSlashes: function () {
        return x;
      },
      stringifyError: function () {
        return w;
      },
    };
    for (var s in a) Object.defineProperty(r, s, { enumerable: !0, get: a[s] });
    let l = ["CLS", "FCP", "FID", "INP", "LCP", "TTFB"];
    function n(e) {
      let t,
        r = !1;
      return (...a) => (r || ((r = !0), (t = e(...a))), t);
    }
    let o = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/,
      i = (e) => {
        let t = e.charCodeAt(0);
        return !!((t >= 65 && t <= 90) || (t >= 97 && t <= 122)) && o.test(e);
      };
    function c() {
      let { protocol: e, hostname: t, port: r } = window.location;
      return `${e}//${t}${r ? ":" + r : ""}`;
    }
    function d() {
      let { href: e } = window.location,
        t = c();
      return e.substring(t.length);
    }
    function m(e) {
      return "string" == typeof e ? e : e.displayName || e.name || "Unknown";
    }
    function p(e) {
      return e.finished || e.headersSent;
    }
    function x(e) {
      let t = e.split("?");
      return (
        t[0].replace(/\\/g, "/").replace(/\/\/+/g, "/") +
        (t[1] ? `?${t.slice(1).join("?")}` : "")
      );
    }
    async function u(e, t) {
      let r = t.res || (t.ctx && t.ctx.res);
      if (!e.getInitialProps)
        return t.ctx && t.Component
          ? { pageProps: await u(t.Component, t.ctx) }
          : {};
      let a = await e.getInitialProps(t);
      if (r && p(r)) return a;
      if (!a)
        throw Object.defineProperty(
          Error(
            `"${m(e)}.getInitialProps()" should resolve to an object. But found "${a}" instead.`,
          ),
          "__NEXT_ERROR_CODE",
          { value: "E1025", enumerable: !1, configurable: !0 },
        );
      return a;
    }
    let h = "u" > typeof performance,
      f =
        h &&
        ["mark", "measure", "getEntriesByName"].every(
          (e) => "function" == typeof performance[e],
        );
    class g extends Error {}
    class b extends Error {}
    class v extends Error {
      constructor(e) {
        (super(),
          (this.code = "ENOENT"),
          (this.name = "PageNotFoundError"),
          (this.message = `Cannot find module for page: ${e}`));
      }
    }
    class y extends Error {
      constructor(e, t) {
        (super(),
          (this.message = `Failed to load static file for page: ${e} ${t}`));
      }
    }
    class j extends Error {
      constructor() {
        (super(),
          (this.code = "ENOENT"),
          (this.message = "Cannot find the middleware module"));
      }
    }
    function w(e) {
      return JSON.stringify({ message: e.message, stack: e.stack });
    }
  },
  73668,
  (e, t, r) => {
    "use strict";
    (Object.defineProperty(r, "__esModule", { value: !0 }),
      Object.defineProperty(r, "isLocalURL", {
        enumerable: !0,
        get: function () {
          return l;
        },
      }));
    let a = e.r(18967),
      s = e.r(52817);
    function l(e) {
      if (!(0, a.isAbsoluteUrl)(e)) return !0;
      try {
        let t = (0, a.getLocationOrigin)(),
          r = new URL(e, t);
        return r.origin === t && (0, s.hasBasePath)(r.pathname);
      } catch (e) {
        return !1;
      }
    }
  },
  98183,
  (e, t, r) => {
    "use strict";
    Object.defineProperty(r, "__esModule", { value: !0 });
    var a = {
      assign: function () {
        return i;
      },
      searchParamsToUrlQuery: function () {
        return l;
      },
      urlQueryToSearchParams: function () {
        return o;
      },
    };
    for (var s in a) Object.defineProperty(r, s, { enumerable: !0, get: a[s] });
    function l(e) {
      let t = {};
      for (let [r, a] of e.entries()) {
        let e = t[r];
        void 0 === e
          ? (t[r] = a)
          : Array.isArray(e)
            ? e.push(a)
            : (t[r] = [e, a]);
      }
      return t;
    }
    function n(e) {
      return "string" == typeof e
        ? e
        : ("number" != typeof e || isNaN(e)) && "boolean" != typeof e
          ? ""
          : String(e);
    }
    function o(e) {
      let t = new URLSearchParams();
      for (let [r, a] of Object.entries(e))
        if (Array.isArray(a)) for (let e of a) t.append(r, n(e));
        else t.set(r, n(a));
      return t;
    }
    function i(e, ...t) {
      for (let r of t) {
        for (let t of r.keys()) e.delete(t);
        for (let [t, a] of r.entries()) e.append(t, a);
      }
      return e;
    }
  },
  95057,
  (e, t, r) => {
    "use strict";
    (e.i(47167), Object.defineProperty(r, "__esModule", { value: !0 }));
    var a = {
      formatUrl: function () {
        return o;
      },
      formatWithValidation: function () {
        return c;
      },
      urlObjectKeys: function () {
        return i;
      },
    };
    for (var s in a) Object.defineProperty(r, s, { enumerable: !0, get: a[s] });
    let l = e.r(90809)._(e.r(98183)),
      n = /https?|ftp|gopher|file/;
    function o(e) {
      let { auth: t, hostname: r } = e,
        a = e.protocol || "",
        s = e.pathname || "",
        o = e.hash || "",
        i = e.query || "",
        c = !1;
      ((t = t ? encodeURIComponent(t).replace(/%3A/i, ":") + "@" : ""),
        e.host
          ? (c = t + e.host)
          : r &&
            ((c = t + (~r.indexOf(":") ? `[${r}]` : r)),
            e.port && (c += ":" + e.port)),
        i && "object" == typeof i && (i = String(l.urlQueryToSearchParams(i))));
      let d = e.search || (i && `?${i}`) || "";
      return (
        a && !a.endsWith(":") && (a += ":"),
        e.slashes || ((!a || n.test(a)) && !1 !== c)
          ? ((c = "//" + (c || "")), s && "/" !== s[0] && (s = "/" + s))
          : c || (c = ""),
        o && "#" !== o[0] && (o = "#" + o),
        d && "?" !== d[0] && (d = "?" + d),
        (s = s.replace(/[?#]/g, encodeURIComponent)),
        (d = d.replace("#", "%23")),
        `${a}${c}${s}${d}${o}`
      );
    }
    let i = [
      "auth",
      "hash",
      "host",
      "hostname",
      "href",
      "path",
      "pathname",
      "port",
      "protocol",
      "query",
      "search",
      "slashes",
    ];
    function c(e) {
      return o(e);
    }
  },
]);
