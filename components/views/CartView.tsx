"use client";

import Link from "next/link";
import { useState } from "react";
import { COLORS } from "@/lib/catalog";
import { computeTotals, PROMO_CODES } from "@/lib/pricing";
import type { CartLine } from "@/lib/types";
import { Icon } from "../Icon";
import { ProductArt } from "../ProductArt";
import { QtyStepper } from "../ProductCard";
import { useFormat, usePrefs, useStore } from "../providers";

export function LineArt({ l, size = 104 }: { l: CartLine; size?: number }) {
  return (
    <span style={{ width: size, height: size, borderRadius: 12, background: "var(--tile)", flex: "none", display: "block" }}>
      <ProductArt kind={l.kind} fill={COLORS[l.color].hex} print={l.print} text={l.text} image={l.image} mark={l.mark} decorative />
    </span>
  );
}

export function useLineMeta() {
  const fmt = useFormat();
  const { t } = usePrefs();
  return (l: CartLine) => [fmt.color(l.color), fmt.size(l.size), l.custom && l.text ? `“${l.text}”` : null, l.group ? t.nav.group : null].filter(Boolean).join(" · ");
}

export function CartView() {
  const { t } = usePrefs();
  const c = t.cart;
  const fmt = useFormat();
  const meta = useLineMeta();
  const { state, update, ready } = useStore();
  const [code, setCode] = useState("");
  const [badCode, setBadCode] = useState(false);

  const totals = computeTotals({ lines: state.cart, delivery: state.delivery, gift: state.gift, promo: state.promo });
  const ship = state.delivery === "ship";

  const setQty = (id: string, qty: number) => update((s) => ({ ...s, cart: s.cart.map((l) => (l.id === id ? { ...l, qty } : l)) }));
  const remove = (id: string) => update((s) => ({ ...s, cart: s.cart.filter((l) => l.id !== id) }));
  const later = (l: CartLine) => update((s) => ({ ...s, cart: s.cart.filter((x) => x.id !== l.id), saved: [...s.saved, l] }));
  const back = (l: CartLine) => update((s) => ({ ...s, saved: s.saved.filter((x) => x.id !== l.id), cart: [...s.cart, l] }));
  const apply = () => {
    const v = code.trim().toUpperCase();
    if (PROMO_CODES.includes(v)) { update((s) => ({ ...s, promo: v })); setBadCode(false); setCode(""); }
    else setBadCode(true);
  };

  if (!ready) return <div className="wrap page" style={{ minHeight: 480 }}><h1 className="h1">{c.title}</h1></div>;

  return (
    <div className="wrap page">
      <h1 className="h1">{c.title} <span className="muted" style={{ fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 400 }}>({c.count(totals.units)})</span></h1>

      {state.cart.length === 0 && (
        <div className="card" style={{ padding: "56px 24px", display: "flex", flexDirection: "column", gap: 14, alignItems: "center", textAlign: "center" }}>
          <h2 style={{ fontSize: 22 }}>{c.empty}</h2>
          <p className="muted">{c.emptySub}</p>
          <div className="row" style={{ justifyContent: "center", gap: 10 }}>
            <Link className="btn btn-primary" href="/shop">{t.common.shopNow}</Link>
            <Link className="btn btn-outline" href="/custom">{t.common.designOwn}</Link>
          </div>
        </div>
      )}

      {(state.cart.length > 0 || state.saved.length > 0) && (
        <div className="split">
          <div className="split-main" style={{ gap: 16 }}>
            {state.cart.length > 0 && (
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {state.cart.map((l) => {
                  const name = fmt.lineName(l);
                  const art = <LineArt l={l} />;
                  return (
                    <li key={l.id} className="card cart-line">
                      {l.slug ? <Link href={`/product/${l.slug}`} aria-label={name}>{art}</Link> : art}
                      <div className="stack" style={{ flex: "1 1 180px", minWidth: 0, gap: 2 }}>
                        <strong style={{ fontSize: 16 }}>{name}</strong>
                        <span className="muted" style={{ fontSize: 13 }}>{meta(l)}</span>
                        <span style={{ fontSize: 13 }}>{fmt.money(l.unitPrice)} {t.common.each}{l.custom ? ` ${c.plusPrint}` : ""}</span>
                        <div style={{ display: "flex", gap: 16 }}>
                          <button type="button" className="linkbtn" onClick={() => later(l)}>{c.later}</button>
                          <button type="button" className="linkbtn" onClick={() => remove(l.id)}>{c.remove}</button>
                        </div>
                      </div>
                      <div className="cart-line-end">
                        <QtyStepper value={l.qty} onChange={(n) => setQty(l.id, n)} label={c.qtyFor(name)} />
                        <strong style={{ minWidth: 80, textAlign: "right", fontSize: 16 }}>{fmt.money(l.unitPrice * l.qty)}</strong>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {state.saved.length > 0 && (
              <section className="stack" style={{ gap: 10 }}>
                <h2 style={{ fontSize: 18 }}>{c.savedTitle}</h2>
                {state.saved.map((l) => (
                  <div key={l.id} className="card between" style={{ padding: "12px 16px" }}>
                    <span><strong>{fmt.lineName(l)}</strong> <span className="muted">· {meta(l)}</span></span>
                    <button type="button" className="btn btn-outline" style={{ minHeight: 40 }} onClick={() => back(l)}>{c.moveBack}</button>
                  </div>
                ))}
              </section>
            )}

            <div className="tint" style={{ padding: 16 }}>
              <Icon name="users" />
              <span style={{ flex: 1 }}>{c.group}</span>
              <Link href="/group-order" style={{ fontWeight: 600 }}>{c.startOne}</Link>
            </div>
            <Link href="/shop" style={{ fontWeight: 600, minHeight: 44, display: "inline-flex", alignItems: "center" }}>← {t.common.continueShopping}</Link>
          </div>

          {state.cart.length > 0 && (
            <aside className="card split-side" aria-label={c.summary} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
              <h2 style={{ fontSize: 20 }}>{c.summary}</h2>
              <fieldset>
                <legend className="legend-plain">{c.delivery}</legend>
                <div className="seg">
                  {(["pickup", "ship"] as const).map((id) => (
                    <button key={id} type="button" aria-pressed={state.delivery === id} onClick={() => update((s) => ({ ...s, delivery: id }))}>{c[id]}</button>
                  ))}
                </div>
                <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>{ship ? c.shipNote : c.pickupNote}</p>
              </fieldset>
              <fieldset>
                <legend className="legend-plain" style={{ marginBottom: 4 }}>{c.gift}</legend>
                <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>{c.giftSub}</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 6 }}>
                  {[0, 2, 5, 10].map((g) => (
                    <button key={g} type="button" className="chip" aria-pressed={state.gift === g} onClick={() => update((s) => ({ ...s, gift: g }))} style={{ padding: 0, fontWeight: 600 }}>
                      {g === 0 ? c.none : fmt.money(g).replace(/\.00$/, "")}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div>
                <label className="label" htmlFor="promo">{c.promo}</label>
                {state.promo ? (
                  <div className="between" style={{ fontSize: 13 }}>
                    <span style={{ color: "var(--success-fg)", fontWeight: 600 }}>{c.applied(state.promo)}</span>
                    <button type="button" className="linkbtn" onClick={() => update((s) => ({ ...s, promo: null }))}>{c.removeCode}</button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input id="promo" className="input" placeholder={c.promoPh} value={code} aria-invalid={badCode}
                        onChange={(e) => { setCode(e.target.value); setBadCode(false); }} onKeyDown={(e) => { if (e.key === "Enter") apply(); }} />
                      <button type="button" className="btn btn-outline" onClick={apply}>{c.apply}</button>
                    </div>
                    {badCode && <p className="field-error" role="alert">{c.badCode}</p>}
                  </>
                )}
              </div>
              <dl className="summary">
                <div><dt>{c.subtotal}</dt><dd>{fmt.money(totals.subtotal)}</dd></div>
                {totals.setup > 0 && <div><dt>{c.setup}</dt><dd>{fmt.money(totals.setup)}</dd></div>}
                {totals.discount > 0 && <div><dt>{c.discount}</dt><dd style={{ color: "var(--success-fg)" }}>−{fmt.money(totals.discount)}</dd></div>}
                <div><dt>{ship ? c.shipping : c.pickup}</dt><dd>{ship ? fmt.money(totals.shipping) : t.common.free}</dd></div>
                {totals.gift > 0 && <div><dt>{c.giftLine}</dt><dd>{fmt.money(totals.gift)}</dd></div>}
                <div><dt>{c.tax}</dt><dd className="muted">{c.atCheckout}</dd></div>
                <div className="total"><dt>{c.total}</dt><dd>{fmt.money(totals.total)}</dd></div>
              </dl>
              <Link className="btn btn-primary btn-lg" href="/checkout">{c.checkout}</Link>
              <p className="muted" style={{ fontSize: 12, textAlign: "center", display: "flex", gap: 6, justifyContent: "center", alignItems: "center" }}>
                <Icon name="lock" size={14} />{c.secure}
              </p>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}
