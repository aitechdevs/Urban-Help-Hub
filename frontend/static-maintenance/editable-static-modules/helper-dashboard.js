(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([
  "object" == typeof document ? document.currentScript : void 0,
  10105,
  (e) => {
    "use strict";
    var t = e.i(43476),
      s = e.i(71645),
      r = e.i(18566),
      a = e.i(86561),
      n = e.i(51005),
      l = e.i(36329),
      o = e.i(19133),
      i = e.i(54858),
      c = e.i(13786);
    let d = {
      0: "Sunday",
      1: "Monday",
      2: "Tuesday",
      3: "Wednesday",
      4: "Thursday",
      5: "Friday",
      6: "Saturday",
    };
    function u() {
      return (
        sessionStorage.getItem("urbanhelphub_token") ||
        localStorage.getItem("urbanhelphub_token")
      );
    }
    function m() {
      (sessionStorage.removeItem("urbanhelphub_token"),
        sessionStorage.removeItem("urbanhelphub_user"),
        localStorage.removeItem("urbanhelphub_token"),
        localStorage.removeItem("urbanhelphub_user"));
    }
    function p(e) {
      if (!e) return "";
      let t = e.slice(0, 5).split(":"),
        s = Number(t[0]),
        r = t[1];
      return Number.isFinite(s)
        ? `${s % 12 || 12}:${r} ${s >= 12 ? "PM" : "AM"}`
        : e;
    }
    function x(e) {
      return e
        ? e.replaceAll("_", " ").replace(/\b\w/g, (e) => e.toUpperCase())
        : "Pending";
    }
    function h({ label: e, value: s, note: r, icon: a, onClick: uhhAction }) {
      return (0, t.jsx)("button", {
        type:"button", onClick:uhhAction,
        className: "uhh-summary group cursor-pointer transition hover:-translate-y-1 hover:border-green-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-green-50 active:translate-y-0 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm",
        children: (0, t.jsxs)("div", {
          className: "flex items-start justify-between gap-4",
          children: [
            (0, t.jsxs)("div", {
              children: [
                (0, t.jsx)("p", {
                  className: "text-sm font-semibold text-slate-500",
                  children: e,
                }),
                (0, t.jsx)("p", {
                  className:
                    "mt-2 text-3xl font-bold tracking-tight text-[#082f5b]",
                  children: s,
                }),
                (0, t.jsx)("p", {
                  className: "mt-2 text-xs leading-5 text-slate-500",
                  children: r,
                }),
              ],
            }),
            (0, t.jsx)("div", {
              className:
                "flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef3f8] font-bold text-[#082f5b] transition group-hover:bg-green-50 group-hover:text-[#238f39]",
              children: a,
            }),
          ],
        }),
      });
    }
    function f({ label: e, complete: s }) {
      return (0, t.jsxs)("div", {
        className: "flex items-center gap-3",
        children: [
          (0, t.jsx)("span", {
            className: `flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${s ? "bg-green-50 text-[#238f39]" : "bg-slate-100 text-slate-400"}`,
            children: s ? "✓" : "•",
          }),
          (0, t.jsx)("span", {
            className: `text-sm font-semibold ${s ? "text-slate-700" : "text-slate-500"}`,
            children: e,
          }),
        ],
      });
    }
    function b({
      icon: e = "○",
      title: s,
      description: r,
      buttonLabel: a,
      onClick: n,
    }) {
      return (0, t.jsxs)("div", {
        className: "px-6 py-10 text-center sm:px-8 sm:py-12",
        children: [
          (0, t.jsx)("div", {
            className:
              "mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef3f8] text-xl",
            children: e,
          }),
          (0, t.jsx)("h3", {
            className: "mt-4 font-bold text-[#082f5b]",
            children: s,
          }),
          (0, t.jsx)("p", {
            className: "mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500",
            children: r,
          }),
          a &&
            n &&
            (0, t.jsx)("button", {
              type: "button",
              onClick: n,
              className:
                "mt-5 rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-[#082f5b] transition hover:bg-slate-50",
              children: a,
            }),
        ],
      });
    }
    function g(e) {
      if (!e) return !1;
      let t = new Date(`${e}T00:00:00`),
        s = new Date();
      return (s.setHours(0, 0, 0, 0), t <= s);
    }
    e.s([
      "default",
      0,
      function () {
        let e = (0, r.useRouter)(),
          { t: y } = (0, o.useLanguage)(),
          [j, v] = (0, s.useState)(null),
          [w, N] = (0, s.useState)(!0),
          [_, k] = (0, s.useState)(""),
          [S, C] = (0, s.useState)(!1),
          [$, A] = (0, s.useState)(!1),
          [U, P] = (0, s.useState)("identity_document"),
          [E, R] = (0, s.useState)(""),
          [I, L] = (0, s.useState)(""),
          [T, O] = (0, s.useState)(null),
          [M, B] = (0, s.useState)(!1),
          [D, z] = (0, s.useState)(""),
          [H, F] = (0, s.useState)(""),
          [J, G] = (0, s.useState)(null),
          [K, W] = (0, s.useState)([]),
          [V, Y] = (0, s.useState)([]),
          [q, Q] = (0, s.useState)(""),
          [X, Z] = (0, s.useState)(null),
          [ee, et] = (0, s.useState)(null),
          [es, er] = (0, s.useState)(null),
          [ea, en] = (0, s.useState)(!1);
        async function el(e) {
          let t = u();
          if (t) {
            (en(!0), Q(""));
            try {
              let s = await fetch(`${i.API_URL}/helper/stripe/${e}`, {
                  method: "POST",
                  headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${t}`,
                  },
                }),
                r = await s.json();
              if (!s.ok || !r.success)
                throw Error(r.message || "Unable to open Stripe.");
              window.location.assign(r.data.url);
            } catch (e) {
              (Q(e instanceof Error ? e.message : "Unable to open Stripe."),
                en(!1));
            }
          }
        }
        ((0, s.useEffect)(() => {
          !(async function () {
            let t = u();
            if (!t) return e.replace("/login");
            try {
              let s = await fetch(`${i.API_URL}/helper/onboarding`, {
                  headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${t}`,
                  },
                }),
                r = await s.json();
              if (!s.ok) {
                if (401 === s.status) {
                  (m(), e.replace("/login"));
                  return;
                }
                if (403 === s.status) return void e.replace("/dashboard");
                throw Error(
                  r.message || "Unable to load your Helper dashboard.",
                );
              }
              v(r.data);
            } catch (e) {
              k(
                e instanceof Error
                  ? e.message
                  : "Unable to load your Helper dashboard.",
              );
            } finally {
              N(!1);
            }
          })();
        }, [e]),
          (0, s.useEffect)(() => {
            if (!j) return;
            let e = u();
            async function t() {
              try {
                let [t, s, r] = await Promise.all([
                    fetch(`${i.API_URL}/helper/opportunities`, {
                      headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${e}`,
                      },
                      cache: "no-store",
                    }),
                    fetch(`${i.API_URL}/helper/jobs`, {
                      headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${e}`,
                      },
                      cache: "no-store",
                    }),
                    fetch(`${i.API_URL}/helper/stripe/status`, {
                      headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${e}`,
                      },
                      cache: "no-store",
                    }),
                  ]),
                  [a, n, l] = await Promise.all([t.json(), s.json(), r.json()]);
                if (!t.ok || !a.success)
                  throw Error(a.message || "Unable to load opportunities.");
                if (!s.ok || !n.success)
                  throw Error(n.message || "Unable to load jobs.");
                if (!r.ok || !l.success)
                  throw Error(
                    l.message || "Unable to load Stripe payout status.",
                  );
                (W(a.data || []), Y(n.data || []), er(l.data));
              } catch (e) {
                Q(
                  e instanceof Error
                    ? e.message
                    : "Unable to load marketplace work.",
                );
              }
            }
            e && t();
          }, [j]));
        let eo = (0, s.useMemo)(
            () => j?.user?.name?.split(" ")[0] || "Helper",
            [j],
          ),
          ei = (0, s.useMemo)(
            () =>
              j?.services?.filter((e) => "pending" === e.approval_status)
                .length || 0,
            [j],
          ),
          ec = (0, s.useMemo)(
            () =>
              j?.services?.filter(
                (e) => "approved" === e.approval_status && (e.is_active === true || Number(e.is_active) === 1),
              ).length || 0,
            [j],
          ),
          ed = (0, s.useMemo)(
            () => j?.availability?.filter((e) => !!e.is_available).length || 0,
            [j],
          ),
          eu = j?.profile?.verification_status || "pending",
          em = "verified" === eu && ec > 0 && j?.user.status === "active",
          uhhReviewPending = ei > 0 || eu === "pending" || Boolean(j?.documents?.some(doc => doc.verification_status === "pending" && doc.is_active !== false && doc.is_active !== 0)),
          uhhBlockedReason = j?.user.status !== "active" ? "Account is not active. Contact support." : eu === "rejected" ? "Your verification was not approved. Review the Admin feedback and update your documents." : uhhReviewPending ? "Your submitted services, verification or documents are awaiting Admin review." : !j?.services?.length ? "Add a service and complete the required verification to submit your application." : ec === 0 ? "You have no active approved services. Review your service approvals and active settings, or submit a service for approval." : "Complete your profile verification and required documents to receive jobs.",
          uhhIdentityProvided = Boolean(j?.identity_upload?.provided ?? j?.documents?.some(doc => ["identity","identity_document","government_id","photo_id","passport","drivers_licence","drivers_license"].includes(doc.document_type) && ["pending","verified"].includes(doc.verification_status) && (!doc.expires_at || doc.expires_at.slice(0,10) >= new Date().toISOString().slice(0,10)))),
          uhhIdentityReplacement = !uhhIdentityProvided && Boolean(j?.documents?.some(doc => ["identity","identity_document","government_id","photo_id","passport","drivers_licence","drivers_license"].includes(doc.document_type) && (doc.verification_status === "rejected" || (doc.expires_at && doc.expires_at.slice(0,10) < new Date().toISOString().slice(0,10))))),
          ep = j?.user.currency_code || (0, l.storedCurrency)(),
          ex = V.reduce(
            (e, t) =>
              t.payment?.currency === ep
                ? e + Number(t.payment.net_amount || 0)
                : e,
            0,
          ),
          eh = V.reduce(
            (e, t) =>
              t.payment &&
              t.payment.currency === ep &&
              "paid" !== t.payment.status
                ? e + Number(t.payment.net_amount || 0)
                : e,
            0,
          ),
          ef = V.filter((e) => "completed" !== e.assignment_status),
          eb = V.filter((e) => "completed" === e.assignment_status);
        async function eg() {
          if (S) return;
          C(!0);
          let t = u();
          try {
            t &&
              (await fetch(`${i.API_URL}/logout`, {
                method: "POST",
                headers: {
                  Accept: "application/json",
                  Authorization: `Bearer ${t}`,
                },
              }));
          } catch {
          } finally {
            (m(), e.replace("/login"));
          }
        }
        async function ey(e, t) {
          if ("decline" === t && !window.confirm("Decline this opportunity?"))
            return;
          let s = u();
          if (s) {
            (Z(e), Q(""));
            try {
              let r = await fetch(
                  `${i.API_URL}/helper/opportunities/${e}/${t}`,
                  {
                    method: "PUT",
                    headers: {
                      Accept: "application/json",
                      Authorization: `Bearer ${s}`,
                    },
                  },
                ),
                a = await r.json();
              if (!r.ok || !a.success)
                throw Error(a.message || `Unable to ${t} this opportunity.`);
              window.location.reload();
            } catch (e) {
              (Q(
                e instanceof Error
                  ? e.message
                  : `Unable to ${t} this opportunity.`,
              ),
                Z(null));
            }
          }
        }
        async function ej(e, t) {
          if (
            !window.confirm(
              "start" === t
                ? "Start this job now? The Customer will see that work is in progress."
                : "Mark this job complete? The Customer will be asked to confirm.",
            )
          )
            return;
          let s = u();
          if (s) {
            (et(e), Q(""));
            try {
              let r = await fetch(`${i.API_URL}/helper/jobs/${e}/${t}`, {
                  method: "PUT",
                  headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${s}`,
                  },
                }),
                a = await r.json();
              if (!r.ok || !a.success)
                throw Error(a.message || "Unable to update this job.");
              window.location.reload();
            } catch (e) {
              (Q(e instanceof Error ? e.message : "Unable to update this job."),
                et(null));
            }
          }
        }
        async function ev(e) {
          let t = window.prompt("Rate this Customer from 1 to 5:", "5");
          if (null === t) return;
          let s = Number(t);
          if (!Number.isInteger(s) || s < 1 || s > 5)
            return void Q("Please enter a whole-number rating from 1 to 5.");
          let r = window.prompt("Add a short review (optional):", "") ?? "",
            a = u();
          if (a) {
            et(e);
            try {
              let t = await fetch(`${i.API_URL}/tasks/${e}/review`, {
                  method: "PUT",
                  headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${a}`,
                  },
                  body: JSON.stringify({ rating: s, comment: r }),
                }),
                n = await t.json();
              if (!t.ok || !n.success)
                throw Error(n.message || "Unable to save your review.");
              window.location.reload();
            } catch (e) {
              (Q(
                e instanceof Error ? e.message : "Unable to save your review.",
              ),
                et(null));
            }
          }
        }
        async function ew(t) {
          if ((t.preventDefault(), !T || M)) return;
          if (U === "identity_document" && uhhIdentityProvided) { F("Your government photo ID is already uploaded and reused across all services."); return; }
          let s = u();
          if (!s) return void e.replace("/login");
          (B(!0), F(""), z(""));
          let r = new FormData();
          (r.append("document_type", U),
            r.append("file", T),
            E.trim() && r.append("document_name", E.trim()),
            I.trim() && r.append("document_number", I.trim()));
          try {
            let e = await fetch(`${i.API_URL}/helper/documents`, {
                method: "POST",
                headers: {
                  Accept: "application/json",
                  Authorization: `Bearer ${s}`,
                },
                body: r,
              }),
              t = await e.json();
            if (!e.ok || !t.success) {
              let e = t.errors ? Object.values(t.errors).flat()[0] : void 0;
              throw Error(e || t.message || "Document upload failed.");
            }
            (z(t.message || "Document uploaded successfully."),
              window.setTimeout(() => window.location.reload(), 700));
          } catch (e) {
            F(e instanceof Error ? e.message : "Document upload failed.");
          } finally {
            B(!1);
          }
        }
        async function eN(e) {
          let t = u();
          if (t) {
            (G(e), F(""));
            try {
              let s = await fetch(`${i.API_URL}/helper/documents/${e}`, {
                headers: { Authorization: `Bearer ${t}` },
              });
              if (!s.ok) throw Error("Unable to open this document.");
              let r = await s.blob(),
                a = URL.createObjectURL(r);
              (window.open(a, "_blank", "noopener,noreferrer"),
                window.setTimeout(() => URL.revokeObjectURL(a), 6e4));
            } catch (e) {
              F(
                e instanceof Error
                  ? e.message
                  : "Unable to open this document.",
              );
            } finally {
              G(null);
            }
          }
        }
        async function e_(e) {
          if (!window.confirm("Remove this document?")) return;
          let t = u();
          if (t) {
            (G(e), F(""));
            try {
              let s = await fetch(`${i.API_URL}/helper/documents/${e}`, {
                  method: "DELETE",
                  headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${t}`,
                  },
                }),
                r = await s.json();
              if (!s.ok || !r.success)
                throw Error(r.message || "Unable to remove this document.");
              window.location.reload();
            } catch (e) {
              F(
                e instanceof Error
                  ? e.message
                  : "Unable to remove this document.",
              );
            } finally {
              G(null);
            }
          }
        }
        return w
          ? (0, t.jsxs)("main", {
              className: "min-h-screen bg-[#f7f9fc]",
              children: [
                (0, t.jsx)("header", {
                  className: "border-b border-slate-200 bg-white",
                  children: (0, t.jsx)("div", {
                    className:
                      "mx-auto flex max-w-7xl items-center px-5 py-4 sm:px-8",
                    children: (0, t.jsx)("img", {
                      src: "/UrbanHelpHub-logo.png",
                      alt: "UrbanHelpHub",
                      className: "h-9 w-auto",
                    }),
                  }),
                }),
                (0, t.jsx)("div", {
                  className: "flex min-h-[70vh] items-center justify-center",
                  children: (0, t.jsxs)("div", {
                    className: "text-center",
                    children: [
                      (0, t.jsx)("div", {
                        className:
                          "mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#2fad45]",
                      }),
                      (0, t.jsx)("p", {
                        className: "mt-4 font-medium text-slate-600",
                        children: "Loading your Helper dashboard...",
                      }),
                    ],
                  }),
                }),
              ],
            })
          : _ || !j
            ? (0, t.jsxs)("main", {
                className: "min-h-screen bg-[#f7f9fc]",
                children: [
                  (0, t.jsx)("header", {
                    className: "border-b border-slate-200 bg-white",
                    children: (0, t.jsx)("div", {
                      className:
                        "mx-auto flex max-w-7xl items-center px-5 py-4 sm:px-8",
                      children: (0, t.jsx)("img", {
                        src: "/UrbanHelpHub-logo.png",
                        alt: "UrbanHelpHub",
                        className: "h-9 w-auto",
                      }),
                    }),
                  }),
                  (0, t.jsx)("div", {
                    className: "mx-auto max-w-xl px-5 py-20 text-center",
                    children: (0, t.jsxs)("div", {
                      className:
                        "rounded-3xl border border-red-200 bg-white p-8 shadow-sm",
                      children: [
                        (0, t.jsx)("div", {
                          className:
                            "mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-xl",
                          children: "!",
                        }),
                        (0, t.jsx)("h1", {
                          className: "mt-5 text-2xl font-bold text-[#082f5b]",
                          children: "We couldn't load your dashboard",
                        }),
                        (0, t.jsx)("p", {
                          className: "mt-3 text-slate-600",
                          children: _ || "Please try again.",
                        }),
                        (0, t.jsx)("button", {
                          type: "button",
                          onClick: () => window.location.reload(),
                          className:
                            "mt-6 rounded-xl bg-[#082f5b] px-6 py-3 font-bold text-white",
                          children: "Try again",
                        }),
                      ],
                    }),
                  }),
                ],
              })
            : (0, t.jsxs)("main", {
                className: "min-h-screen bg-[#f7f9fc] text-slate-900",
                children: [
                  (0, t.jsxs)("header", {
                    className:
                      "sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur",
                    children: [
                      (0, t.jsxs)("div", {
                        className:
                          "mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8",
                        children: [
                          (0, t.jsxs)("div", {
                            className: "flex items-center gap-9",
                            children: [
                              (0, t.jsx)("button", {
                                type: "button",
                                onClick: () => e.push("/"),
                                "aria-label": "UrbanHelpHub home",
                                className: "cursor-pointer",
                                children: (0, t.jsx)("img", {
                                  src: "/UrbanHelpHub-logo.png",
                                  alt: "UrbanHelpHub",
                                  className: "h-9 w-auto sm:h-10",
                                }),
                              }),
                              (0, t.jsxs)("nav", {
                                className: "hidden items-center gap-6 lg:flex",
                                children: [
                                  (0, t.jsx)("button", {
                                    type: "button",
                                    onClick: () => window.location.assign("/helper/dashboard/"),
                                    className: "font-bold text-[#082f5b]",
                                    children: y("dashboard"),
                                  }),
                                  (0, t.jsx)("button", {
                                    type: "button",
                                    onClick: () =>
                                      window.location.assign(
                                        "/helper/opportunities/",
                                      ),
                                    className:
                                      "font-semibold text-slate-600 transition hover:text-[#082f5b]",
                                    children: y("opportunities"),
                                  }),
                                  (0, t.jsx)("button", {
                                    type: "button",
                                    onClick: () =>
                                      window.location.assign("/helper/jobs/"),
                                    className:
                                      "font-semibold text-slate-600 transition hover:text-[#082f5b]",
                                    children: y("jobs"),
                                  }),
                                  (0, t.jsx)(c.default, {
                                    href: "/helper/messages/",
                                    label: y("messages"),
                                    className:
                                      "font-semibold text-slate-600 transition hover:text-[#082f5b]",
                                  }),
                                  (0, t.jsx)("button", {
                                    type: "button",
                                    onClick: () =>
                                      window.location.assign(
                                        "/helper/earnings/",
                                      ),
                                    className:
                                      "font-semibold text-slate-600 transition hover:text-[#082f5b]",
                                    children: y("earnings"),
                                  }),
                                ],
                              }),
                            ],
                          }),
                          (0, t.jsxs)("div", {
                            className: "hidden items-center gap-4 sm:flex",
                            children: [
                              (0, t.jsx)(n.default, {}),
                              (0, t.jsx)(a.default, {}),
                              (0, t.jsx)("button", {
                                type: "button",
                                onClick: () => e.push("/become-a-helper"),
                                className:
                                  "rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-[#082f5b] transition hover:bg-slate-50",
                                children: y("editProfile"),
                              }),
                              (0, t.jsxs)("div", {
                                className: "text-right",
                                children: [
                                  (0, t.jsx)("p", {
                                    className:
                                      "text-sm font-bold text-[#082f5b]",
                                    children: j.user.name,
                                  }),
                                  (0, t.jsx)("p", {
                                    className: "text-xs text-slate-500",
                                    children: "Helper",
                                  }),
                                ],
                              }),
                              (0, t.jsx)("div", {
                                className:
                                  "flex h-10 w-10 items-center justify-center rounded-full bg-green-50 font-bold text-[#238f39]",
                                children: j.user.name.charAt(0).toUpperCase(),
                              }),
                              (0, t.jsx)("button", {
                                type: "button",
                                onClick: eg,
                                disabled: S,
                                className:
                                  "text-sm font-bold text-slate-500 hover:text-red-600 disabled:opacity-50",
                                children: S ? "Signing out..." : y("logout"),
                              }),
                            ],
                          }),
                          (0, t.jsx)("button", {
                            type: "button",
                            onClick: () => A((e) => !e),
                            className:
                              "flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-xl text-[#082f5b] lg:hidden",
                            "aria-label": "Open menu",
                            children: "☰",
                          }),
                        ],
                      }),
                      $ &&
                        (0, t.jsx)("div", {
                          className:
                            "border-t border-slate-100 bg-white px-5 py-4 lg:hidden",
                          children: (0, t.jsxs)("div", {
                            className: "space-y-1",
                            children: [
                              (0, t.jsx)("p", {
                                className: "mb-3 font-bold text-[#082f5b]",
                                children: j.user.name,
                              }),
                              (0, t.jsx)("button", {
                                type: "button",
                                onClick: () => window.location.assign("/helper/dashboard/"),
                                    className:
                                  "block w-full rounded-lg bg-slate-50 px-3 py-2 text-left font-semibold text-[#082f5b]",
                                children: y("dashboard"),
                              }),
                              (0, t.jsx)("button", {
                                type: "button",
                                onClick: () =>
                                  window.location.assign(
                                    "/helper/opportunities/",
                                  ),
                                className:
                                  "block w-full rounded-lg px-3 py-2 text-left font-semibold text-slate-600",
                                children: y("opportunities"),
                              }),
                              (0, t.jsx)("button", {
                                type: "button",
                                onClick: () =>
                                  window.location.assign("/helper/jobs/"),
                                className:
                                  "block w-full rounded-lg px-3 py-2 text-left font-semibold text-slate-600",
                                children: y("jobs"),
                              }),
                              (0, t.jsx)("button", {
                                type: "button",
                                onClick: () =>
                                  window.location.assign("/helper/messages/"),
                                className:
                                  "block w-full rounded-lg px-3 py-2 text-left font-semibold text-slate-600",
                                children: y("messages"),
                              }),
                              (0, t.jsx)("button", {
                                type: "button",
                                onClick: () =>
                                  window.location.assign("/helper/earnings/"),
                                className:
                                  "block w-full rounded-lg px-3 py-2 text-left font-semibold text-slate-600",
                                children: y("earnings"),
                              }),
                              (0, t.jsx)("button", {
                                type: "button",
                                onClick: () => e.push("/become-a-helper"),
                                className:
                                  "block w-full rounded-lg px-3 py-2 text-left font-semibold text-slate-600",
                                children: y("editProfile"),
                              }),
                              (0, t.jsx)("button", {
                                type: "button",
                                onClick: eg,
                                className:
                                  "block w-full rounded-lg px-3 py-2 text-left font-semibold text-red-600",
                                children: y("logout"),
                              }),
                            ],
                          }),
                        }),
                    ],
                  }),
                  (0, t.jsx)("section", {
                    className: "bg-[#082f5b]",
                    children: (0, t.jsx)("div", {
                      className: "mx-auto max-w-7xl px-5 py-9 sm:px-8 sm:py-11",
                      children: (0, t.jsxs)("div", {
                        className:
                          "flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between",
                        children: [
                          (0, t.jsxs)("div", {
                            children: [
                              (0, t.jsx)("p", {
                                className:
                                  "text-sm font-bold uppercase tracking-[0.15em] text-green-300",
                                children: "Helper dashboard",
                              }),
                              (0, t.jsxs)("h1", {
                                className:
                                  "mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl",
                                children: [y("welcome"), ", ", eo, "."],
                              }),
                              (0, t.jsx)("p", {
                                className:
                                  "mt-3 max-w-2xl leading-7 text-slate-200",
                                children:
                                  "Manage your services, availability, verification and work from one place.",
                              }),
                            ],
                          }),
                          (0, t.jsx)("div", {
                            className: `inline-flex self-start rounded-full px-4 py-2 text-sm font-bold lg:self-auto ${em ? "bg-green-400/20 text-green-200" : "bg-amber-300/15 text-amber-200"}`,
                            children: em
                              ? "✓ Ready to receive jobs"
                              : uhhReviewPending ? "● Application under review" : "● Action needed",
                          }),
                        ],
                      }),
                    }),
                  }),
                  (0, t.jsxs)("section", {
                    className: "mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:py-10",
                    children: [
                      !em &&
                        (0, t.jsx)("div", {
                          className:
                            "mb-8 overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm",
                          children: (0, t.jsxs)("div", {
                            className:
                              "flex flex-col gap-5 p-6 sm:p-7 lg:flex-row lg:items-center lg:justify-between",
                            children: [
                              (0, t.jsxs)("div", {
                                className: "flex gap-4",
                                children: [
                                  (0, t.jsx)("div", {
                                    className:
                                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-xl",
                                    children: "🛡️",
                                  }),
                                  (0, t.jsxs)("div", {
                                    children: [
                                      (0, t.jsx)("h2", {
                                        className:
                                          "text-lg font-bold text-[#082f5b]",
                                        children:
                                          uhhReviewPending ? "Your application is awaiting Admin review" : "Your application needs attention",
                                      }),
                                      (0, t.jsx)("p", {
                                        className:
                                          "mt-1 max-w-3xl text-sm leading-6 text-slate-600",
                                        children:
                                          uhhBlockedReason,
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              (0, t.jsx)("button", {
                                type: "button",
                                onClick: () => e.push("/become-a-helper"),
                                className:
                                  "shrink-0 rounded-xl bg-[#082f5b] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#06274b]",
                                children: "Review application",
                              }),
                            ],
                          }),
                        }),
                      (0, t.jsxs)("div", {
                        className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-4",
                        children: [
                          (0, t.jsx)(h, {
                            label: y("approvedServices"),
                            onClick: () => document.getElementById("opportunities")?.scrollIntoView({behavior:"smooth"}),
                            value: String(ec),
                            note:
                              ei > 0
                                ? `${ei} awaiting approval`
                                : "No services pending",
                            icon: "✓",
                          }),
                          (0, t.jsx)(h, {
                            label: y("availableDays"),
                            onClick: () => document.getElementById("uhh-availability")?.scrollIntoView({behavior:"smooth"}),
                            value: String(ed),
                            note: "Your normal working week",
                            icon: "◷",
                          }),
                          (0, t.jsx)(h, {
                            label: y("activeJobs"),
                            onClick: () => window.location.assign("/helper/jobs/"),
                            value: String(ef.length),
                            note:
                              ef.length > 0
                                ? "Accepted and scheduled work"
                                : em
                                  ? "No active jobs"
                                  : "Available after approval",
                            icon: "▣",
                          }),
                          (0, t.jsx)(h, {
                            label: y("earnings"),
                            onClick: () => window.location.assign("/helper/earnings/"),
                            value: (0, l.formatMoney)(ex, ep),
                            note:
                              eh > 0
                                ? `${(0, l.formatMoney)(eh, ep)} pending payout`
                                : ex > 0
                                  ? `${ep} • Paid out`
                                  : `${ep} • No completed jobs yet`,
                            icon: "$",
                          }),
                        ],
                      }),
                      (0, t.jsxs)("section", {
                        id: "earnings",
                        className:
                          "mt-6 scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-7",
                        children: [
                          (0, t.jsxs)("div", {
                            children: [
                              (0, t.jsxs)("div", {
                                className: "flex items-center gap-3",
                                children: [
                                  (0, t.jsx)("span", {
                                    className: `h-3 w-3 rounded-full ${es?.ready ? "bg-emerald-500" : "bg-amber-400"}`,
                                  }),
                                  (0, t.jsx)("h2", {
                                    className:
                                      "text-xl font-bold text-[#082f5b]",
                                    children: "Stripe payouts",
                                  }),
                                ],
                              }),
                              (0, t.jsx)("p", {
                                className:
                                  "mt-2 max-w-2xl text-sm leading-6 text-slate-500",
                                children: es?.ready
                                  ? "Your payout account is ready. Earnings are transferred to your Stripe balance after the Customer pays for completed work."
                                  : "Connect a Stripe account to verify your identity and receive earnings for completed jobs.",
                              }),
                            ],
                          }),
                          (0, t.jsx)("button", {
                            type: "button",
                            disabled: ea || !es,
                            onClick: () =>
                              el(
                                es?.ready
                                  ? "dashboard-link"
                                  : "onboarding-link",
                              ),
                            className:
                              "mt-5 w-full rounded-xl bg-[#082f5b] px-5 py-3 text-sm font-bold text-white disabled:opacity-50 sm:mt-0 sm:w-auto",
                            children: ea
                              ? "Opening Stripe..."
                              : es?.ready
                                ? "Open Stripe Dashboard"
                                : es?.connected
                                  ? "Continue Stripe setup"
                                  : "Connect Stripe",
                          }),
                        ],
                      }),
                      (0, t.jsxs)("div", {
                        className:
                          "mt-8 grid gap-8 xl:grid-cols-[1.55fr_0.85fr]",
                        children: [
                          (0, t.jsxs)("div", {
                            className: "space-y-8",
                            children: [
                              q &&
                                (0, t.jsx)("div", {
                                  className:
                                    "rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700",
                                  children: q,
                                }),
                              (0, t.jsxs)("section", {
                                id: "opportunities",
                                className:
                                  "scroll-mt-24 rounded-3xl border border-slate-200 bg-white shadow-sm",
                                children: [
                                  (0, t.jsxs)("div", {
                                    className:
                                      "flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-7",
                                    children: [
                                      (0, t.jsxs)("div", {
                                        children: [
                                          (0, t.jsx)("h2", {
                                            className:
                                              "text-xl font-bold text-[#082f5b]",
                                            children: y("yourServices"),
                                          }),
                                          (0, t.jsx)("p", {
                                            className:
                                              "mt-1 text-sm text-slate-500",
                                            children:
                                              "Services you've applied to offer",
                                          }),
                                        ],
                                      }),
                                      (0, t.jsx)("button", {
                                        type: "button",
                                        onClick: () =>
                                          e.push("/become-a-helper"),
                                        className:
                                          "text-sm font-bold text-[#238f39] hover:underline",
                                        children: "Manage",
                                      }),
                                    ],
                                  }),
                                  j.services.length > 0
                                    ? (0, t.jsx)("div", {
                                        className: "divide-y divide-slate-100",
                                        children: j.services.map((e) => {
                                          let s =
                                            "approved" === e.approval_status &&
                                            !!e.is_active;
                                          return (0, t.jsx)(
                                            "div",
                                            {
                                              className: "p-6 sm:p-7",
                                              children: (0, t.jsxs)("div", {
                                                className:
                                                  "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
                                                children: [
                                                  (0, t.jsxs)("div", {
                                                    className:
                                                      "flex items-start gap-4",
                                                    children: [
                                                      (0, t.jsx)("div", {
                                                        className:
                                                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef3f8] text-xl",
                                                        children:
                                                          e.slug?.includes(
                                                            "clean",
                                                          )
                                                            ? "✨"
                                                            : e.slug?.includes(
                                                                  "furniture",
                                                                )
                                                              ? "🪑"
                                                              : e.slug?.includes(
                                                                    "moving",
                                                                  )
                                                                ? "📦"
                                                                : e.slug?.includes(
                                                                      "delivery",
                                                                    )
                                                                  ? "🛍️"
                                                                  : e.slug?.includes(
                                                                        "repair",
                                                                      )
                                                                    ? "🛠️"
                                                                    : e.slug?.includes(
                                                                          "mount",
                                                                        )
                                                                      ? "🖼️"
                                                                      : e.slug?.includes(
                                                                            "yard",
                                                                          )
                                                                        ? "🌿"
                                                                        : e.slug?.includes(
                                                                              "snow",
                                                                            )
                                                                          ? "❄️"
                                                                          : e.slug?.includes(
                                                                                "driv",
                                                                              )
                                                                            ? "🚗"
                                                                            : e.slug?.includes(
                                                                                  "baby",
                                                                                )
                                                                              ? "🧸"
                                                                              : "🤝",
                                                      }),
                                                      (0, t.jsxs)("div", {
                                                        children: [
                                                          (0, t.jsx)("h3", {
                                                            className:
                                                              "font-bold text-[#082f5b]",
                                                            children: e.name,
                                                          }),
                                                          (0, t.jsxs)("p", {
                                                            className:
                                                              "mt-1 text-sm text-slate-500",
                                                            children: [
                                                              e.years_experience ??
                                                                0,
                                                              " ",
                                                              1 ===
                                                              e.years_experience
                                                                ? "year"
                                                                : "years",
                                                              " ",
                                                              "experience",
                                                            ],
                                                          }),
                                                        ],
                                                      }),
                                                    ],
                                                  }),
                                                  (0, t.jsx)("div", {
                                                    className:
                                                      "flex items-center gap-4 sm:text-right",
                                                    children: (0, t.jsxs)(
                                                      "div",
                                                      {
                                                        children: [
                                                          (0, t.jsx)("p", {
                                                            className:
                                                              "font-bold text-[#082f5b]",
                                                            children:
                                                              (function (
                                                                e,
                                                                t = "CAD",
                                                              ) {
                                                                let s =
                                                                  Number(e);
                                                                return Number.isFinite(
                                                                  s,
                                                                )
                                                                  ? `${(0, l.formatMoney)(s, t)}/hr`
                                                                  : "Rate not set";
                                                              })(
                                                                e.hourly_rate,
                                                                j.user
                                                                  .currency_code ||
                                                                  (0,
                                                                  l.storedCurrency)(),
                                                              ),
                                                          }),
                                                          (0, t.jsx)("span", {
                                                            className: `mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${s ? "bg-green-50 text-[#238f39]" : "rejected" === e.approval_status ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`,
                                                            children: x(
                                                              e.approval_status,
                                                            ),
                                                          }),
                                                        ],
                                                      },
                                                    ),
                                                  }),
                                                ],
                                              }),
                                            },
                                            e.id,
                                          );
                                        }),
                                      })
                                    : (0, t.jsx)(b, {
                                        title: "No services selected",
                                        description:
                                          "Choose the services you want to provide to customers.",
                                        buttonLabel: "Choose services",
                                        onClick: () =>
                                          e.push("/become-a-helper"),
                                      }),
                                ],
                              }),
                              (0, t.jsxs)("section", {
                                className:
                                  "rounded-3xl border border-slate-200 bg-white shadow-sm",
                                children: [
                                  (0, t.jsxs)("div", {
                                    className:
                                      "flex items-center justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:px-7",
                                    children: [
                                      (0, t.jsxs)("div", {
                                        children: [
                                          (0, t.jsx)("h2", {
                                            className:
                                              "text-xl font-bold text-[#082f5b]",
                                            children: "Job opportunities",
                                          }),
                                          (0, t.jsx)("p", {
                                            className:
                                              "mt-1 text-sm text-slate-500",
                                            children:
                                              "Tasks that match your approved services and area",
                                          }),
                                        ],
                                      }),
                                      (0, t.jsxs)("span", {
                                        className:
                                          "rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500",
                                        children: [K.length, " available"],
                                      }),
                                    ],
                                  }),
                                  em
                                    ? 0 === K.length
                                      ? (0, t.jsx)(b, {
                                          icon: "📍",
                                          title:
                                            "No matching opportunities right now",
                                          description:
                                            "New tasks matching your services and service area will appear here.",
                                        })
                                      : (0, t.jsx)("div", {
                                          className:
                                            "divide-y divide-slate-100",
                                          children: K.map((e) =>
                                            (0, t.jsx)(
                                              "div",
                                              {
                                                className: "p-6 sm:p-7",
                                                children: (0, t.jsxs)("div", {
                                                  className:
                                                    "flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between",
                                                  children: [
                                                    (0, t.jsxs)("div", {
                                                      className: "min-w-0",
                                                      children: [
                                                        (0, t.jsx)("span", {
                                                          className:
                                                            "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700",
                                                          children:
                                                            e.service_name,
                                                        }),
                                                        (0, t.jsx)("h3", {
                                                          className:
                                                            "mt-3 text-lg font-bold text-[#082f5b]",
                                                          children: e.title,
                                                        }),
                                                        (0, t.jsx)("p", {
                                                          className:
                                                            "mt-2 max-w-2xl text-sm leading-6 text-slate-600",
                                                          children:
                                                            e.description,
                                                        }),
                                                        (0, t.jsxs)("div", {
                                                          className:
                                                            "mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-500",
                                                          children: [
                                                            (0, t.jsxs)(
                                                              "span",
                                                              {
                                                                children: [
                                                                  "📍 ",
                                                                  [
                                                                    e.city,
                                                                    e.province,
                                                                  ]
                                                                    .filter(
                                                                      Boolean,
                                                                    )
                                                                    .join(", "),
                                                                ],
                                                              },
                                                            ),
                                                            (0, t.jsxs)(
                                                              "span",
                                                              {
                                                                children: [
                                                                  "📅 ",
                                                                  e.scheduled_date ||
                                                                    "Flexible",
                                                                ],
                                                              },
                                                            ),
                                                            (0, t.jsxs)(
                                                              "span",
                                                              {
                                                                children: [
                                                                  "◷ ",
                                                                  e.scheduled_start_time?.slice(
                                                                    0,
                                                                    5,
                                                                  ) ||
                                                                    "Flexible",
                                                                ],
                                                              },
                                                            ),
                                                            e.agreed_hourly_rate &&
                                                              (0, t.jsxs)(
                                                                "span",
                                                                {
                                                                  children: [
                                                                    "💵 ",
                                                                    (0,
                                                                    l.formatMoney)(
                                                                      e.agreed_hourly_rate,
                                                                      e.currency ||
                                                                        ep,
                                                                    ),
                                                                    "/hr",
                                                                  ],
                                                                },
                                                              ),
                                                          ],
                                                        }),
                                                      ],
                                                    }),
                                                    (0, t.jsxs)("div", {
                                                      className:
                                                        "flex shrink-0 gap-2",
                                                      children: [
                                                        (0, t.jsx)("button", {
                                                          type: "button",
                                                          disabled:
                                                            X ===
                                                            e.assignment_id,
                                                          onClick: () =>
                                                            ey(
                                                              e.assignment_id,
                                                              "accept",
                                                            ),
                                                          className:
                                                            "rounded-xl bg-[#2fad45] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50",
                                                          children:
                                                            X ===
                                                            e.assignment_id
                                                              ? "Working..."
                                                              : "✓ Accept",
                                                        }),
                                                        (0, t.jsx)("button", {
                                                          type: "button",
                                                          disabled:
                                                            X ===
                                                            e.assignment_id,
                                                          onClick: () =>
                                                            ey(
                                                              e.assignment_id,
                                                              "decline",
                                                            ),
                                                          className:
                                                            "rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 disabled:opacity-50",
                                                          children: "Decline",
                                                        }),
                                                      ],
                                                    }),
                                                  ],
                                                }),
                                              },
                                              e.assignment_id,
                                            ),
                                          ),
                                        })
                                    : (0, t.jsx)(b, {
                                        icon: "🔒",
                                        title:
                                          "Opportunities unlock after approval",
                                        description:
                                          "Once your required verification is complete and at least one service is approved, matching tasks can appear here.",
                                        buttonLabel: "View application",
                                        onClick: () =>
                                          e.push("/become-a-helper"),
                                      }),
                                ],
                              }),
                              (0, t.jsxs)("section", {
                                id: "jobs",
                                className:
                                  "scroll-mt-24 rounded-3xl border border-slate-200 bg-white shadow-sm",
                                children: [
                                  (0, t.jsxs)("div", {
                                    className:
                                      "border-b border-slate-100 px-6 py-5 sm:px-7",
                                    children: [
                                      (0, t.jsx)("h2", {
                                        className:
                                          "text-xl font-bold text-[#082f5b]",
                                        children: y("upcomingJobs"),
                                      }),
                                      (0, t.jsx)("p", {
                                        className:
                                          "mt-1 text-sm text-slate-500",
                                        children:
                                          "Track confirmed work from arrival through payment",
                                      }),
                                    ],
                                  }),
                                  0 === ef.length
                                    ? (0, t.jsx)(b, {
                                        icon: "📅",
                                        title: "Nothing scheduled yet",
                                        description: em
                                          ? "When you accept a task, its schedule and customer details will appear here."
                                          : "Scheduled work will appear here after your account is approved and you begin accepting tasks.",
                                      })
                                    : (0, t.jsx)("div", {
                                        className: "divide-y divide-slate-100",
                                        children: ef.map((e) =>
                                          (0, t.jsx)(
                                            "div",
                                            {
                                              className: "p-6 sm:p-7",
                                              children: (0, t.jsxs)("div", {
                                                className:
                                                  "flex flex-wrap items-start justify-between gap-4",
                                                children: [
                                                  (0, t.jsxs)("div", {
                                                    children: [
                                                      (0, t.jsx)("span", {
                                                        className:
                                                          "rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700",
                                                        children:
                                                          e.service_name,
                                                      }),
                                                      (0, t.jsx)("h3", {
                                                        className:
                                                          "mt-3 font-bold text-[#082f5b]",
                                                        children: e.title,
                                                      }),
                                                      (0, t.jsxs)("p", {
                                                        className:
                                                          "mt-2 text-sm text-slate-500",
                                                        children: [
                                                          e.customer_name,
                                                          " · ",
                                                          [e.city, e.province]
                                                            .filter(Boolean)
                                                            .join(", "),
                                                        ],
                                                      }),
                                                      (0, t.jsxs)("p", {
                                                        className:
                                                          "mt-1 text-sm text-slate-500",
                                                        children: [
                                                          e.scheduled_date,
                                                          " at ",
                                                          e.scheduled_start_time?.slice(
                                                            0,
                                                            5,
                                                          ),
                                                        ],
                                                      }),
                                                      "accepted" !==
                                                        e.assignment_status &&
                                                        e.address_line_1 &&
                                                        (0, t.jsxs)("div", {
                                                          className:
                                                            "mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900",
                                                          children: [
                                                            (0, t.jsx)("p", {
                                                              className:
                                                                "font-bold",
                                                              children:
                                                                "Service address",
                                                            }),
                                                            (0, t.jsx)("p", {
                                                              className: "mt-1",
                                                              children: [
                                                                e.address_line_1,
                                                                e.address_line_2,
                                                                e.city,
                                                                e.province,
                                                                e.address_postal_code,
                                                              ]
                                                                .filter(Boolean)
                                                                .join(", "),
                                                            }),
                                                          ],
                                                        }),
                                                      e.payment &&
                                                        (0, t.jsxs)("div", {
                                                          className:
                                                            "mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900",
                                                          children: [
                                                            (0, t.jsxs)("p", {
                                                              className:
                                                                "font-bold",
                                                              children: [
                                                                "Earnings: ",
                                                                (0,
                                                                l.formatMoney)(
                                                                  e.payment
                                                                    .net_amount,
                                                                  e.payment
                                                                    .currency,
                                                                ),
                                                              ],
                                                            }),
                                                            (0, t.jsxs)("p", {
                                                              className:
                                                                "mt-1 text-xs",
                                                              children: [
                                                                "Gross ",
                                                                (0,
                                                                l.formatMoney)(
                                                                  e.payment
                                                                    .gross_amount,
                                                                  e.payment
                                                                    .currency,
                                                                ),
                                                                " − platform deduction ",
                                                                (0,
                                                                l.formatMoney)(
                                                                  e.payment
                                                                    .platform_deduction,
                                                                  e.payment
                                                                    .currency,
                                                                ),
                                                                " · ",
                                                                x(
                                                                  e.payment
                                                                    .status,
                                                                ),
                                                              ],
                                                            }),
                                                          ],
                                                        }),
                                                    ],
                                                  }),
                                                  (0, t.jsxs)("div", {
                                                    className:
                                                      "flex flex-col items-end gap-2",
                                                    children: [
                                                      (0, t.jsx)("span", {
                                                        className: `rounded-full px-3 py-1 text-xs font-bold ${["confirmed", "completed"].includes(e.assignment_status) ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`,
                                                        children: x(
                                                          e.assignment_status,
                                                        ),
                                                      }),
                                                      "confirmed" ===
                                                        e.assignment_status &&
                                                        (0, t.jsx)("button", {
                                                          type: "button",
                                                          disabled:
                                                            ee ===
                                                              e.assignment_id ||
                                                            !g(
                                                              e.scheduled_date,
                                                            ),
                                                          onClick: () =>
                                                            ej(
                                                              e.assignment_id,
                                                              "start",
                                                            ),
                                                          title: g(
                                                            e.scheduled_date,
                                                          )
                                                            ? "Start this job"
                                                            : `Available on ${e.scheduled_date}`,
                                                          className:
                                                            "rounded-xl bg-[#2fad45] px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50",
                                                          children:
                                                            ee ===
                                                            e.assignment_id
                                                              ? "Starting..."
                                                              : g(
                                                                    e.scheduled_date,
                                                                  )
                                                                ? "Start job"
                                                                : `Starts ${e.scheduled_date}`,
                                                        }),
                                                      "in_progress" ===
                                                        e.assignment_status &&
                                                        (0, t.jsx)("button", {
                                                          type: "button",
                                                          disabled:
                                                            ee ===
                                                            e.assignment_id,
                                                          onClick: () =>
                                                            ej(
                                                              e.assignment_id,
                                                              "complete",
                                                            ),
                                                          className:
                                                            "rounded-xl bg-[#082f5b] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50",
                                                          children:
                                                            ee ===
                                                            e.assignment_id
                                                              ? "Updating..."
                                                              : "Mark complete",
                                                        }),
                                                      "awaiting_completion" ===
                                                        e.assignment_status &&
                                                        (0, t.jsx)("span", {
                                                          className:
                                                            "text-xs font-bold text-amber-700",
                                                          children:
                                                            "Waiting for Customer approval",
                                                        }),
                                                      "completed" ===
                                                        e.assignment_status &&
                                                        !e.my_review &&
                                                        (0, t.jsx)("button", {
                                                          type: "button",
                                                          disabled:
                                                            ee === e.task_id,
                                                          onClick: () =>
                                                            ev(e.task_id),
                                                          className:
                                                            "rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-[#082f5b] disabled:opacity-50",
                                                          children:
                                                            "Review Customer",
                                                        }),
                                                      e.my_review &&
                                                        (0, t.jsx)("span", {
                                                          className:
                                                            "text-sm font-bold text-amber-600",
                                                          children: "★".repeat(
                                                            e.my_review.rating,
                                                          ),
                                                        }),
                                                    ],
                                                  }),
                                                ],
                                              }),
                                            },
                                            e.assignment_id,
                                          ),
                                        ),
                                      }),
                                ],
                              }),
                              (0, t.jsxs)("section", {
                                className:
                                  "rounded-3xl border border-slate-200 bg-white shadow-sm",
                                children: [
                                  (0, t.jsxs)("div", {
                                    className:
                                      "flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-7",
                                    children: [
                                      (0, t.jsxs)("div", {
                                        children: [
                                          (0, t.jsx)("h2", {
                                            className:
                                              "text-xl font-bold text-[#082f5b]",
                                            children: y("completedJobs"),
                                          }),
                                          (0, t.jsx)("p", {
                                            className:
                                              "mt-1 text-sm text-slate-500",
                                            children:
                                              "Work history, earnings and reviews",
                                          }),
                                        ],
                                      }),
                                      (0, t.jsxs)("span", {
                                        className:
                                          "rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500",
                                        children: [eb.length, " completed"],
                                      }),
                                    ],
                                  }),
                                  0 === eb.length
                                    ? (0, t.jsx)(b, {
                                        icon: "✓",
                                        title: "No completed jobs yet",
                                        description:
                                          "Finished jobs and payout details will appear here.",
                                      })
                                    : (0, t.jsx)("div", {
                                        className: "divide-y divide-slate-100",
                                        children: eb.map((e) =>
                                          (0, t.jsx)(
                                            "article",
                                            {
                                              className: "p-6 sm:p-7",
                                              children: (0, t.jsxs)("div", {
                                                className:
                                                  "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
                                                children: [
                                                  (0, t.jsxs)("div", {
                                                    children: [
                                                      (0, t.jsx)("span", {
                                                        className:
                                                          "rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700",
                                                        children: "Completed",
                                                      }),
                                                      (0, t.jsx)("h3", {
                                                        className:
                                                          "mt-3 font-bold text-[#082f5b]",
                                                        children: e.title,
                                                      }),
                                                      (0, t.jsxs)("p", {
                                                        className:
                                                          "mt-1 text-sm text-slate-500",
                                                        children: [
                                                          e.customer_name,
                                                          " · ",
                                                          e.scheduled_date,
                                                        ],
                                                      }),
                                                      e.payment &&
                                                        (0, t.jsxs)("p", {
                                                          className:
                                                            "mt-3 text-sm font-bold text-emerald-700",
                                                          children: [
                                                            "Net earnings: ",
                                                            (0, l.formatMoney)(
                                                              e.payment
                                                                .net_amount,
                                                              e.payment
                                                                .currency,
                                                            ),
                                                            " · ",
                                                            x(e.payment.status),
                                                          ],
                                                        }),
                                                    ],
                                                  }),
                                                  (0, t.jsx)("div", {
                                                    children: e.my_review
                                                      ? (0, t.jsx)("span", {
                                                          className:
                                                            "text-sm font-bold text-amber-600",
                                                          children: "★".repeat(
                                                            e.my_review.rating,
                                                          ),
                                                        })
                                                      : (0, t.jsx)("button", {
                                                          type: "button",
                                                          disabled:
                                                            ee === e.task_id,
                                                          onClick: () =>
                                                            ev(e.task_id),
                                                          className:
                                                            "rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-[#082f5b] disabled:opacity-50",
                                                          children:
                                                            "Review Customer",
                                                        }),
                                                  }),
                                                ],
                                              }),
                                            },
                                            e.assignment_id,
                                          ),
                                        ),
                                      }),
                                ],
                              }),
                            ],
                          }),
                          (0, t.jsxs)("aside", {
                            className: "space-y-6",
                            children: [
                              (0, t.jsxs)("section", {
                                className:
                                  "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm",
                                children: [
                                  (0, t.jsxs)("div", {
                                    className:
                                      "flex items-center justify-between",
                                    children: [
                                      (0, t.jsx)("h2", {
                                        className:
                                          "text-lg font-bold text-[#082f5b]",
                                        children: y("verification"),
                                      }),
                                      (0, t.jsx)("span", {
                                        className: `rounded-full px-3 py-1 text-xs font-bold ${"verified" === eu ? "bg-green-50 text-[#238f39]" : "rejected" === eu ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"}`,
                                        children: x(eu),
                                      }),
                                    ],
                                  }),
                                  (0, t.jsxs)("div", {
                                    className: "mt-6 space-y-5",
                                    children: [
                                      (0, t.jsx)(f, {
                                        label: "Account created",
                                        complete: !0,
                                      }),
                                      (0, t.jsx)(f, {
                                        label: "Services selected",
                                        complete: j.services.length > 0,
                                      }),
                                      (0, t.jsx)(f, {
                                        label: "Service area added",
                                        complete: !!(
                                          j.profile?.city &&
                                          j.profile?.province &&
                                          j.profile?.postal_code
                                        ),
                                      }),
                                      (0, t.jsx)(f, {
                                        label: "Availability added",
                                        complete: j.availability.length > 0,
                                      }),
                                      (0, t.jsx)(f, {
                                        label: "Identity document (once)",
                                        complete: "verified" === eu,
                                      }),
                                      (0, t.jsx)(f, {
                                        label: "Final approval",
                                        complete: em,
                                      }),
                                    ],
                                  }),
                                  (0, t.jsxs)("div", {
                                    className:
                                      "mt-6 border-t border-slate-100 pt-6",
                                    children: [
                                      (0, t.jsx)("h3", {
                                        className: "font-bold text-[#082f5b]",
                                        children: "Verification documents",
                                      }),
                                      (0, t.jsx)("p", {
                                        className:
                                          "mt-1 text-xs leading-5 text-slate-500",
                                        children:
                                          "PDF, JPG or PNG. Maximum file size 5 MB. Files are stored privately.",
                                      }),
                                      (0,t.jsx)("p",{className:"mt-3 text-xs leading-5 text-slate-600",children: uhhIdentityProvided ? "Government photo ID already provided. It is reused across all services; no second identity upload is needed." : uhhIdentityReplacement ? "Your previous identity document was rejected or expired. Choose a replacement file below and upload it directly. Your profile, services and availability do not need to be resubmitted. Admin will review the replacement document." : "Upload one valid government photo ID. In Canada, use a provincial/territorial driver's licence or non-driver photo ID; a valid passport is an alternative. Do not upload a SIN document or health card as identity."}),
                                      (D || H) &&
                                        (0, t.jsx)("div", {
                                          className: `mt-4 rounded-xl px-3 py-2 text-xs font-bold ${H ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`,
                                          children: H || D,
                                        }),
                                      (0, t.jsxs)("form", {
                                        onSubmit: ew,
                                        className: "mt-4 space-y-3",
                                        children: [
                                          (0, t.jsxs)("select", {
                                            value: U,
                                            onChange: (e) => P(e.target.value),
                                            className:
                                              "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-[#2fad45]",
                                            children: [
                                              (0, t.jsx)("option", {
                                                value: "identity_document",
                                                disabled: uhhIdentityProvided,
                                                children: "Government photo ID (once)",
                                              }),
                                            ],
                                          }),
                                          (0, t.jsx)("input", {
                                            type: "text",
                                            value: E,
                                            onChange: (e) => R(e.target.value),
                                            placeholder:
                                              "Document name (optional)",
                                            className:
                                              "w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#2fad45]",
                                          }),
                                          (0, t.jsx)("input", {
                                            type: "text",
                                            value: I,
                                            onChange: (e) => L(e.target.value),
                                            placeholder:
                                              "Document number (optional)",
                                            className:
                                              "w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#2fad45]",
                                          }),
                                          (0, t.jsx)("input", {
                                            type: "file", disabled: U === "identity_document" && uhhIdentityProvided,
                                            accept:
                                              ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png",
                                            onChange: (e) =>
                                              O(e.target.files?.[0] || null),
                                            className:
                                              "block w-full cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600",
                                          }),
                                          (0, t.jsx)("button", {
                                            type: "submit",
                                            disabled: !T || M || (U === "identity_document" && uhhIdentityProvided),
                                            className:
                                              "w-full rounded-xl bg-[#2fad45] px-4 py-3 text-sm font-bold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50",
                                            children: M
                                              ? "Uploading securely…"
                                              : uhhIdentityReplacement ? "Upload replacement document" : "Upload document",
                                          }),
                                        ],
                                      }),
                                      (0, t.jsx)("div", {
                                        className: "mt-5 space-y-3",
                                        children:
                                          j.documents.length > 0
                                            ? j.documents.map((e) =>
                                                (0, t.jsxs)(
                                                  "div",
                                                  {
                                                    className:
                                                      "rounded-xl border border-slate-200 p-3",
                                                    children: [
                                                      (0, t.jsxs)("div", {
                                                        className:
                                                          "flex items-start justify-between gap-2",
                                                        children: [
                                                          (0, t.jsxs)("div", {
                                                            className:
                                                              "min-w-0",
                                                            children: [
                                                              (0, t.jsx)("p", {
                                                                className:
                                                                  "truncate text-sm font-bold text-[#082f5b]",
                                                                children:
                                                                  e.document_name ||
                                                                  x(
                                                                    e.document_type,
                                                                  ),
                                                              }),
                                                              (0, t.jsx)("p", {
                                                                className:
                                                                  "mt-1 text-xs text-slate-500",
                                                                children: x(
                                                                  e.document_type,
                                                                ),
                                                              }),
                                                            ],
                                                          }),
                                                          (0, t.jsx)("span", {
                                                            className: `rounded-full px-2 py-1 text-[10px] font-bold ${"verified" === e.verification_status ? "bg-green-50 text-green-700" : "rejected" === e.verification_status ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`,
                                                            children: e.verification_status === "verified" ? "Document approved" : e.verification_status === "pending" ? "Document under review" : x(e.verification_status),
                                                          }),
                                                        ],
                                                      }),
                                                      e.verification_notes &&
                                                        (0, t.jsx)("p", {
                                                          className:
                                                            "mt-2 rounded-lg bg-red-50 p-2 text-xs text-red-700",
                                                          children:
                                                            e.verification_notes,
                                                        }),
                                                      (0, t.jsxs)("div", {
                                                        className:
                                                          "mt-3 flex gap-2",
                                                        children: [
                                                          (0, t.jsx)("button", {
                                                            type: "button",
                                                            onClick: () =>
                                                              eN(e.id),
                                                            disabled:
                                                              J === e.id,
                                                            className:
                                                              "rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-[#082f5b] disabled:opacity-50",
                                                            children: "View",
                                                          }),
                                                          "verified" !==
                                                            e.verification_status &&
                                                            (0, t.jsx)(
                                                              "button",
                                                              {
                                                                type: "button",
                                                                onClick: () =>
                                                                  e_(e.id),
                                                                disabled:
                                                                  J === e.id,
                                                                className:
                                                                  "rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 disabled:opacity-50",
                                                                children:
                                                                  "Remove",
                                                              },
                                                            ),
                                                        ],
                                                      }),
                                                    ],
                                                  },
                                                  e.id,
                                                ),
                                              )
                                            : (0, t.jsx)("p", {
                                                className:
                                                  "rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-700",
                                                children:
                                                  "No documents uploaded yet. Upload an identity document to begin verification.",
                                              }),
                                      }),
                                    ],
                                  }),
                                  (0, t.jsx)("button", {
                                    type: "button",
                                    onClick: () => e.push("/become-a-helper"),
                                    className:
                                      "mt-6 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-bold text-[#082f5b] transition hover:bg-slate-50",
                                    children: "Review application",
                                  }),
                                ],
                              }),
                              (0, t.jsxs)("section", {id:"uhh-availability",
                                className:
                                  "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm",
                                children: [
                                  (0, t.jsxs)("div", {
                                    className:
                                      "flex items-center justify-between",
                                    children: [
                                      (0, t.jsxs)("div", {
                                        children: [
                                          (0, t.jsx)("h2", {
                                            className:
                                              "text-lg font-bold text-[#082f5b]",
                                            children: "Availability",
                                          }),
                                          (0, t.jsx)("p", {
                                            className:
                                              "mt-1 text-sm text-slate-500",
                                            children:
                                              j.availability[0]?.timezone ||
                                              "Time zone not set",
                                          }),
                                        ],
                                      }),
                                      (0, t.jsx)("button", {
                                        type: "button",
                                        onClick: () =>
                                          e.push("/become-a-helper"),
                                        className:
                                          "text-sm font-bold text-[#238f39] hover:underline",
                                        children: "Edit",
                                      }),
                                    ],
                                  }),
                                  j.availability.length > 0
                                    ? (0, t.jsx)("div", {
                                        className: "mt-5 space-y-3",
                                        children: j.availability.map((e) =>
                                          (0, t.jsxs)(
                                            "div",
                                            {
                                              className:
                                                "flex items-center justify-between gap-3 rounded-xl bg-[#f7f9fc] px-4 py-3",
                                              children: [
                                                (0, t.jsx)("span", {
                                                  className:
                                                    "text-sm font-bold text-slate-700",
                                                  children:
                                                    d[e.day_of_week] ||
                                                    `Day ${e.day_of_week}`,
                                                }),
                                                (0, t.jsxs)("span", {
                                                  className:
                                                    "text-xs font-semibold text-slate-500",
                                                  children: [
                                                    p(e.start_time),
                                                    " –",
                                                    " ",
                                                    p(e.end_time),
                                                  ],
                                                }),
                                              ],
                                            },
                                            e.id,
                                          ),
                                        ),
                                      })
                                    : (0, t.jsx)("p", {
                                        className:
                                          "mt-5 text-sm text-slate-500",
                                        children: "No availability added yet.",
                                      }),
                                ],
                              }),
                              (0, t.jsxs)("section", {
                                className:
                                  "rounded-3xl bg-[#082f5b] p-6 text-white shadow-sm",
                                children: [
                                  (0, t.jsx)("p", {
                                    className:
                                      "text-xs font-bold uppercase tracking-[0.14em] text-green-300",
                                    children: "Your service area",
                                  }),
                                  (0, t.jsxs)("h2", {
                                    className: "mt-2 text-xl font-bold",
                                    children: [
                                      j.profile?.city || "Not added",
                                      j.profile?.province
                                        ? `, ${j.profile.province}`
                                        : "",
                                    ],
                                  }),
                                  (0, t.jsx)("p", {
                                    className: "mt-1 text-sm text-slate-300",
                                    children:
                                      j.profile?.postal_code ||
                                      "Postal code not added",
                                  }),
                                  (0, t.jsx)("div", {
                                    className:
                                      "mt-5 rounded-2xl bg-white/10 p-4",
                                    children: (0, t.jsx)("p", {
                                      className:
                                        "text-sm leading-6 text-slate-200",
                                      children:
                                        "Matching will use your approved services and service area when customer tasks become available.",
                                    }),
                                  }),
                                ],
                              }),
                              (0, t.jsxs)("section", {
                                id: "messages",
                                className:
                                  "scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm",
                                children: [
                                  (0, t.jsx)("h2", {
                                    className:
                                      "text-lg font-bold text-[#082f5b]",
                                    children: y("messages"),
                                  }),
                                  (0, t.jsxs)("div", {
                                    className: "mt-5 flex gap-3",
                                    children: [
                                      (0, t.jsx)("div", {
                                        className:
                                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef3f8]",
                                        children: "💬",
                                      }),
                                      (0, t.jsxs)("div", {
                                        children: [
                                          (0, t.jsx)("p", {
                                            className:
                                              "font-semibold text-slate-700",
                                            children: "No new messages",
                                          }),
                                          (0, t.jsx)("p", {
                                            className:
                                              "mt-1 text-sm leading-5 text-slate-500",
                                            children:
                                              "Customer and UrbanHelpHub messages will appear here.",
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
                      }),
                    ],
                  }),
                  (0, t.jsx)("footer", {
                    className: "mt-8 border-t border-slate-200 bg-white",
                    children: (0, t.jsxs)("div", {
                      className:
                        "mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8",
                      children: [
                        (0, t.jsx)("img", {
                          src: "/UrbanHelpHub-logo.png",
                          alt: "UrbanHelpHub",
                          className: "h-8 w-auto self-start",
                        }),
                        (0, t.jsx)("p", {
                          className: "text-sm text-slate-500",
                          children:
                            "Local help. Clear expectations. Stronger communities.",
                        }),
                      ],
                    }),
                  }),
                ],
              });
      },
    ]);
  },
  13786,
  (e) => {
    "use strict";
    var t = e.i(43476),
      s = e.i(22016),
      r = e.i(71645),
      a = e.i(54858);
    e.s([
      "default",
      0,
      function ({ href: e, label: n = "Messages", className: l = "" }) {
        let [o, i] = (0, r.useState)(0);
        return (
          (0, r.useEffect)(() => {
            let e =
              sessionStorage.getItem("urbanhelphub_token") ||
              localStorage.getItem("urbanhelphub_token");
            e &&
              fetch(`${a.API_URL}/messages/unread-count`, {
                headers: {
                  Accept: "application/json",
                  Authorization: `Bearer ${e}`,
                },
                cache: "no-store",
              })
                .then((e) => e.json())
                .then((e) => i(Number(e.data?.unread_count || 0)))
                .catch(() => {});
          }, []),
          (0, t.jsxs)(s.default, {
            href: e,
            className: `inline-flex items-center gap-1.5 ${l}`,
            children: [
              n,
              o > 0 &&
                (0, t.jsx)("span", {
                  className:
                    "inline-grid min-w-5 place-items-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-black leading-none text-white",
                  children: o > 99 ? "99+" : o,
                }),
            ],
          })
        );
      },
    ]);
  },
  86561,
  (e) => {
    "use strict";
    var t = e.i(43476),
      s = e.i(71645),
      r = e.i(18566),
      a = e.i(54858);
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
        let e = (0, r.useRouter)(),
          [l, o] = (0, s.useState)(!1),
          [i, c] = (0, s.useState)([]),
          [d, u] = (0, s.useState)(0),
          [m, p] = (0, s.useState)(!0),
          x = (0, s.useRef)(null);
        async function h() {
          let e = n();
          if (e)
            try {
              let t = await fetch(`${a.API_URL}/notifications`, {
                  headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${e}`,
                  },
                }),
                s = await t.json();
              t.ok &&
                s.success &&
                (c(s.data.notifications || []),
                u(Number(s.data.unread_count || 0)));
            } finally {
              p(!1);
            }
        }
        async function f(t) {
          if (!t.read_at) {
            let e = n();
            (await fetch(`${a.API_URL}/notifications/${t.id}/read`, {
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
              u((e) => Math.max(0, e - 1)));
          }
          t.action_url && e.push(t.action_url);
        }
        async function b() {
          let e = n();
          (await fetch(`${a.API_URL}/notifications/read-all`, {
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
            u(0));
        }
        return (
          (0, s.useEffect)(() => {
            h();
            let e = window.setInterval(h, 3e4);
            return () => window.clearInterval(e);
          }, []),
          (0, s.useEffect)(() => {
            function e(e) {
              x.current && !x.current.contains(e.target) && o(!1);
            }
            return (
              document.addEventListener("mousedown", e),
              () => document.removeEventListener("mousedown", e)
            );
          }, []),
          (0, t.jsxs)("div", {
            ref: x,
            className: "relative",
            children: [
              (0, t.jsxs)("button", {
                type: "button",
                onClick: () => o((e) => !e),
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
                        : 0 === i.length
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
                          : i.map((e) =>
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
                                              let r = Math.floor(s / 60);
                                              if (r < 24) return `${r}h ago`;
                                              let a = Math.floor(r / 24);
                                              return `${a}d ago`;
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
      r = e.i(36329),
      a = e.i(6315),
      n = e.i(19133),
      l = e.i(54858);
    function o({ countryCode: e, country: s, size: r = "h-8 w-8" }) {
      return (0, t.jsx)("span", {
        className: `${r} block shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 shadow-sm`,
        children: (0, t.jsx)("img", {
          src: `https://flagcdn.com/w80/${e.toLowerCase()}.png`,
          alt: `${s} flag`,
          className: "h-full w-full object-cover",
        }),
      });
    }
    function i() {
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
          [u, m] = (0, s.useState)(!1),
          [p, x] = (0, s.useState)(!1),
          [h, f] = (0, s.useState)(() => {
            let e = (0, r.getStoredUser)();
            return "string" == typeof e?.country_code ? e.country_code : "CA";
          }),
          [b, g] = (0, s.useState)(() => {
            let e = (0, r.getStoredUser)();
            return "string" == typeof e?.language_code ? e.language_code : "en";
          }),
          y = r.REGIONS.find((e) => e.countryCode === h) || r.REGIONS[1];
        async function j(e) {
          let t = i();
          if (!t || p || e === h) return void m(!1);
          x(!0);
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
              r = await s.json();
            if (!s.ok || !r.success)
              throw Error(r.message || "Unable to update country.");
            (c(r.data.user), f(e), m(!1), window.location.reload());
          } catch (e) {
            window.alert(
              e instanceof Error ? e.message : "Unable to update country.",
            );
          } finally {
            x(!1);
          }
        }
        async function v(e) {
          let t = i();
          if (t && !p && e !== b) {
            x(!0);
            try {
              let s = await fetch(`${l.API_URL}/user/preferences`, {
                  method: "PUT",
                  headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${t}`,
                  },
                  body: JSON.stringify({ country_code: h, language_code: e }),
                }),
                r = await s.json();
              if (!s.ok || !r.success)
                throw Error(r.message || "Unable to update language.");
              (c(r.data.user), g(e), window.location.reload());
            } catch (e) {
              window.alert(
                e instanceof Error ? e.message : "Unable to update language.",
              );
            } finally {
              x(!1);
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
                "aria-label": `Country: ${y.country}. Currency: ${y.currency}`,
                "aria-expanded": u,
                title: `${y.country} \xb7 ${y.currency}`,
                children: (0, t.jsx)(o, {
                  countryCode: y.countryCode,
                  country: y.country,
                }),
              }),
              u &&
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
                      children: r.REGIONS.map((e) =>
                        (0, t.jsxs)(
                          "button",
                          {
                            type: "button",
                            disabled: p,
                            onClick: () => j(e.countryCode),
                            className: `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-slate-50 disabled:opacity-50 ${e.countryCode === h ? "bg-emerald-50" : ""}`,
                            children: [
                              (0, t.jsx)(o, {
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
                              e.countryCode === h &&
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
                          children: y.languages.map((e) =>
                            (0, t.jsx)(
                              "button",
                              {
                                type: "button",
                                disabled: p,
                                onClick: () => v(e),
                                className: `rounded-full px-3 py-1.5 text-xs font-bold ${e === b ? "bg-[#082f5b] text-white" : "border border-slate-200 bg-white text-slate-700"}`,
                                children:
                                  a.LANGUAGE_NAMES[e] || e.toUpperCase(),
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
  22016,
  (e, t, s) => {
    "use strict";
    (e.i(47167), Object.defineProperty(s, "__esModule", { value: !0 }));
    var r = {
      default: function () {
        return b;
      },
      useLinkStatus: function () {
        return y;
      },
    };
    for (var a in r) Object.defineProperty(s, a, { enumerable: !0, get: r[a] });
    let n = e.r(90809),
      l = e.r(43476),
      o = n._(e.r(71645)),
      i = e.r(95057),
      c = e.r(8372),
      d = e.r(18581),
      u = e.r(18967),
      m = e.r(5550),
      p = e.r(88540),
      x = e.r(91949),
      h = e.r(73668),
      f = e.r(9396);
    function b(t) {
      var s;
      let r,
        a,
        n,
        [b, y] = (0, o.useOptimistic)(x.IDLE_LINK_STATUS),
        j = (0, o.useRef)(null),
        {
          href: v,
          as: w,
          children: N,
          prefetch: _ = null,
          passHref: k,
          replace: S,
          shallow: C,
          scroll: $,
          onClick: A,
          onMouseEnter: U,
          onTouchStart: P,
          legacyBehavior: E = !1,
          onNavigate: R,
          transitionTypes: I,
          ref: L,
          unstable_dynamicOnHover: T,
          ...O
        } = t;
      ((r = N),
        E &&
          ("string" == typeof r || "number" == typeof r) &&
          (r = (0, l.jsx)("a", { children: r })));
      let M = o.default.useContext(c.AppRouterContext),
        B = !1 !== _,
        D = !1 === _ ? "none" : !0 === _ ? "full" : "auto",
        z =
          "none" !== D
            ? "auto" === D
              ? f.FetchStrategy.PPR
              : f.FetchStrategy.Full
            : f.FetchStrategy.PPR,
        H = "string" == typeof (s = w || v) ? s : (0, i.formatUrl)(s);
      if (E) {
        if (r?.$$typeof === Symbol.for("react.lazy"))
          throw Object.defineProperty(
            Error(
              "`<Link legacyBehavior>` received a direct child that is either a Server Component, or JSX that was loaded with React.lazy(). This is not supported. Either remove legacyBehavior, or make the direct child a Client Component that renders the Link's `<a>` tag.",
            ),
            "__NEXT_ERROR_CODE",
            { value: "E863", enumerable: !1, configurable: !0 },
          );
        a = o.default.Children.only(r);
      }
      let F = E ? a && "object" == typeof a && a.ref : L,
        J,
        G = o.default.useCallback(
          (e) => (
            null !== M &&
              (j.current = (0, x.mountLinkInstance)(e, H, M, z, B, y, J)),
            () => {
              (j.current &&
                ((0, x.unmountLinkForCurrentNavigation)(j.current),
                (j.current = null)),
                (0, x.unmountPrefetchableInstance)(e));
            }
          ),
          [B, H, M, z, y, J],
        ),
        K = {
          ref: (0, d.useMergedRef)(G, F),
          onClick(t) {
            (E || "function" != typeof A || A(t),
              E &&
                a.props &&
                "function" == typeof a.props.onClick &&
                a.props.onClick(t),
              !M ||
                t.defaultPrevented ||
                (function (t, s, r, a, n, l, i, c = "none") {
                  if ("u" > typeof window) {
                    let d,
                      { nodeName: u } = t.currentTarget;
                    if (
                      ("A" === u.toUpperCase() &&
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
                    if (!(0, h.isLocalURL)(s)) {
                      a && (t.preventDefault(), location.replace(s));
                      return;
                    }
                    if ((t.preventDefault(), l)) {
                      let e = !1;
                      if (
                        (l({
                          preventDefault: () => {
                            e = !0;
                          },
                        }),
                        e)
                      )
                        return;
                    }
                    let { dispatchNavigateAction: m } = e.r(99781);
                    o.default.startTransition(() => {
                      m(
                        s,
                        a ? "replace" : "push",
                        !1 === n
                          ? p.ScrollBehavior.NoScroll
                          : p.ScrollBehavior.Default,
                        r.current,
                        i,
                        c,
                      );
                    });
                  }
                })(t, H, j, S, $, R, I, D));
          },
          onMouseEnter(e) {
            (E || "function" != typeof U || U(e),
              E &&
                a.props &&
                "function" == typeof a.props.onMouseEnter &&
                a.props.onMouseEnter(e),
              M && B && (0, x.onNavigationIntent)(e.currentTarget, !0 === T));
          },
          onTouchStart: function (e) {
            (E || "function" != typeof P || P(e),
              E &&
                a.props &&
                "function" == typeof a.props.onTouchStart &&
                a.props.onTouchStart(e),
              M && B && (0, x.onNavigationIntent)(e.currentTarget, !0 === T));
          },
        };
      return (
        (0, u.isAbsoluteUrl)(H)
          ? (K.href = H)
          : (E && !k && ("a" !== a.type || "href" in a.props)) ||
            (K.href = (0, m.addBasePath)(H)),
        (n = E
          ? o.default.cloneElement(a, K)
          : (0, l.jsx)("a", { ...O, ...K, children: r })),
        (0, l.jsx)(g.Provider, { value: b, children: n })
      );
    }
    let g = (0, o.createContext)(x.IDLE_LINK_STATUS),
      y = () => (0, o.useContext)(g);
    ("function" == typeof s.default ||
      ("object" == typeof s.default && null !== s.default)) &&
      void 0 === s.default.__esModule &&
      (Object.defineProperty(s.default, "__esModule", { value: !0 }),
      Object.assign(s.default, s),
      (t.exports = s.default));
  },
  18581,
  (e, t, s) => {
    "use strict";
    (Object.defineProperty(s, "__esModule", { value: !0 }),
      Object.defineProperty(s, "useMergedRef", {
        enumerable: !0,
        get: function () {
          return a;
        },
      }));
    let r = e.r(71645);
    function a(e, t) {
      let s = (0, r.useRef)(null),
        a = (0, r.useRef)(null);
      return (0, r.useCallback)(
        (r) => {
          if (null === r) {
            let e = s.current;
            e && ((s.current = null), e());
            let t = a.current;
            t && ((a.current = null), t());
          } else (e && (s.current = n(e, r)), t && (a.current = n(t, r)));
        },
        [e, t],
      );
    }
    function n(e, t) {
      if ("function" != typeof e)
        return (
          (e.current = t),
          () => {
            e.current = null;
          }
        );
      {
        let s = e(t);
        return "function" == typeof s ? s : () => e(null);
      }
    }
    ("function" == typeof s.default ||
      ("object" == typeof s.default && null !== s.default)) &&
      void 0 === s.default.__esModule &&
      (Object.defineProperty(s.default, "__esModule", { value: !0 }),
      Object.assign(s.default, s),
      (t.exports = s.default));
  },
  18967,
  (e, t, s) => {
    "use strict";
    (e.i(47167), Object.defineProperty(s, "__esModule", { value: !0 }));
    var r = {
      DecodeError: function () {
        return b;
      },
      MiddlewareNotFoundError: function () {
        return v;
      },
      MissingStaticPage: function () {
        return j;
      },
      NormalizeError: function () {
        return g;
      },
      PageNotFoundError: function () {
        return y;
      },
      SP: function () {
        return h;
      },
      ST: function () {
        return f;
      },
      WEB_VITALS: function () {
        return n;
      },
      execOnce: function () {
        return l;
      },
      getDisplayName: function () {
        return u;
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
        return m;
      },
      loadGetInitialProps: function () {
        return x;
      },
      normalizeRepeatedSlashes: function () {
        return p;
      },
      stringifyError: function () {
        return w;
      },
    };
    for (var a in r) Object.defineProperty(s, a, { enumerable: !0, get: r[a] });
    let n = ["CLS", "FCP", "FID", "INP", "LCP", "TTFB"];
    function l(e) {
      let t,
        s = !1;
      return (...r) => (s || ((s = !0), (t = e(...r))), t);
    }
    let o = /^[a-zA-Z][a-zA-Z\d+\-.]*?:/,
      i = (e) => {
        let t = e.charCodeAt(0);
        return !!((t >= 65 && t <= 90) || (t >= 97 && t <= 122)) && o.test(e);
      };
    function c() {
      let { protocol: e, hostname: t, port: s } = window.location;
      return `${e}//${t}${s ? ":" + s : ""}`;
    }
    function d() {
      let { href: e } = window.location,
        t = c();
      return e.substring(t.length);
    }
    function u(e) {
      return "string" == typeof e ? e : e.displayName || e.name || "Unknown";
    }
    function m(e) {
      return e.finished || e.headersSent;
    }
    function p(e) {
      let t = e.split("?");
      return (
        t[0].replace(/\\/g, "/").replace(/\/\/+/g, "/") +
        (t[1] ? `?${t.slice(1).join("?")}` : "")
      );
    }
    async function x(e, t) {
      let s = t.res || (t.ctx && t.ctx.res);
      if (!e.getInitialProps)
        return t.ctx && t.Component
          ? { pageProps: await x(t.Component, t.ctx) }
          : {};
      let r = await e.getInitialProps(t);
      if (s && m(s)) return r;
      if (!r)
        throw Object.defineProperty(
          Error(
            `"${u(e)}.getInitialProps()" should resolve to an object. But found "${r}" instead.`,
          ),
          "__NEXT_ERROR_CODE",
          { value: "E1025", enumerable: !1, configurable: !0 },
        );
      return r;
    }
    let h = "u" > typeof performance,
      f =
        h &&
        ["mark", "measure", "getEntriesByName"].every(
          (e) => "function" == typeof performance[e],
        );
    class b extends Error {}
    class g extends Error {}
    class y extends Error {
      constructor(e) {
        (super(),
          (this.code = "ENOENT"),
          (this.name = "PageNotFoundError"),
          (this.message = `Cannot find module for page: ${e}`));
      }
    }
    class j extends Error {
      constructor(e, t) {
        (super(),
          (this.message = `Failed to load static file for page: ${e} ${t}`));
      }
    }
    class v extends Error {
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
  (e, t, s) => {
    "use strict";
    (Object.defineProperty(s, "__esModule", { value: !0 }),
      Object.defineProperty(s, "isLocalURL", {
        enumerable: !0,
        get: function () {
          return n;
        },
      }));
    let r = e.r(18967),
      a = e.r(52817);
    function n(e) {
      if (!(0, r.isAbsoluteUrl)(e)) return !0;
      try {
        let t = (0, r.getLocationOrigin)(),
          s = new URL(e, t);
        return s.origin === t && (0, a.hasBasePath)(s.pathname);
      } catch (e) {
        return !1;
      }
    }
  },
  98183,
  (e, t, s) => {
    "use strict";
    Object.defineProperty(s, "__esModule", { value: !0 });
    var r = {
      assign: function () {
        return i;
      },
      searchParamsToUrlQuery: function () {
        return n;
      },
      urlQueryToSearchParams: function () {
        return o;
      },
    };
    for (var a in r) Object.defineProperty(s, a, { enumerable: !0, get: r[a] });
    function n(e) {
      let t = {};
      for (let [s, r] of e.entries()) {
        let e = t[s];
        void 0 === e
          ? (t[s] = r)
          : Array.isArray(e)
            ? e.push(r)
            : (t[s] = [e, r]);
      }
      return t;
    }
    function l(e) {
      return "string" == typeof e
        ? e
        : ("number" != typeof e || isNaN(e)) && "boolean" != typeof e
          ? ""
          : String(e);
    }
    function o(e) {
      let t = new URLSearchParams();
      for (let [s, r] of Object.entries(e))
        if (Array.isArray(r)) for (let e of r) t.append(s, l(e));
        else t.set(s, l(r));
      return t;
    }
    function i(e, ...t) {
      for (let s of t) {
        for (let t of s.keys()) e.delete(t);
        for (let [t, r] of s.entries()) e.append(t, r);
      }
      return e;
    }
  },
  95057,
  (e, t, s) => {
    "use strict";
    (e.i(47167), Object.defineProperty(s, "__esModule", { value: !0 }));
    var r = {
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
    for (var a in r) Object.defineProperty(s, a, { enumerable: !0, get: r[a] });
    let n = e.r(90809)._(e.r(98183)),
      l = /https?|ftp|gopher|file/;
    function o(e) {
      let { auth: t, hostname: s } = e,
        r = e.protocol || "",
        a = e.pathname || "",
        o = e.hash || "",
        i = e.query || "",
        c = !1;
      ((t = t ? encodeURIComponent(t).replace(/%3A/i, ":") + "@" : ""),
        e.host
          ? (c = t + e.host)
          : s &&
            ((c = t + (~s.indexOf(":") ? `[${s}]` : s)),
            e.port && (c += ":" + e.port)),
        i && "object" == typeof i && (i = String(n.urlQueryToSearchParams(i))));
      let d = e.search || (i && `?${i}`) || "";
      return (
        r && !r.endsWith(":") && (r += ":"),
        e.slashes || ((!r || l.test(r)) && !1 !== c)
          ? ((c = "//" + (c || "")), a && "/" !== a[0] && (a = "/" + a))
          : c || (c = ""),
        o && "#" !== o[0] && (o = "#" + o),
        d && "?" !== d[0] && (d = "?" + d),
        (a = a.replace(/[?#]/g, encodeURIComponent)),
        (d = d.replace("#", "%23")),
        `${r}${c}${a}${d}${o}`
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
  18566,
  (e, t, s) => {
    t.exports = e.r(76562);
  },
]);
