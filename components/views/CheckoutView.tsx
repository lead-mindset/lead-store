"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CHAPTERS } from "@/lib/catalog";
import { computeTotals } from "@/lib/pricing";
import type { Order, OrderRequest } from "@/lib/types";
import { Icon } from "../Icon";
import { LineArt, useLineMeta } from "./CartView";
import { uid, useFormat, usePrefs, useStore } from "../providers";

type Spot = "event" | "chapter" | "office";
type Pay = "card" | "apple" | "google" | "paypal";
type Fields = Record<string, string>;

const EMAIL = /^\S+@\S+\.\S+$/;

export function CheckoutView() {
  const { t, lang } = usePrefs();
  const c = t.checkout;
  const e = c.errors;
  const fmt = useFormat();
  const meta = useLineMeta();
  const router = useRouter();
  const { state, update, ready } = useStore();

  const [f, setF] = useState<Fields>({});
  const [speed, setSpeed] = useState<"standard" | "express">("standard");
  const [spot, setSpot] = useState<Spot>("event");
  const [pay, setPay] = useState<Pay>("card");
  const [agree, setAgree] = useState(false);
  const [news, setNews] = useState(true);
  const [errors, setErrors] = useState<Fields>({});
  const [placing, setPlacing] = useState(false);
  const [sendError, setSendError] = useState(false);

  // Prefill contact details from the saved profile once the store loads.
  useEffect(() => {
    if (!ready) return;
    const p = state.profile;
    setF((cur) => ({ email: p.email, first: p.first, last: p.last, chapter: p.chapter, street: p.address, ...cur }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const mode = state.delivery;
  const ship = mode === "ship";
  const totals = computeTotals({ lines: state.cart, delivery: mode, speed, gift: state.gift, promo: state.promo, withTax: true });

  const set = (k: string) => (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setF((cur) => ({ ...cur, [k]: ev.target.value }));
    if (errors[k]) setErrors((cur) => ({ ...cur, [k]: "" }));
  };

  const validate = () => {
    const err: Fields = {};
    const req = (k: string) => { if (!f[k]?.trim()) err[k] = e.required; };
    req("email"); req("first"); req("last");
    if (f.email && !EMAIL.test(f.email)) err.email = e.email;
    if (ship) { req("street"); req("city"); req("state"); req("zip"); }
    if (pay === "card") {
      const digits = (f.cc ?? "").replace(/\D/g, "");
      if (digits.length < 13 || digits.length > 19) err.cc = e.card;
      if (!/^(0[1-9]|1[0-2])\s*\/\s*\d{2}$/.test(f.exp ?? "")) err.exp = e.exp;
      if (!/^\d{3,4}$/.test(f.cvc ?? "")) err.cvc = e.cvc;
      req("ccname");
    }
    if (!agree) err.terms = e.terms;
    return err;
  };

  const place = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const err = validate();
    setErrors(err);
    if (Object.keys(err).length) {
      const first = Object.keys(err)[0];
      document.getElementById(first === "terms" ? "terms" : `c-${first}`)?.focus();
      return;
    }
    setPlacing(true);
    setSendError(false);
    const order: Order = {
      id: uid(),
      num: String(Math.floor(1000 + Math.random() * 9000)),
      date: new Date().toISOString(),
      lines: state.cart,
      total: totals.total,
      method: mode,
      spot: ship ? undefined : spot,
      city: ship ? f.city : undefined,
      firstName: f.first.trim(),
      email: f.email.trim(),
    };

    // Send the order to the supplier by email. Card details never leave the browser.
    const req: OrderRequest = {
      num: order.num, lang,
      customer: { first: f.first, last: f.last, email: f.email, phone: f.phone, chapter: f.chapter },
      delivery: { method: mode, speed, spot, street: f.street, apt: f.apt, city: f.city, state: f.state, zip: f.zip, country: f.country ?? c.countries[0] },
      pay, promo: state.promo, gift: state.gift, notes: f.notes,
      lines: state.cart.map((l) => ({ slug: l.slug, kind: l.kind, color: l.color, size: l.size, qty: l.qty, print: l.print, custom: l.custom, group: l.group, text: l.text, image: l.image, mark: l.mark })),
    };
    let payload = JSON.stringify(req);
    // Serverless request bodies are capped (~4.5 MB on Vercel): drop oversized artwork and flag it instead.
    if (payload.length > 4_000_000) payload = JSON.stringify({ ...req, imagesOmitted: true, lines: req.lines.map((l) => ({ ...l, image: undefined })) });
    try {
      const res = await fetch("/api/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload });
      if (!res.ok) throw new Error(String(res.status));
    } catch {
      setPlacing(false);
      setSendError(true);
      return;
    }

    update((s) => ({
      ...s,
      orders: [order, ...s.orders],
      lastOrder: order.id,
      cart: [],
      gift: 0,
      promo: null,
      group: s.cart.some((l) => l.group) ? null : s.group,
      profile: { ...s.profile, email: s.profile.email || order.email, first: s.profile.first || f.first, last: s.profile.last || f.last, chapter: s.profile.chapter || f.chapter || "" },
    }));
    router.push("/confirmation");
  };

  if (!ready) return <div className="wrap page" style={{ minHeight: 480 }}><h1 className="h1">{c.title}</h1></div>;
  if (state.cart.length === 0 && !placing) {
    return (
      <div className="wrap page">
        <h1 className="h1">{c.title}</h1>
        <div className="card" style={{ padding: 40, textAlign: "center", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
          <p className="muted">{c.empty}</p>
          <Link className="btn btn-primary" href="/shop">{t.common.shopNow}</Link>
        </div>
      </div>
    );
  }

  const input = (k: string, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, full = false) => (
    <div className={full ? "full" : undefined}>
      <label className="label" htmlFor={`c-${k}`}>{label}</label>
      <input id={`c-${k}`} className="input" value={f[k] ?? ""} onChange={set(k)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `e-${k}` : undefined} {...props} />
      {errors[k] && <p id={`e-${k}`} className="field-error">{errors[k]}</p>}
    </div>
  );

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <div className="wrap page" style={{ maxWidth: 1180 }}>
      <div className="between">
        <h1 className="h1">{c.title}</h1>
        <Link href="/cart" style={{ fontWeight: 600, minHeight: 44, display: "inline-flex", alignItems: "center" }}>{c.back}</Link>
      </div>

      <form className="split" onSubmit={place} noValidate>
        <div className="split-main">
          <section className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="between" style={{ gap: 8 }}>
              <h2 style={{ fontSize: 20, display: "flex", gap: 10, alignItems: "center" }}><span className="step-num">1</span>{c.contact}</h2>
              <span style={{ fontSize: 13 }}>{c.haveAccount} <Link href="/account">{c.signIn}</Link></span>
            </div>
            <div className="grid2">
              {input("email", c.email, { type: "email", autoComplete: "email", placeholder: "you@university.edu", required: true })}
              {input("phone", c.phone, { type: "tel", autoComplete: "tel" })}
              {input("first", c.first, { autoComplete: "given-name", required: true })}
              {input("last", c.last, { autoComplete: "family-name", required: true })}
              <div>
                <label className="label" htmlFor="c-chapter">{c.chapter}</label>
                <select id="c-chapter" className="input" value={f.chapter ?? ""} onChange={set("chapter")}>
                  <option value="">{c.selectChapter}</option>
                  {CHAPTERS.map((ch) => <option key={ch.id} value={ch.name}>{ch.name}</option>)}
                  <option value={c.other}>{c.other}</option>
                  <option value={c.noChapter}>{c.noChapter}</option>
                </select>
              </div>
            </div>
            <label className="check"><input type="checkbox" checked={news} onChange={() => setNews(!news)} />{c.news}</label>
          </section>

          <section className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ fontSize: 20, display: "flex", gap: 10, alignItems: "center" }}><span className="step-num">2</span>{c.delivery}</h2>
            <div role="group" aria-label={c.method} className="seg">
              {(["pickup", "ship"] as const).map((id) => (
                <button key={id} type="button" aria-pressed={mode === id} onClick={() => update((s) => ({ ...s, delivery: id }))} style={{ minHeight: 48, fontSize: 14 }}>{c[id]}</button>
              ))}
            </div>
            {ship ? (
              <>
                <div className="grid2">
                  {input("street", c.street, { autoComplete: "address-line1", required: true }, true)}
                  {input("apt", c.apt, { autoComplete: "address-line2" }, true)}
                  {input("city", c.city, { autoComplete: "address-level2", required: true })}
                  {input("state", c.state, { autoComplete: "address-level1", required: true })}
                  {input("zip", c.zip, { autoComplete: "postal-code", required: true })}
                  <div>
                    <label className="label" htmlFor="c-country">{c.country}</label>
                    <select id="c-country" className="input" autoComplete="country-name" value={f.country ?? c.countries[0]} onChange={set("country")}>
                      {c.countries.map((x) => <option key={x}>{x}</option>)}
                    </select>
                  </div>
                </div>
                <fieldset className="stack" style={{ gap: 8 }}>
                  <legend className="legend-plain">{c.speed}</legend>
                  {(["standard", "express"] as const).map((id) => (
                    <label key={id} className="option" data-on={speed === id} style={{ alignItems: "center" }}>
                      <input type="radio" name="speed" checked={speed === id} onChange={() => setSpeed(id)} style={{ marginTop: 0 }} />
                      <span style={{ flex: 1 }}>{c[id]}</span>
                      <strong>{fmt.money(computeTotals({ lines: state.cart, delivery: "ship", speed: id, gift: 0, promo: null }).shipping)}</strong>
                    </label>
                  ))}
                </fieldset>
              </>
            ) : (
              <fieldset className="stack" style={{ gap: 8 }}>
                <legend className="legend-plain">{c.spot}</legend>
                {(["event", "chapter", "office"] as const).map((id) => (
                  <label key={id} className="option" data-on={spot === id}>
                    <input type="radio" name="spot" checked={spot === id} onChange={() => setSpot(id)} />
                    <span className="stack" style={{ flex: 1 }}><strong>{c.spots[id][0]}</strong><span className="muted" style={{ fontSize: 13 }}>{c.spots[id][1]}</span></span>
                    <span className="muted" style={{ fontSize: 13 }}>{t.common.free}</span>
                  </label>
                ))}
              </fieldset>
            )}
          </section>

          <section className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <h2 style={{ fontSize: 20, display: "flex", gap: 10, alignItems: "center" }}><span className="step-num">3</span>{c.payment}</h2>
            <div role="group" aria-label={c.payMethod} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
              {(["card", "apple", "google", "paypal"] as const).map((id) => (
                <button key={id} type="button" aria-pressed={pay === id} onClick={() => setPay(id)} className="size-btn" style={{ minHeight: 52, fontSize: 14 }}>{c.pays[id]}</button>
              ))}
            </div>
            {pay === "card" ? (
              <>
                <div className="grid2">
                  {input("cc", c.card, { inputMode: "numeric", autoComplete: "cc-number", placeholder: "1234 1234 1234 1234" }, true)}
                  {input("exp", c.exp, { autoComplete: "cc-exp", placeholder: "MM / YY", inputMode: "numeric" })}
                  {input("cvc", c.cvc, { autoComplete: "cc-csc", placeholder: "CVC", inputMode: "numeric", maxLength: 4 })}
                  {input("ccname", c.nameOnCard, { autoComplete: "cc-name" }, true)}
                </div>
                <label className="check"><input type="checkbox" defaultChecked />{c.sameBilling}</label>
              </>
            ) : (
              <p className="muted">{c.wallet}</p>
            )}
            <p className="muted" style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center" }}><Icon name="lock" size={14} />{c.secureNote}</p>
            <p className="badge badge-warn" style={{ alignSelf: "flex-start", height: "auto", padding: "4px 10px", whiteSpace: "normal" }}>{c.demo}</p>
          </section>

          <section className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
            <label className="label" htmlFor="c-notes" style={{ margin: 0 }}>{c.notes}</label>
            <textarea id="c-notes" className="input" rows={3} placeholder={c.notesPh} value={f.notes ?? ""} onChange={set("notes")} />
            <label className="check">
              <input id="terms" type="checkbox" checked={agree} onChange={() => { setAgree(!agree); setErrors((cur) => ({ ...cur, terms: "" })); }} aria-invalid={!!errors.terms} />
              <span>{c.agree1}<Link href="/faq?topic=returns">{c.terms}</Link>{c.agree2}</span>
            </label>
            {errors.terms && <p className="field-error">{errors.terms}</p>}
          </section>
        </div>

        <aside className="card split-side" aria-label={c.summary} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 130 }}>
          <h2 style={{ fontSize: 20 }}>{c.summary}</h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            {state.cart.map((l) => (
              <li key={l.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <span style={{ position: "relative" }}>
                  <LineArt l={l} size={60} />
                  <span style={{ position: "absolute", top: -6, right: -6, minWidth: 20, height: 20, borderRadius: 9999, background: "var(--fg)", color: "var(--bg)", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>{l.qty}</span>
                </span>
                <span className="stack" style={{ flex: 1, minWidth: 0 }}><strong style={{ fontSize: 14 }}>{fmt.lineName(l)}</strong><span className="muted" style={{ fontSize: 12 }}>{meta(l)}</span></span>
                <span>{fmt.money(l.unitPrice * l.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="summary">
            <div><dt>{c.subtotal}</dt><dd>{fmt.money(totals.subtotal)}</dd></div>
            {totals.setup > 0 && <div><dt>{c.setup}</dt><dd>{fmt.money(totals.setup)}</dd></div>}
            {totals.discount > 0 && <div><dt>{c.discount}</dt><dd style={{ color: "var(--success-fg)" }}>−{fmt.money(totals.discount)}</dd></div>}
            <div><dt>{ship ? c.shipping : c.pickupLine}</dt><dd>{ship ? fmt.money(totals.shipping) : t.common.free}</dd></div>
            {totals.gift > 0 && <div><dt>{c.gift}</dt><dd>{fmt.money(totals.gift)}</dd></div>}
            <div><dt>{c.tax}</dt><dd>{fmt.money(totals.tax)}</dd></div>
            <div className="total"><dt>{c.total}</dt><dd>{fmt.money(totals.total)}</dd></div>
          </dl>
          {hasErrors && <p className="field-error" role="alert" style={{ margin: 0 }}>{e.fix}</p>}
          {sendError && <p className="field-error" role="alert">{c.sendError}</p>}
          <button className="btn btn-primary btn-lg" type="submit" disabled={placing}>{placing ? c.placing : c.place}</button>
          <div className="tint" style={{ padding: 12 }}><Icon name="cap" size={18} />{c.supports}</div>
        </aside>
      </form>
    </div>
  );
}
