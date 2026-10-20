(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  "object" == typeof document ? document.currentScript : void 0,
  23261,
  (e) => {
    "use strict";
    var t = e.i(43476),
      s = e.i(71645),
      a = e.i(18566),
      r = e.i(86561),
      n = e.i(51005),
      l = e.i(36329),
      i = e.i(19133),
      o = e.i(54858);
    function c() {
      return (
        sessionStorage.getItem("urbanhelphub_token") ||
        localStorage.getItem("urbanhelphub_token")
      );
    }
    function d() {
      (sessionStorage.removeItem("urbanhelphub_token"),
        sessionStorage.removeItem("urbanhelphub_user"),
        localStorage.removeItem("urbanhelphub_token"),
        localStorage.removeItem("urbanhelphub_user"));
    }
    function x({ name: e, className: s = "h-5 w-5" }) {
      let a = {
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 2,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      };
      return "dashboard" === e
        ? (0, t.jsxs)("svg", {
            viewBox: "0 0 24 24",
            className: s,
            ...a,
            children: [
              (0, t.jsx)("rect", {
                x: "3",
                y: "3",
                width: "7",
                height: "7",
                rx: "1",
              }),
              (0, t.jsx)("rect", {
                x: "14",
                y: "3",
                width: "7",
                height: "7",
                rx: "1",
              }),
              (0, t.jsx)("rect", {
                x: "3",
                y: "14",
                width: "7",
                height: "7",
                rx: "1",
              }),
              (0, t.jsx)("rect", {
                x: "14",
                y: "14",
                width: "7",
                height: "7",
                rx: "1",
              }),
            ],
          })
        : "helpers" === e || "users" === e
          ? (0, t.jsxs)("svg", {
              viewBox: "0 0 24 24",
              className: s,
              ...a,
              children: [
                (0, t.jsx)("path", {
                  d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
                }),
                (0, t.jsx)("circle", { cx: "9", cy: "7", r: "4" }),
                (0, t.jsx)("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
                (0, t.jsx)("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" }),
              ],
            })
          : "customers" === e
            ? (0, t.jsxs)("svg", {
                viewBox: "0 0 24 24",
                className: s,
                ...a,
                children: [
                  (0, t.jsx)("circle", { cx: "12", cy: "8", r: "4" }),
                  (0, t.jsx)("path", { d: "M4 21a8 8 0 0 1 16 0" }),
                ],
              })
            : "tasks" === e
              ? (0, t.jsxs)("svg", {
                  viewBox: "0 0 24 24",
                  className: s,
                  ...a,
                  children: [
                    (0, t.jsx)("rect", {
                      x: "4",
                      y: "3",
                      width: "16",
                      height: "18",
                      rx: "2",
                    }),
                    (0, t.jsx)("path", { d: "m8 9 2 2 4-4" }),
                    (0, t.jsx)("path", { d: "M8 15h8" }),
                  ],
                })
              : "payments" === e
                ? (0, t.jsxs)("svg", {
                    viewBox: "0 0 24 24",
                    className: s,
                    ...a,
                    children: [
                      (0, t.jsx)("rect", {
                        x: "2",
                        y: "5",
                        width: "20",
                        height: "14",
                        rx: "2",
                      }),
                      (0, t.jsx)("path", { d: "M2 10h20" }),
                      (0, t.jsx)("path", { d: "M6 15h2" }),
                    ],
                  })
                : "shield" === e
                  ? (0, t.jsxs)("svg", {
                      viewBox: "0 0 24 24",
                      className: s,
                      ...a,
                      children: [
                        (0, t.jsx)("path", {
                          d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z",
                        }),
                        (0, t.jsx)("path", { d: "m9 12 2 2 4-4" }),
                      ],
                    })
                  : "search" === e
                    ? (0, t.jsxs)("svg", {
                        viewBox: "0 0 24 24",
                        className: s,
                        ...a,
                        children: [
                          (0, t.jsx)("circle", { cx: "11", cy: "11", r: "7" }),
                          (0, t.jsx)("path", { d: "m20 20-4-4" }),
                        ],
                      })
                    : "arrow" === e
                      ? (0, t.jsxs)("svg", {
                          viewBox: "0 0 24 24",
                          className: s,
                          ...a,
                          children: [
                            (0, t.jsx)("path", { d: "M5 12h14" }),
                            (0, t.jsx)("path", { d: "m13 6 6 6-6 6" }),
                          ],
                        })
                      : "chevron" === e
                        ? (0, t.jsx)("svg", {
                            viewBox: "0 0 24 24",
                            className: s,
                            ...a,
                            children: (0, t.jsx)("path", {
                              d: "m9 18 6-6-6-6",
                            }),
                          })
                        : "check" === e
                          ? (0, t.jsxs)("svg", {
                              viewBox: "0 0 24 24",
                              className: s,
                              ...a,
                              children: [
                                (0, t.jsx)("circle", {
                                  cx: "12",
                                  cy: "12",
                                  r: "9",
                                }),
                                (0, t.jsx)("path", { d: "m8 12 3 3 5-6" }),
                              ],
                            })
                          : "clock" === e
                            ? (0, t.jsxs)("svg", {
                                viewBox: "0 0 24 24",
                                className: s,
                                ...a,
                                children: [
                                  (0, t.jsx)("circle", {
                                    cx: "12",
                                    cy: "12",
                                    r: "9",
                                  }),
                                  (0, t.jsx)("path", { d: "M12 7v5l3 2" }),
                                ],
                              })
                            : "menu" === e
                              ? (0, t.jsxs)("svg", {
                                  viewBox: "0 0 24 24",
                                  className: s,
                                  ...a,
                                  children: [
                                    (0, t.jsx)("path", { d: "M4 6h16" }),
                                    (0, t.jsx)("path", { d: "M4 12h16" }),
                                    (0, t.jsx)("path", { d: "M4 18h16" }),
                                  ],
                                })
                              : "logout" === e
                                ? (0, t.jsxs)("svg", {
                                    viewBox: "0 0 24 24",
                                    className: s,
                                    ...a,
                                    children: [
                                      (0, t.jsx)("path", {
                                        d: "M10 17l5-5-5-5",
                                      }),
                                      (0, t.jsx)("path", { d: "M15 12H3" }),
                                      (0, t.jsx)("path", {
                                        d: "M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5",
                                      }),
                                    ],
                                  })
                                : "refresh" === e
                                  ? (0, t.jsxs)("svg", {
                                      viewBox: "0 0 24 24",
                                      className: s,
                                      ...a,
                                      children: [
                                        (0, t.jsx)("path", { d: "M20 6v5h-5" }),
                                        (0, t.jsx)("path", { d: "M4 18v-5h5" }),
                                        (0, t.jsx)("path", {
                                          d: "M18.5 9A7 7 0 0 0 6 6.5L4 9",
                                        }),
                                        (0, t.jsx)("path", {
                                          d: "M5.5 15A7 7 0 0 0 18 17.5l2-2.5",
                                        }),
                                      ],
                                    })
                                  : (0, t.jsxs)("svg", {
                                      viewBox: "0 0 24 24",
                                      className: s,
                                      ...a,
                                      children: [
                                        (0, t.jsx)("circle", {
                                          cx: "12",
                                          cy: "12",
                                          r: "9",
                                        }),
                                        (0, t.jsx)("path", { d: "M12 8v5" }),
                                        (0, t.jsx)("path", { d: "M12 17h.01" }),
                                      ],
                                    });
    }
    function m(e) {
      return e
        ? e.replaceAll("_", " ").replace(/\b\w/g, (e) => e.toUpperCase())
        : "Pending";
    }
    function p(e) {
      return e
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((e) => e.charAt(0))
        .join("")
        .toUpperCase();
    }
    function h({ icon: e, label: s, active: a = !1, badge: r, onClick: n }) {
      return (0, t.jsxs)("button", {
        type: "button",
        title: `${s} section`,
        onClick: n,
        className: `flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-green-50 ${a ? "bg-[#082f5b] text-white" : "text-slate-600 hover:bg-green-50 hover:text-[#238f39]"}`,
        children: [
          (0, t.jsxs)("span", {
            className: "flex items-center gap-3",
            children: [(0, t.jsx)(x, { name: e, className: "h-4 w-4" }), s],
          }),
          "number" == typeof r && r > 0
            ? (0, t.jsx)("span", {
                className: `min-w-6 rounded-full px-2 py-0.5 text-center text-xs ${a ? "bg-green-400 text-[#082f5b]" : "bg-amber-100 text-amber-700"}`,
                children: r,
              })
            : !a &&
              (0, t.jsx)(x, {
                name: "chevron",
                className: "h-4 w-4 opacity-40",
              }),
        ],
      });
    }
    function u({
      title: e,
      value: s,
      note: a,
      icon: r,
      action: n,
      attention: l = !1,
      onClick: uhhAction,
    }) {
      return (0, t.jsxs)("button", {
        type: "button", onClick: uhhAction,
        className:
          "group w-full cursor-pointer rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-green-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-green-50 active:translate-y-0 sm:p-6",
        children: [
          (0, t.jsxs)("div", {
            className: "flex items-start justify-between gap-4",
            children: [
              (0, t.jsxs)("div", {
                children: [
                  (0, t.jsx)("p", {
                    className: "text-sm font-semibold text-slate-500",
                    children: e,
                  }),
                  (0, t.jsx)("p", {
                    className: "mt-2 text-3xl font-bold text-[#082f5b]",
                    children: s,
                  }),
                ],
              }),
              (0, t.jsx)("div", {
                className: `flex h-11 w-11 items-center justify-center rounded-xl transition ${l ? "bg-amber-50 text-amber-700" : "bg-[#eef4f8] text-[#082f5b] group-hover:bg-green-50 group-hover:text-[#238f39]"}`,
                children: (0, t.jsx)(x, { name: r }),
              }),
            ],
          }),
          (0, t.jsx)("p", {
            className: "mt-3 text-xs text-slate-500",
            children: a,
          }),
          (0, t.jsxs)("div", {
            className:
              "mt-4 flex items-center gap-1.5 text-sm font-bold text-[#238f39]",
            children: [
              n,
              (0, t.jsx)(x, {
                name: "arrow",
                className:
                  "h-4 w-4 transition-transform group-hover:translate-x-1",
              }),
            ],
          }),
        ],
      });
    }
    function f({ value: e }) {
      let s = e.toLowerCase(),
        a =
          "verified" === s ||
          "approved" === s ||
          "active" === s ||
          "paid" === s ||
          "completed" === s
            ? "bg-green-50 text-[#238f39]"
            : "rejected" === s || "suspended" === s
              ? "bg-red-50 text-red-600"
              : "bg-amber-50 text-amber-700";
      return (0, t.jsx)("span", {
        className: `rounded-full px-2.5 py-1 text-xs font-bold ${a}`,
        children: m(e),
      });
    }
    function b({ value: e, label: s }) {
      return (0, t.jsxs)("div", {
        className: "rounded-2xl bg-[#f7f9fc] p-4",
        children: [
          (0, t.jsx)("p", {
            className: "text-2xl font-bold text-[#082f5b]",
            children: e,
          }),
          (0, t.jsx)("p", {
            className: "mt-1 text-xs font-semibold text-slate-500",
            children: s,
          }),
        ],
      });
    }
    function g({ label: e, value: s }) {
      return (0, t.jsxs)("div", {
        className: "min-w-28 rounded-2xl bg-[#f6f8fb] px-4 py-3",
        children: [
          (0, t.jsx)("p", {
            className: "text-lg font-bold text-[#082f5b]",
            children: s,
          }),
          (0, t.jsx)("p", {
            className: "mt-1 text-[11px] font-semibold text-slate-500",
            children: e,
          }),
        ],
      });
    }
    e.s([
      "default",
      0,
      function () {
        let { t: e } = (0, i.useLanguage)(),
          j = (0, a.useRouter)(),
          [v, w] = (0, s.useState)(null),
          [y, N] = (0, s.useState)([]),
          [k, _] = (0, s.useState)([]),
          [C, A] = (0, s.useState)([]),
          [$, S] = (0, s.useState)(!0),
          [U, M] = (0, s.useState)(!1),
          [H, I] = (0, s.useState)(""),
          [L, P] = (0, s.useState)(""),
          [R, B] = (0, s.useState)("pending"),
          [E, T] = (0, s.useState)(!1),
          [O, z] = (0, s.useState)(!1),
          [D, V] = (0, s.useState)(null),
          [G, J] = (0, s.useState)(null),
          q = (0, s.useCallback)(
            async (e = !1) => {
              let t = c();
              if (!t) return void j.replace("/login");
              (e ? M(!0) : S(!0), I(""));
              try {
                let e = {
                    Accept: "application/json",
                    Authorization: `Bearer ${t}`,
                  },
                  [s, a, r, n] = await Promise.all([
                    fetch(`${o.API_URL}/admin/review/summary`, {
                      headers: e,
                      cache: "no-store",
                    }),
                    fetch(`${o.API_URL}/admin/review/helpers?status=${R}`, {
                      headers: e,
                      cache: "no-store",
                    }),
                    fetch(`${o.API_URL}/admin/payments`, {
                      headers: e,
                      cache: "no-store",
                    }),
                    fetch(`${o.API_URL}/admin/tasks?status=pending_approval`, {
                      headers: e,
                      cache: "no-store",
                    }),
                  ]);
                if (
                  401 === s.status ||
                  401 === a.status ||
                  401 === r.status ||
                  401 === n.status
                ) {
                  (d(), j.replace("/login"));
                  return;
                }
                if (
                  403 === s.status ||
                  403 === a.status ||
                  403 === r.status ||
                  403 === n.status
                )
                  return void j.replace("/dashboard");
                let l = await s.json(),
                  i = await a.json(),
                  c = await r.json(),
                  x = await n.json();
                if (!s.ok)
                  throw Error(
                    l.message || "Unable to load the Admin dashboard.",
                  );
                if (!a.ok)
                  throw Error(
                    i.message || "Unable to load Helper applications.",
                  );
                if (!r.ok)
                  throw Error(c.message || "Unable to load payment activity.");
                if (!n.ok)
                  throw Error(x.message || "Unable to load task approvals.");
                (w(l.data), N(i.data || []), _(c.data || []), A(x.data || []));
              } catch (e) {
                I(
                  e instanceof Error
                    ? e.message
                    : "Unable to load the Admin dashboard.",
                );
              } finally {
                (S(!1), M(!1));
              }
            },
            [R, j],
          );
        (0, s.useEffect)(() => {
          q();
        }, [q]);
        let F = (0, s.useMemo)(() => {
          let e = L.trim().toLowerCase();
          return e
            ? y.filter((t) => {
                let s =
                  `${t.city || ""} ${t.province || ""} ${t.postal_code || ""}`.toLowerCase();
                return (
                  t.name.toLowerCase().includes(e) ||
                  t.email.toLowerCase().includes(e) ||
                  s.includes(e)
                );
              })
            : y;
        }, [y, L]);
        async function K() {
          if (O) return;
          z(!0);
          let e = c();
          try {
            e &&
              (await fetch(`${o.API_URL}/logout`, {
                method: "POST",
                headers: {
                  Accept: "application/json",
                  Authorization: `Bearer ${e}`,
                },
              }));
          } catch {
          } finally {
            (d(), j.replace("/login"));
          }
        }
        async function W(e, t, s) {
          let a =
            "paid" === s
              ? `Mark this ${"payments" === e ? "Customer payment" : "Helper payout"} as paid?`
              : `Mark this ${"payments" === e ? "payment" : "payout"} as failed?`;
          if (!window.confirm(a)) return;
          let r = c();
          if (r) {
            (V(`${e}-${t}`), I(""));
            try {
              let a = await fetch(`${o.API_URL}/admin/${e}/${t}/status`, {
                  method: "PUT",
                  headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${r}`,
                  },
                  body: JSON.stringify({ status: s }),
                }),
                n = await a.json();
              if (!a.ok || !n.success)
                throw Error(n.message || "Unable to update financial status.");
              await q(!0);
            } catch (e) {
              I(
                e instanceof Error
                  ? e.message
                  : "Unable to update financial status.",
              );
            } finally {
              V(null);
            }
          }
        }
        async function Z(e, t) {
          let s = "";
          if ("rejected" === t) {
            if (
              !(s =
                window
                  .prompt(
                    "Explain why this task is being rejected. The Customer will see this reason:",
                    "",
                  )
                  ?.trim() || "")
            )
              return;
          } else if (
            !window.confirm(
              "Approve and publish this task to matching Helpers?",
            )
          )
            return;
          let a = c();
          if (a) {
            (J(e), I(""));
            try {
              let r = await fetch(`${o.API_URL}/admin/tasks/${e}/approval`, {
                  method: "PUT",
                  headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${a}`,
                  },
                  body: JSON.stringify({ decision: t, reason: s }),
                }),
                n = await r.json();
              if (!r.ok || !n.success)
                throw Error(n.message || "Unable to review this task.");
              await q(!0);
            } catch (e) {
              I(e instanceof Error ? e.message : "Unable to review this task.");
            } finally {
              J(null);
            }
          }
        }
        if ($)
          return (0, t.jsxs)("main", {
            className: "min-h-screen bg-[#f6f8fb]",
            children: [
              (0, t.jsx)("header", {
                className: "border-b border-slate-200 bg-white",
                children: (0, t.jsx)("div", {
                  className:
                    "mx-auto flex max-w-[1500px] items-center px-6 py-4",
                  children: (0, t.jsx)("img", {
                    src: "/UrbanHelpHub-logo.png",
                    alt: "UrbanHelpHub",
                    className: "h-10 w-auto",
                  }),
                }),
              }),
              (0, t.jsx)("div", {
                className: "flex min-h-[75vh] items-center justify-center",
                children: (0, t.jsxs)("div", {
                  className: "text-center",
                  children: [
                    (0, t.jsx)("div", {
                      className:
                        "mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-200 border-t-[#2fad45]",
                    }),
                    (0, t.jsx)("p", {
                      className: "mt-4 font-semibold text-slate-600",
                      children: "Loading Admin workspace...",
                    }),
                  ],
                }),
              }),
            ],
          });
        if (H || !v)
          return (0, t.jsx)("main", {
            className: "min-h-screen bg-[#f6f8fb]",
            children: (0, t.jsxs)("div", {
              className: "mx-auto max-w-xl px-6 py-24 text-center",
              children: [
                (0, t.jsx)("img", {
                  src: "/UrbanHelpHub-logo.png",
                  alt: "UrbanHelpHub",
                  className: "mx-auto h-10 w-auto",
                }),
                (0, t.jsxs)("div", {
                  className:
                    "mt-8 rounded-3xl border border-red-200 bg-white p-8 shadow-sm",
                  children: [
                    (0, t.jsx)("div", {
                      className:
                        "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600",
                      children: (0, t.jsx)(x, { name: "alert" }),
                    }),
                    (0, t.jsx)("h1", {
                      className: "mt-5 text-2xl font-bold text-[#082f5b]",
                      children: "Admin workspace unavailable",
                    }),
                    (0, t.jsx)("p", {
                      className: "mt-3 leading-6 text-slate-600",
                      children: H,
                    }),
                    (0, t.jsxs)("button", {
                      type: "button",
                      onClick: () => q(),
                      className:
                        "mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#082f5b] px-5 py-3 font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#06264a] focus:outline-none focus:ring-4 focus:ring-blue-100 active:translate-y-0",
                      children: [
                        (0, t.jsx)(x, {
                          name: "refresh",
                          className: "h-4 w-4",
                        }),
                        "Try again",
                      ],
                    }),
                  ],
                }),
              ],
            }),
          });
        function uhhHelpers(status) { B(status); P(""); document.getElementById("uhh-helper-queue")?.scrollIntoView({behavior:"smooth"}); }
        let Q = v.stats;
        return (0, t.jsxs)("main", {
          className: "min-h-screen bg-[#f6f8fb] text-slate-900",
          children: [
            (0, t.jsxs)("header", {
              className:
                "sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur",
              children: [
                (0, t.jsxs)("div", {
                  className:
                    "mx-auto flex max-w-[1500px] items-center justify-between px-5 py-4 sm:px-7",
                  children: [
                    (0, t.jsxs)("div", {
                      className: "flex items-center gap-8",
                      children: [
                        (0, t.jsx)("button", {
                          type: "button",
                          onClick: () => j.push("/admin"),
                          className: "cursor-pointer",
                          "aria-label": "Admin dashboard",
                          children: (0, t.jsx)("img", {
                            src: "/UrbanHelpHub-logo.png",
                            alt: "UrbanHelpHub",
                            className: "h-9 w-auto sm:h-10",
                          }),
                        }),
                        (0, t.jsx)("span", {
                          className:
                            "hidden rounded-full bg-[#082f5b] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white md:inline-flex",
                          children: "Admin",
                        }),
                      ],
                    }),
                    (0, t.jsxs)("div", {
                      className: "hidden items-center gap-4 sm:flex",
                      children: [
                        (0, t.jsx)(n.default, {}),
                        (0, t.jsx)(r.default, {}),
                        (0, t.jsxs)("div", {
                          className: "text-right",
                          children: [
                            (0, t.jsx)("p", {
                              className: "text-sm font-bold text-[#082f5b]",
                              children: v.admin.name,
                            }),
                            (0, t.jsx)("p", {
                              className: "text-xs text-slate-500",
                              children: e("administrator"),
                            }),
                          ],
                        }),
                        (0, t.jsx)("div", {
                          className:
                            "flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-sm font-bold text-[#238f39]",
                          children: p(v.admin.name),
                        }),
                        (0, t.jsxs)("button", {
                          type: "button",
                          onClick: K,
                          disabled: O,
                          title: "Sign out of Admin",
                          className:
                            "inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-4 focus:ring-red-50 disabled:cursor-not-allowed disabled:opacity-50",
                          children: [
                            (0, t.jsx)(x, {
                              name: "logout",
                              className: "h-4 w-4",
                            }),
                            O ? "Signing out..." : "Logout",
                          ],
                        }),
                      ],
                    }),
                    (0, t.jsx)("button", {
                      type: "button",
                      onClick: () => T((e) => !e),
                      className:
                        "flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-[#082f5b] transition hover:bg-slate-50 sm:hidden",
                      "aria-label": "Open Admin menu",
                      children: (0, t.jsx)(x, { name: "menu" }),
                    }),
                  ],
                }),
                E &&
                  (0, t.jsxs)("div", {
                    className:
                      "border-t border-slate-100 bg-white px-5 py-4 sm:hidden",
                    children: [
                      (0, t.jsx)("p", {
                        className: "font-bold text-[#082f5b]",
                        children: v.admin.name,
                      }),
                      (0, t.jsxs)("button", {
                        type: "button",
                        onClick: K,
                        className:
                          "mt-3 flex w-full cursor-pointer items-center gap-2 rounded-xl bg-red-50 px-4 py-3 font-bold text-red-600",
                        children: [
                          (0, t.jsx)(x, {
                            name: "logout",
                            className: "h-4 w-4",
                          }),
                          "Logout",
                        ],
                      }),
                    ],
                  }),
              ],
            }),
            (0, t.jsxs)("div", {
              className: "mx-auto flex max-w-[1500px]",
              children: [
                (0, t.jsxs)("aside", {
                  className:
                    "hidden min-h-[calc(100vh-73px)] w-64 shrink-0 border-r border-slate-200 bg-white p-5 lg:block",
                  children: [
                    (0, t.jsx)("p", {
                      className:
                        "px-3 pb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400",
                      children: "Workspace",
                    }),
                    (0, t.jsxs)("div", {
                      className: "space-y-1",
                      children: [
                        (0, t.jsx)(h, {
                          icon: "dashboard",
                          label: e("dashboard"), onClick: () => window.scrollTo({top:0,behavior:"smooth"}),
                          active: !0,
                        }),
                        (0, t.jsx)(h, {
                          icon: "helpers",
                          label: e("helpers"), onClick: () => uhhHelpers("all"),
                          badge: Q.pending_helpers,
                        }),
                        (0, t.jsx)(h, {
                          icon: "customers",
                          label: e("customers"), onClick: () => window.location.assign("/admin/customers/"),
                        }),
                        (0, t.jsx)(h, {icon:"customers",label:"Profile approvals",badge:Q.pending_customer_profiles,onClick:()=>window.location.assign("/admin/profile-approvals/")}),
                        (0, t.jsx)(h, {
                          icon: "tasks",
                          label: "Tasks",
                          badge: Q.pending_tasks,
                          onClick: () =>
                            document
                              .getElementById("task-approvals")
                              ?.scrollIntoView({ behavior: "smooth" }),
                        }),
                        (0, t.jsx)(h, {
                          icon: "payments",
                          label: e("payments"),
                          badge: Q.pending_payments + Q.pending_payouts,
                          onClick: () =>
                            document
                              .getElementById("payments")
                              ?.scrollIntoView({ behavior: "smooth" }),
                        }),
                        (0, t.jsx)(h, {
                          icon: "shield",
                          label: "Verification", onClick: () => uhhHelpers("pending"),
                          badge: Q.pending_services,
                        }),
                      ],
                    }),
                    (0, t.jsxs)("div", {
                      className: "mt-8 rounded-2xl bg-[#eef4f8] p-4",
                      children: [
                        (0, t.jsx)("div", {
                          className:
                            "flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#082f5b]",
                          children: (0, t.jsx)(x, {
                            name: "shield",
                            className: "h-5 w-5",
                          }),
                        }),
                        (0, t.jsx)("p", {
                          className: "mt-3 text-sm font-bold text-[#082f5b]",
                          children: "Protected Admin area",
                        }),
                        (0, t.jsx)("p", {
                          className: "mt-1 text-xs leading-5 text-slate-500",
                          children:
                            "Admin actions are checked again by the Laravel API.",
                        }),
                      ],
                    }),
                  ],
                }),
                (0, t.jsxs)("div", {
                  className: "min-w-0 flex-1",
                  children: [
                    (0, t.jsx)("section", {
                      className: "bg-[#082f5b]",
                      children: (0, t.jsx)("div", {
                        className: "px-5 py-9 sm:px-8 lg:px-10",
                        children: (0, t.jsxs)("div", {
                          className:
                            "flex flex-col gap-5 md:flex-row md:items-end md:justify-between",
                          children: [
                            (0, t.jsxs)("div", {
                              children: [
                                (0, t.jsx)("p", {
                                  className:
                                    "text-xs font-bold uppercase tracking-[0.18em] text-green-300",
                                  children: "Operations overview",
                                }),
                                (0, t.jsxs)("h1", {
                                  className:
                                    "mt-2 text-3xl font-bold text-white sm:text-4xl",
                                  children: [
                                    e("administrator"),
                                    " ",
                                    e("dashboard"),
                                  ],
                                }),
                                (0, t.jsx)("p", {
                                  className:
                                    "mt-3 max-w-2xl leading-7 text-slate-200",
                                  children:
                                    "Review Helper applications, verification and marketplace activity.",
                                }),
                              ],
                            }),
                            (0, t.jsxs)("button", {
                              type: "button",
                              onClick: () => q(!0),
                              disabled: U,
                              className:
                                "inline-flex cursor-pointer items-center justify-center gap-2 self-start rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/20 focus:outline-none focus:ring-4 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60 md:self-auto",
                              children: [
                                (0, t.jsx)(x, {
                                  name: "refresh",
                                  className: `h-4 w-4 ${U ? "animate-spin" : ""}`,
                                }),
                                U ? "Refreshing..." : e("refreshData"),
                              ],
                            }),
                          ],
                        }),
                      }),
                    }),
                    (0, t.jsxs)("section", {
                      className: "px-5 py-7 sm:px-8 lg:px-10",
                      children: [
                        (0, t.jsxs)("div", {
                          className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
                          children: [
                            (0, t.jsx)(u, {
                              title: "Pending Helpers",
                              onClick: () => uhhHelpers("pending"),
                              value: Q.pending_helpers,
                              note: "Need application review",
                              icon: "clock",
                              action: "Review queue",
                              attention: Q.pending_helpers > 0,
                            }),
                            (0, t.jsx)(u, {
                              title: "Active Helpers",
                              onClick: () => uhhHelpers("active"),
                              value: Q.active_helpers,
                              note: `${Q.verified_helpers} verified`,
                              icon: "check",
                              action: "View Helpers",
                            }),
                            (0, t.jsx)(u, {
                              title: "Customers",
                              onClick: () => window.location.assign("/admin/customers/"),
                              value: Q.total_customers,
                              note: "Registered customers",
                              icon: "customers",
                              action: "View customers",
                            }),
                            (0, t.jsx)(u, {
                              title: "Total Helpers",
                              onClick: () => uhhHelpers("all"),
                              value: Q.total_helpers,
                              note: `${Q.inactive_helpers || 0} inactive accounts · ${Q.pending_services} services pending`,
                              icon: "helpers",
                              action: "Manage Helpers",
                            }),
                          ],
                        }),
                        (0, t.jsxs)("div", {
                          className:
                            "mt-8 rounded-3xl border border-slate-200 bg-white shadow-sm",
                          children: [
                            (0, t.jsx)("div", {
                              className: "border-b border-slate-100 p-5 sm:p-7",
                              children: (0, t.jsxs)("div", {
                                className:
                                  "flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between",
                                children: [
                                  (0, t.jsxs)("div", {
                                    children: [
                                      (0, t.jsxs)("div", {
                                        className: "flex items-center gap-3",
                                        children: [
                                          (0, t.jsx)("h2", {id:"uhh-helper-queue",
                                            className:
                                              "text-xl font-bold text-[#082f5b]",
                                            children: "Helper review queue",
                                          }),
                                          Q.pending_helpers > 0 &&
                                            (0, t.jsxs)("span", {
                                              className:
                                                "rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700",
                                              children: [
                                                Q.pending_helpers,
                                                " need attention",
                                              ],
                                            }),
                                        ],
                                      }),
                                      (0, t.jsx)("p", {
                                        className:
                                          "mt-1 text-sm text-slate-500",
                                        children:
                                          "Select an application to review its services, verification and approval status.",
                                      }),
                                    ],
                                  }),
                                  (0, t.jsxs)("div", {
                                    className:
                                      "flex flex-col gap-3 sm:flex-row",
                                    children: [
                                      (0, t.jsxs)("div", {
                                        className: "relative",
                                        children: [
                                          (0, t.jsx)(x, {
                                            name: "search",
                                            className:
                                              "absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400",
                                          }),
                                          (0, t.jsx)("input", {
                                            type: "search",
                                            value: L,
                                            onChange: (e) => P(e.target.value),
                                            placeholder: "Search Helpers...",
                                            className:
                                              "w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#2fad45] focus:ring-4 focus:ring-green-50 sm:w-64",
                                          }),
                                        ],
                                      }),
                                      (0, t.jsxs)("select", {
                                        value: R,
                                        onChange: (e) => B(e.target.value),
                                        className:
                                          "cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#082f5b] outline-none transition focus:border-[#2fad45] focus:ring-4 focus:ring-green-50",
                                        "aria-label": "Filter Helpers",
                                        children: [
                                          (0, t.jsx)("option", {
                                            value: "pending",
                                            children: "Needs attention",
                                          }),
                                          (0, t.jsx)("option", {value:"inactive",children:"Inactive / suspended accounts"}),
                                          (0, t.jsx)("option", {
                                            value: "all",
                                            children: "All Helpers",
                                          }),
                                          (0, t.jsx)("option", {
                                            value: "verified",
                                            children: "Verified",
                                          }),
                                          (0, t.jsx)("option", {
                                            value: "active",
                                            children: "Active",
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            }),
                            F.length > 0
                              ? (0, t.jsx)("div", {
                                  className: "divide-y divide-slate-100",
                                  children: F.map((e) =>
                                    (0, t.jsxs)(
                                      "button",
                                      {
                                        type: "button",
                                        onClick: () =>
                                          j.push(`/admin/helpers/${e.id}`),
                                        className:
                                          "group flex w-full cursor-pointer flex-col gap-5 p-5 text-left transition hover:bg-[#f8fbf9] focus:bg-[#f8fbf9] focus:outline-none sm:p-7 xl:flex-row xl:items-center xl:justify-between",
                                        children: [
                                          (0, t.jsxs)("div", {
                                            className:
                                              "flex min-w-0 items-start gap-4",
                                            children: [
                                              (0, t.jsx)("div", {
                                                className:
                                                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eef4f8] font-bold text-[#082f5b] transition group-hover:bg-green-50 group-hover:text-[#238f39]",
                                                children: p(e.name),
                                              }),
                                              (0, t.jsxs)("div", {
                                                className: "min-w-0",
                                                children: [
                                                  (0, t.jsxs)("div", {
                                                    className:
                                                      "flex flex-wrap items-center gap-2",
                                                    children: [
                                                      (0, t.jsx)("h3", {
                                                        className:
                                                          "font-bold text-[#082f5b] group-hover:text-[#238f39]",
                                                        children: e.name,
                                                      }),
                                                      (0, t.jsx)(f, {
                                                        value:
                                                          e.verification_status ||
                                                          "pending",
                                                      }),
                                                      (0,t.jsx)("span",{className:"rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700",children: e.status === "active" ? "Account active" : `Login blocked: ${e.status || "inactive"}`}),
                                                    ],
                                                  }),
                                                  (0, t.jsx)("p", {
                                                    className:
                                                      "mt-1 truncate text-sm text-slate-500",
                                                    children: e.email,
                                                  }),
                                                  (0, t.jsxs)("div", {
                                                    className:
                                                      "mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500",
                                                    children: [
                                                      (0, t.jsxs)("span", {
                                                        children: [
                                                          e.city ||
                                                            "Location not set",
                                                          e.province
                                                            ? `, ${e.province}`
                                                            : "",
                                                        ],
                                                      }),
                                                      (0, t.jsxs)("span", {
                                                        children: [
                                                          e.pending_services,
                                                          " pending",
                                                          " ",
                                                          1 ===
                                                          e.pending_services
                                                            ? "service"
                                                            : "services",
                                                        ],
                                                      }),
                                                      (0, t.jsxs)("span", {
                                                        children: [
                                                          e.approved_services,
                                                          " approved",
                                                        ],
                                                      }),
                                                    ],
                                                  }),
                                                ],
                                              }),
                                            ],
                                          }),
                                          (0, t.jsxs)("div", {
                                            className:
                                              "flex items-center justify-between gap-4 sm:justify-start xl:justify-end",
                                            children: [
                                              e.pending_services > 0 &&
                                                (0, t.jsxs)("span", {
                                                  className:
                                                    "inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700",
                                                  children: [
                                                    (0, t.jsx)(x, {
                                                      name: "clock",
                                                      className: "h-3.5 w-3.5",
                                                    }),
                                                    "Action needed",
                                                  ],
                                                }),
                                              (0, t.jsxs)("span", {
                                                className:
                                                  "inline-flex items-center gap-2 rounded-xl bg-[#082f5b] px-4 py-2.5 text-sm font-bold text-white transition group-hover:bg-[#2fad45]",
                                                children: [
                                                  "Review",
                                                  (0, t.jsx)(x, {
                                                    name: "arrow",
                                                    className:
                                                      "h-4 w-4 transition-transform group-hover:translate-x-1",
                                                  }),
                                                ],
                                              }),
                                            ],
                                          }),
                                        ],
                                      },
                                      e.id,
                                    ),
                                  ),
                                })
                              : (0, t.jsxs)("div", {
                                  className: "px-6 py-16 text-center",
                                  children: [
                                    (0, t.jsx)("div", {
                                      className:
                                        "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-[#238f39]",
                                      children: (0, t.jsx)(x, {
                                        name: "check",
                                      }),
                                    }),
                                    (0, t.jsx)("h3", {
                                      className:
                                        "mt-4 font-bold text-[#082f5b]",
                                      children: L
                                        ? "No Helpers match your search"
                                        : "No Helpers in this queue",
                                    }),
                                    (0, t.jsx)("p", {
                                      className:
                                        "mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500",
                                      children: L
                                        ? "Try another name, email or location."
                                        : "Applications that need attention will appear here.",
                                    }),
                                  ],
                                }),
                          ],
                        }),
                        (0, t.jsxs)("div", {
                          className: "mt-8 grid gap-6 xl:grid-cols-2",
                          children: [
                            (0, t.jsxs)("div", {
                              className:
                                "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm",
                              children: [
                                (0, t.jsxs)("div", {
                                  className: "flex items-start justify-between",
                                  children: [
                                    (0, t.jsxs)("div", {
                                      children: [
                                        (0, t.jsx)("h2", {
                                          className:
                                            "text-lg font-bold text-[#082f5b]",
                                          children: "Verification workload",
                                        }),
                                        (0, t.jsx)("p", {
                                          className:
                                            "mt-1 text-sm text-slate-500",
                                          children:
                                            "Current Helper approval state",
                                        }),
                                      ],
                                    }),
                                    (0, t.jsx)("div", {
                                      className:
                                        "flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4f8] text-[#082f5b]",
                                      children: (0, t.jsx)(x, {
                                        name: "shield",
                                      }),
                                    }),
                                  ],
                                }),
                                (0, t.jsxs)("div", {
                                  className: "mt-6 grid grid-cols-2 gap-4",
                                  children: [
                                    (0, t.jsx)(b, {
                                      value: Q.pending_services,
                                      label: "Services pending",
                                    }),
                                    (0, t.jsx)(b, {
                                      value: Q.verified_helpers,
                                      label: "Verified Helpers",
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            (0, t.jsxs)("div", {
                              className:
                                "rounded-3xl bg-[#082f5b] p-6 text-white shadow-sm",
                              children: [
                                (0, t.jsxs)("div", {
                                  className:
                                    "flex items-start justify-between gap-5",
                                  children: [
                                    (0, t.jsxs)("div", {
                                      children: [
                                        (0, t.jsx)("p", {
                                          className:
                                            "text-xs font-bold uppercase tracking-[0.14em] text-green-300",
                                          children: "Next priority",
                                        }),
                                        (0, t.jsx)("h2", {
                                          className: "mt-2 text-xl font-bold",
                                          children:
                                            "Review pending Helper applications",
                                        }),
                                        (0, t.jsx)("p", {
                                          className:
                                            "mt-2 max-w-lg text-sm leading-6 text-slate-200",
                                          children:
                                            "Check identity status, service experience and requirements before activating a Helper.",
                                        }),
                                      ],
                                    }),
                                    (0, t.jsx)(x, {
                                      name: "arrow",
                                      className:
                                        "h-6 w-6 shrink-0 text-green-300",
                                    }),
                                  ],
                                }),
                                F[0] &&
                                  (0, t.jsxs)("button", {
                                    type: "button",
                                    onClick: () =>
                                      j.push(`/admin/helpers/${F[0].id}`),
                                    className:
                                      "mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#082f5b] transition hover:-translate-y-0.5 hover:bg-green-50 focus:outline-none focus:ring-4 focus:ring-white/20 active:translate-y-0",
                                    children: [
                                      "Review next application",
                                      (0, t.jsx)(x, {
                                        name: "arrow",
                                        className: "h-4 w-4",
                                      }),
                                    ],
                                  }),
                              ],
                            }),
                          ],
                        }),
                        (0, t.jsxs)("section", {
                          id: "task-approvals",
                          className:
                            "mt-8 scroll-mt-24 rounded-3xl border border-slate-200 bg-white shadow-sm",
                          children: [
                            (0, t.jsxs)("div", {
                              className:
                                "flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7",
                              children: [
                                (0, t.jsxs)("div", {
                                  children: [
                                    (0, t.jsxs)("div", {
                                      className: "flex items-center gap-3",
                                      children: [
                                        (0, t.jsx)("h2", {
                                          className:
                                            "text-xl font-bold text-[#082f5b]",
                                          children: "Customer task approvals",
                                        }),
                                        Q.pending_tasks > 0 &&
                                          (0, t.jsxs)("span", {
                                            className:
                                              "rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700",
                                            children: [
                                              Q.pending_tasks,
                                              " awaiting review",
                                            ],
                                          }),
                                      ],
                                    }),
                                    (0, t.jsx)("p", {
                                      className: "mt-1 text-sm text-slate-500",
                                      children:
                                        "Review safety, clarity, schedule and location before notifying Helpers.",
                                    }),
                                  ],
                                }),
                                (0, t.jsx)(x, {
                                  name: "tasks",
                                  className: "h-7 w-7 text-[#082f5b]",
                                }),
                              ],
                            }),
                            0 === C.length
                              ? (0, t.jsxs)("div", {
                                  className: "px-6 py-14 text-center",
                                  children: [
                                    (0, t.jsx)("div", {
                                      className:
                                        "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700",
                                      children: (0, t.jsx)(x, {
                                        name: "check",
                                      }),
                                    }),
                                    (0, t.jsx)("p", {
                                      className:
                                        "mt-4 font-bold text-[#082f5b]",
                                      children: "No tasks awaiting approval",
                                    }),
                                  ],
                                })
                              : (0, t.jsx)("div", {
                                  className: "divide-y divide-slate-100",
                                  children: C.map((e) =>
                                    (0, t.jsx)(
                                      "article",
                                      {
                                        className: "p-5 sm:p-7",
                                        children: (0, t.jsxs)("div", {
                                          className:
                                            "flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between",
                                          children: [
                                            (0, t.jsxs)("div", {
                                              className: "min-w-0",
                                              children: [
                                                (0, t.jsxs)("div", {
                                                  className:
                                                    "flex flex-wrap items-center gap-2",
                                                  children: [
                                                    (0, t.jsx)("span", {
                                                      className:
                                                        "rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700",
                                                      children: e.service_name,
                                                    }),
                                                    (0, t.jsx)("span", {
                                                      className:
                                                        "rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700",
                                                      children:
                                                        "Pending approval",
                                                    }),
                                                  ],
                                                }),
                                                (0, t.jsxs)("h3", {
                                                  className:
                                                    "mt-3 text-lg font-bold text-[#082f5b]",
                                                  children: [
                                                    "#",
                                                    e.id,
                                                    " · ",
                                                    e.title,
                                                  ],
                                                }),
                                                (0, t.jsx)("p", {
                                                  className:
                                                    "mt-2 max-w-3xl text-sm leading-6 text-slate-600",
                                                  children: e.description,
                                                }),
                                                (0, t.jsxs)("div", {
                                                  className:
                                                    "mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500",
                                                  children: [
                                                    (0, t.jsxs)("span", {
                                                      children: [
                                                        "Customer: ",
                                                        e.customer_name,
                                                        " (",
                                                        e.customer_email,
                                                        ")",
                                                      ],
                                                    }),
                                                    (0, t.jsxs)("span", {
                                                      children: [
                                                        "📍 ",
                                                        [
                                                          e.address_line_1,
                                                          e.city,
                                                          e.province,
                                                          e.postal_code,
                                                        ]
                                                          .filter(Boolean)
                                                          .join(", "),
                                                      ],
                                                    }),
                                                    (0, t.jsxs)("span", {
                                                      children: [
                                                        "📅 ",
                                                        e.scheduled_date ||
                                                          "Flexible",
                                                        " ",
                                                        e.scheduled_start_time?.slice(
                                                          0,
                                                          5,
                                                        ) || "",
                                                      ],
                                                    }),
                                                  ],
                                                }),
                                              ],
                                            }),
                                            (0, t.jsxs)("div", {
                                              className: "flex shrink-0 gap-2",
                                              children: [
                                                (0, t.jsx)("button", {
                                                  type: "button",
                                                  disabled: G === e.id,
                                                  onClick: () =>
                                                    Z(e.id, "approved"),
                                                  className:
                                                    "rounded-xl bg-[#2fad45] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50",
                                                  children:
                                                    G === e.id
                                                      ? "Reviewing..."
                                                      : "✓ Approve & publish",
                                                }),
                                                (0, t.jsx)("button", {
                                                  type: "button",
                                                  disabled: G === e.id,
                                                  onClick: () =>
                                                    Z(e.id, "rejected"),
                                                  className:
                                                    "rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 disabled:opacity-50",
                                                  children: "Reject",
                                                }),
                                              ],
                                            }),
                                          ],
                                        }),
                                      },
                                      e.id,
                                    ),
                                  ),
                                }),
                          ],
                        }),
                        (0, t.jsxs)("section", {
                          id: "payments",
                          className:
                            "mt-8 scroll-mt-24 rounded-3xl border border-slate-200 bg-white shadow-sm",
                          children: [
                            (0, t.jsx)("div", {
                              className: "border-b border-slate-100 p-5 sm:p-7",
                              children: (0, t.jsxs)("div", {
                                className:
                                  "flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between",
                                children: [
                                  (0, t.jsxs)("div", {
                                    children: [
                                      (0, t.jsx)("p", {
                                        className:
                                          "text-xs font-bold uppercase tracking-[0.16em] text-[#238f39]",
                                        children: "Marketplace finance",
                                      }),
                                      (0, t.jsx)("h2", {
                                        className:
                                          "mt-2 text-xl font-bold text-[#082f5b]",
                                        children: "Payments and commissions",
                                      }),
                                      (0, t.jsx)("p", {
                                        className:
                                          "mt-1 text-sm text-slate-500",
                                        children:
                                          "Monitor Customer payments, UrbanHelpHub fees and Helper payouts.",
                                      }),
                                    ],
                                  }),
                                  (0, t.jsxs)("div", {
                                    className:
                                      "grid grid-cols-2 gap-3 sm:grid-cols-4",
                                    children: [
                                      (0, t.jsx)(g, {
                                        label: "Gross volume",
                                        value: (0, l.formatMoney)(
                                          Q.gross_volume,
                                          "CAD",
                                        ),
                                      }),
                                      (0, t.jsx)(g, {
                                        label: "Platform fees",
                                        value: (0, l.formatMoney)(
                                          Q.platform_revenue,
                                          "CAD",
                                        ),
                                      }),
                                      (0, t.jsx)(g, {
                                        label: "Payments pending",
                                        value: String(Q.pending_payments),
                                      }),
                                      (0, t.jsx)(g, {
                                        label: "Payouts pending",
                                        value: String(Q.pending_payouts),
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            }),
                            0 === k.length
                              ? (0, t.jsx)("div", {
                                  className:
                                    "px-6 py-14 text-center text-sm font-semibold text-slate-500",
                                  children:
                                    "Completed-task payments will appear here.",
                                })
                              : (0, t.jsx)("div", {
                                  className: "divide-y divide-slate-100",
                                  children: k.map((e) =>
                                    (0, t.jsx)(
                                      "article",
                                      {
                                        className: "p-5 sm:p-7",
                                        children: (0, t.jsxs)("div", {
                                          className:
                                            "flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between",
                                          children: [
                                            (0, t.jsxs)("div", {
                                              className: "min-w-0",
                                              children: [
                                                (0, t.jsxs)("div", {
                                                  className:
                                                    "flex flex-wrap items-center gap-2",
                                                  children: [
                                                    (0, t.jsxs)("h3", {
                                                      className:
                                                        "font-bold text-[#082f5b]",
                                                      children: [
                                                        "#",
                                                        e.task_id,
                                                        " · ",
                                                        e.task_title,
                                                      ],
                                                    }),
                                                    (0, t.jsx)(f, {
                                                      value: e.status,
                                                    }),
                                                  ],
                                                }),
                                                (0, t.jsxs)("p", {
                                                  className:
                                                    "mt-1 text-sm text-slate-500",
                                                  children: [
                                                    e.customer_name,
                                                    " → ",
                                                    e.helper_name || "Helper",
                                                    " · ",
                                                    e.provider,
                                                  ],
                                                }),
                                                (0, t.jsxs)("div", {
                                                  className:
                                                    "mt-3 flex flex-wrap gap-4 text-sm font-semibold text-slate-600",
                                                  children: [
                                                    (0, t.jsxs)("span", {
                                                      children: [
                                                        "Customer total: ",
                                                        (0, l.formatMoney)(
                                                          e.total_amount,
                                                          e.currency,
                                                        ),
                                                      ],
                                                    }),
                                                    (0, t.jsxs)("span", {
                                                      children: [
                                                        "CAD total: ",
                                                        (0, l.formatMoney)(
                                                          e.settlement_total_amount,
                                                          "CAD",
                                                        ),
                                                      ],
                                                    }),
                                                    (0, t.jsxs)("span", {
                                                      children: [
                                                        "CAD fee: ",
                                                        (0, l.formatMoney)(
                                                          e.settlement_platform_fee,
                                                          "CAD",
                                                        ),
                                                      ],
                                                    }),
                                                    (0, t.jsxs)("span", {
                                                      children: [
                                                        "CAD Helper net: ",
                                                        (0, l.formatMoney)(
                                                          e.settlement_helper_net,
                                                          "CAD",
                                                        ),
                                                      ],
                                                    }),
                                                    (0, t.jsxs)("span", {
                                                      children: [
                                                        "Payout: ",
                                                        m(e.payout_status),
                                                      ],
                                                    }),
                                                  ],
                                                }),
                                              ],
                                            }),
                                            (0, t.jsxs)("div", {
                                              className: "flex flex-wrap gap-2",
                                              children: [
                                                "stripe" === e.provider &&
                                                  "paid" !== e.status &&
                                                  (0, t.jsx)("span", {
                                                    className:
                                                      "rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700",
                                                    children:
                                                      "Managed by Stripe",
                                                  }),
                                                "stripe" !== e.provider &&
                                                  "pending" === e.status &&
                                                  (0, t.jsxs)(t.Fragment, {
                                                    children: [
                                                      (0, t.jsx)("button", {
                                                        type: "button",
                                                        disabled:
                                                          D ===
                                                          `payments-${e.id}`,
                                                        onClick: () =>
                                                          W(
                                                            "payments",
                                                            e.id,
                                                            "paid",
                                                          ),
                                                        className:
                                                          "rounded-xl bg-[#2fad45] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50",
                                                        children:
                                                          "Mark payment paid",
                                                      }),
                                                      (0, t.jsx)("button", {
                                                        type: "button",
                                                        disabled:
                                                          D ===
                                                          `payments-${e.id}`,
                                                        onClick: () =>
                                                          W(
                                                            "payments",
                                                            e.id,
                                                            "failed",
                                                          ),
                                                        className:
                                                          "rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 disabled:opacity-50",
                                                        children: "Mark failed",
                                                      }),
                                                    ],
                                                  }),
                                                "stripe" !== e.provider &&
                                                  "paid" === e.status &&
                                                  e.payout_id &&
                                                  "pending" ===
                                                    e.payout_status &&
                                                  (0, t.jsx)("button", {
                                                    type: "button",
                                                    disabled:
                                                      D ===
                                                      `payouts-${e.payout_id}`,
                                                    onClick: () =>
                                                      W(
                                                        "payouts",
                                                        e.payout_id,
                                                        "paid",
                                                      ),
                                                    className:
                                                      "rounded-xl bg-[#082f5b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50",
                                                    children:
                                                      "Release Helper payout",
                                                  }),
                                                "paid" === e.payout_status &&
                                                  (0, t.jsx)("span", {
                                                    className:
                                                      "rounded-xl bg-green-50 px-4 py-2.5 text-sm font-bold text-green-700",
                                                    children: "✓ Settled",
                                                  }),
                                              ],
                                            }),
                                          ],
                                        }),
                                      },
                                      e.id,
                                    ),
                                  ),
                                }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        });
      },
    ]);
  },
  86561,
  (e) => {
    "use strict";
    var t = e.i(43476),
      s = e.i(71645),
      a = e.i(18566),
      r = e.i(54858);
    function n() {
      return (
        sessionStorage.getItem("urbanhelphub_token") ||
        localStorage.getItem("urbanhelphub_token")
      );
    }
    e.s([
      "default",
      0,
      function () {
        let e = (0, a.useRouter)(),
          [l, i] = (0, s.useState)(!1),
          [o, c] = (0, s.useState)([]),
          [d, x] = (0, s.useState)(0),
          [m, p] = (0, s.useState)(!0),
          h = (0, s.useRef)(null);
        async function u() {
          let e = n();
          if (e)
            try {
              let t = await fetch(`${r.API_URL}/notifications`, {
                  headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${e}`,
                  },
                }),
                s = await t.json();
              t.ok &&
                s.success &&
                (c(s.data.notifications || []),
                x(Number(s.data.unread_count || 0)));
            } finally {
              p(!1);
            }
        }
        async function f(t) {
          if (!t.read_at) {
            let e = n();
            (await fetch(`${r.API_URL}/notifications/${t.id}/read`, {
              method: "PUT",
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${e}`,
              },
            }),
              c((e) =>
                e.map((e) =>
                  e.id === t.id
                    ? { ...e, read_at: new Date().toISOString() }
                    : e,
                ),
              ),
              x((e) => Math.max(0, e - 1)));
          }
          t.action_url && e.push(t.action_url);
        }
        async function b() {
          let e = n();
          (await fetch(`${r.API_URL}/notifications/read-all`, {
            method: "PUT",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${e}`,
            },
          }),
            c((e) =>
              e.map((e) => ({
                ...e,
                read_at: e.read_at || new Date().toISOString(),
              })),
            ),
            x(0));
        }
        return (
          (0, s.useEffect)(() => {
            u();
            let e = window.setInterval(u, 3e4);
            return () => window.clearInterval(e);
          }, []),
          (0, s.useEffect)(() => {
            function e(e) {
              h.current && !h.current.contains(e.target) && i(!1);
            }
            return (
              document.addEventListener("mousedown", e),
              () => document.removeEventListener("mousedown", e)
            );
          }, []),
          (0, t.jsxs)("div", {
            ref: h,
            className: "relative",
            children: [
              (0, t.jsxs)("button", {
                type: "button",
                onClick: () => i((e) => !e),
                className:
                  "relative grid h-10 w-10 place-items-center rounded-full border border-slate-200 bg-white text-xl text-[#082f5b] transition hover:bg-slate-50",
                "aria-label": `Notifications${d ? `, ${d} unread` : ""}`,
                children: [
                  (0, t.jsx)("span", {
                    "aria-hidden": "true",
                    className: "text-base",
                    children: "🔔",
                  }),
                  d > 0 &&
                    (0, t.jsx)("span", {
                      className:
                        "absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white",
                      children: d > 99 ? "99+" : d,
                    }),
                ],
              }),
              l &&
                (0, t.jsxs)("div", {
                  className:
                    "absolute right-0 top-12 z-[80] w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-2xl",
                  children: [
                    (0, t.jsxs)("div", {
                      className:
                        "flex items-center justify-between border-b border-slate-100 px-4 py-3",
                      children: [
                        (0, t.jsxs)("div", {
                          children: [
                            (0, t.jsx)("p", {
                              className: "font-black text-[#082f5b]",
                              children: "Notifications",
                            }),
                            (0, t.jsxs)("p", {
                              className: "text-xs text-slate-500",
                              children: [d, " unread"],
                            }),
                          ],
                        }),
                        d > 0 &&
                          (0, t.jsx)("button", {
                            type: "button",
                            onClick: b,
                            className:
                              "text-xs font-bold text-green-700 hover:underline",
                            children: "Mark all read",
                          }),
                      ],
                    }),
                    (0, t.jsx)("div", {
                      className: "max-h-[420px] overflow-y-auto",
                      children: m
                        ? (0, t.jsx)("p", {
                            className: "p-6 text-center text-sm text-slate-500",
                            children: "Loading notifications…",
                          })
                        : 0 === o.length
                          ? (0, t.jsxs)("div", {
                              className: "p-8 text-center",
                              children: [
                                (0, t.jsx)("p", {
                                  className: "text-2xl",
                                  children: "🔔",
                                }),
                                (0, t.jsx)("p", {
                                  className: "mt-2 font-bold text-[#082f5b]",
                                  children: "No notifications yet",
                                }),
                              ],
                            })
                          : o.map((e) =>
                              (0, t.jsx)(
                                "button",
                                {
                                  type: "button",
                                  onClick: () => f(e),
                                  className: `block w-full border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50 ${e.read_at ? "bg-white" : "bg-green-50/60"}`,
                                  children: (0, t.jsxs)("div", {
                                    className: "flex gap-3",
                                    children: [
                                      (0, t.jsx)("span", {
                                        className: `mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${e.read_at ? "bg-slate-200" : "bg-green-500"}`,
                                      }),
                                      (0, t.jsxs)("span", {
                                        children: [
                                          (0, t.jsx)("span", {
                                            className:
                                              "block text-sm font-black text-[#082f5b]",
                                            children: e.title,
                                          }),
                                          (0, t.jsx)("span", {
                                            className:
                                              "mt-1 block text-sm leading-5 text-slate-600",
                                            children: e.message,
                                          }),
                                          (0, t.jsx)("span", {
                                            className:
                                              "mt-2 block text-xs font-semibold text-slate-400",
                                            children: (function (e) {
                                              let t = Math.max(
                                                0,
                                                Math.floor(
                                                  (Date.now() -
                                                    new Date(e).getTime()) /
                                                    1e3,
                                                ),
                                              );
                                              if (t < 60) return "Just now";
                                              let s = Math.floor(t / 60);
                                              if (s < 60) return `${s}m ago`;
                                              let a = Math.floor(s / 60);
                                              if (a < 24) return `${a}h ago`;
                                              let r = Math.floor(a / 24);
                                              return `${r}d ago`;
                                            })(e.created_at),
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                },
                                e.id,
                              ),
                            ),
                    }),
                  ],
                }),
            ],
          })
        );
      },
    ]);
  },
  51005,
  (e) => {
    "use strict";
    var t = e.i(43476),
      s = e.i(71645),
      a = e.i(36329),
      r = e.i(6315),
      n = e.i(19133),
      l = e.i(54858);
    function i({ countryCode: e, country: s, size: a = "h-8 w-8" }) {
      return (0, t.jsx)("span", {
        className: `${a} block shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-sm`,
        children: (0, t.jsx)("img", {
          src: `https://flagcdn.com/w80/${e.toLowerCase()}.png`,
          alt: `${s} flag`,
          className: "h-full w-full object-cover",
        }),
      });
    }
    function o() {
      return (
        sessionStorage.getItem("urbanhelphub_token") ||
        localStorage.getItem("urbanhelphub_token")
      );
    }
    function c(e) {
      let t = JSON.stringify(e);
      (localStorage.getItem("urbanhelphub_user") &&
        localStorage.setItem("urbanhelphub_user", t),
        sessionStorage.getItem("urbanhelphub_user") &&
          sessionStorage.setItem("urbanhelphub_user", t));
    }
    e.s([
      "default",
      0,
      function () {
        let { t: e } = (0, n.useLanguage)(),
          d = (0, s.useRef)(null),
          [x, m] = (0, s.useState)(!1),
          [p, h] = (0, s.useState)(!1),
          [u, f] = (0, s.useState)(() => {
            let e = (0, a.getStoredUser)();
            return "string" == typeof e?.country_code ? e.country_code : "CA";
          }),
          [b, g] = (0, s.useState)(() => {
            let e = (0, a.getStoredUser)();
            return "string" == typeof e?.language_code ? e.language_code : "en";
          }),
          j = a.REGIONS.find((e) => e.countryCode === u) || a.REGIONS[1];
        async function v(e) {
          let t = o();
          if (!t || p || e === u) return void m(!1);
          h(!0);
          try {
            let s = await fetch(`${l.API_URL}/user/preferences`, {
                method: "PUT",
                headers: {
                  Accept: "application/json",
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${t}`,
                },
                body: JSON.stringify({ country_code: e }),
              }),
              a = await s.json();
            if (!s.ok || !a.success)
              throw Error(a.message || "Unable to update country.");
            (c(a.data.user), f(e), m(!1), window.location.reload());
          } catch (e) {
            window.alert(
              e instanceof Error ? e.message : "Unable to update country.",
            );
          } finally {
            h(!1);
          }
        }
        async function w(e) {
          let t = o();
          if (t && !p && e !== b) {
            h(!0);
            try {
              let s = await fetch(`${l.API_URL}/user/preferences`, {
                  method: "PUT",
                  headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${t}`,
                  },
                  body: JSON.stringify({ country_code: u, language_code: e }),
                }),
                a = await s.json();
              if (!s.ok || !a.success)
                throw Error(a.message || "Unable to update language.");
              (c(a.data.user), g(e), window.location.reload());
            } catch (e) {
              window.alert(
                e instanceof Error ? e.message : "Unable to update language.",
              );
            } finally {
              h(!1);
            }
          }
        }
        return (
          (0, s.useEffect)(() => {
            function e(e) {
              d.current?.contains(e.target) || m(!1);
            }
            return (
              document.addEventListener("mousedown", e),
              () => document.removeEventListener("mousedown", e)
            );
          }, []),
          (0, t.jsxs)("div", {
            ref: d,
            className: "relative",
            children: [
              (0, t.jsx)("button", {
                type: "button",
                onClick: () => m((e) => !e),
                className:
                  "grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50",
                "aria-label": `Country: ${j.country}. Currency: ${j.currency}`,
                "aria-expanded": x,
                title: `${j.country} \xb7 ${j.currency}`,
                children: (0, t.jsx)(i, {
                  countryCode: j.countryCode,
                  country: j.country,
                }),
              }),
              x &&
                (0, t.jsxs)("div", {
                  className:
                    "absolute right-0 top-12 z-[90] w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl",
                  children: [
                    (0, t.jsxs)("div", {
                      className: "border-b border-slate-100 px-4 py-3",
                      children: [
                        (0, t.jsx)("p", {
                          className: "font-black text-[#082f5b]",
                          children: e("countryCurrency"),
                        }),
                        (0, t.jsx)("p", {
                          className: "mt-0.5 text-xs text-slate-500",
                          children: e("preferenceHelp"),
                        }),
                      ],
                    }),
                    (0, t.jsx)("div", {
                      className: "max-h-80 overflow-y-auto p-2",
                      children: a.REGIONS.map((e) =>
                        (0, t.jsxs)(
                          "button",
                          {
                            type: "button",
                            disabled: p,
                            onClick: () => v(e.countryCode),
                            className: `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-50 disabled:opacity-50 ${e.countryCode === u ? "bg-emerald-50" : ""}`,
                            children: [
                              (0, t.jsx)(i, {
                                countryCode: e.countryCode,
                                country: e.country,
                                size: "h-9 w-9",
                              }),
                              (0, t.jsxs)("span", {
                                className: "min-w-0 flex-1",
                                children: [
                                  (0, t.jsx)("span", {
                                    className:
                                      "block truncate text-sm font-bold text-[#082f5b]",
                                    children: e.country,
                                  }),
                                  (0, t.jsx)("span", {
                                    className:
                                      "block text-xs font-semibold text-slate-500",
                                    children: e.currency,
                                  }),
                                ],
                              }),
                              e.countryCode === u &&
                                (0, t.jsx)("span", {
                                  className: "font-black text-emerald-600",
                                  children: "✓",
                                }),
                            ],
                          },
                          e.countryCode,
                        ),
                      ),
                    }),
                    (0, t.jsxs)("div", {
                      className: "border-t border-slate-100 bg-slate-50 p-3",
                      children: [
                        (0, t.jsx)("p", {
                          className:
                            "mb-2 text-xs font-black uppercase tracking-wide text-slate-500",
                          children: e("language"),
                        }),
                        (0, t.jsx)("div", {
                          className: "flex flex-wrap gap-2",
                          children: j.languages.map((e) =>
                            (0, t.jsx)(
                              "button",
                              {
                                type: "button",
                                disabled: p,
                                onClick: () => w(e),
                                className: `rounded-full px-3 py-1.5 text-xs font-bold ${e === b ? "bg-[#082f5b] text-white" : "border border-slate-200 bg-white text-slate-700"}`,
                                children:
                                  r.LANGUAGE_NAMES[e] || e.toUpperCase(),
                              },
                              e,
                            ),
                          ),
                        }),
                      ],
                    }),
                  ],
                }),
            ],
          })
        );
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
  18566,
  (e, t, s) => {
    t.exports = e.r(76562);
  },
]);
