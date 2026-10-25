"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "../Icon";
import { LineArt, useLineMeta } from "./CartView";
import { useFormat, usePrefs, useStore } from "../providers";

export function ConfirmationView() {
  const { t } = usePrefs();
  const c = t.confirm;
  const fmt = useFormat();
  const meta = useLineMeta();
  const { state, ready } = useStore();
  const [shared, setShared] = useState(false);
  const order = state.orders.find((o) => o.id === state.lastOrder) ?? state.orders[0];

  if (!ready) return <div className="wrap page" style={{ minHeight: 480 }} />;
  if (!order) {
    return (
      <div className="wrap page wrap-narrow" style={{ alignItems: "center", textAlign: "center" }}>
        <p className="muted">{c.none}</p>
        <Link className="btn btn-primary" href="/shop">{t.common.shopNow}</Link>
      </div>
    );
  }

  const hasCustom = order.lines.some((l) => l.custom);
  const steps = (order.method === "ship" ? c.stepsShip : c.steps).filter((_, i) => i !== 1 || hasCustom);
  const doneCount = hasCustom ? 2 : 1;
  const spotName = order.spot ? t.checkout.spots[order.spot as "event"][0] : "";

  const share = async () => {
    const url = window.location.origin;
    try {
      if (navigator.share) await navigator.share({ title: "LEAD Store", url });
      else { await navigator.clipboard.writeText(url); setShared(true); }
    } catch {}
  };

  return (
    <div className="wrap page wrap-narrow" style={{ paddingTop: 56 }}>
      <div className="stack" style={{ alignItems: "center", textAlign: "center", gap: 14 }}>
        <span style={{ width: 72, height: 72, borderRadius: 9999, background: "var(--success-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--success-fg)" }}>
          <Icon name="check" size={36} />
        </span>
        <h1 className="h1">{c.thanks(order.firstName)}</h1>
        <p className="muted" style={{ fontSize: 16, maxWidth: 560 }}>
          {c.body1}<strong style={{ color: "var(--fg)" }}>#{order.num}</strong>{c.body2(order.email)}
        </p>
      </div>

      <section className="card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
        <div className="between" style={{ gap: 8 }}>
          <h2 style={{ fontSize: 20 }}>{c.status}</h2>
          <span className="muted" style={{ fontSize: 13 }}>{order.method === "ship" ? c.shipTo(order.city ?? "") : c.pickupAt(spotName)}</span>
        </div>
        <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
          {steps.map(([title, sub], i) => (
            <li key={title} className="stack" style={{ gap: 8 }}>
              <div style={{ height: 6, borderRadius: 9999, background: i < doneCount ? "var(--grad-progress)" : "var(--muted)" }} />
              <strong style={{ fontSize: 14, color: i < doneCount ? "var(--fg)" : "var(--muted-fg)" }}>{title}</strong>
              <span className="muted" style={{ fontSize: 13 }}>{sub}</span>
            </li>
          ))}
        </ol>
      </section>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
        <section className="card" style={{ flex: "1 1 380px", padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <h2 style={{ fontSize: 18 }}>{c.ordered}</h2>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
            {order.lines.map((l) => (
              <li key={l.id} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <LineArt l={l} size={56} />
                <span style={{ flex: 1, minWidth: 0 }}><strong style={{ display: "block" }}>{fmt.lineName(l)}</strong><span className="muted" style={{ fontSize: 12 }}>{meta(l)} · {t.common.qty} {l.qty}</span></span>
                <span>{fmt.money(l.unitPrice * l.qty)}</span>
              </li>
            ))}
          </ul>
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
            <span>{c.paid}</span><span>{fmt.money(order.total)}</span>
          </div>
        </section>
        <section className="inverse" style={{ flex: "1 1 300px", padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <span className="overline" style={{ color: "var(--inverse-accent)" }}>{c.impactOver}</span>
          <h2 style={{ fontSize: 20 }}>{c.impactTitle}</h2>
          <p style={{ color: "var(--inverse-muted)", fontSize: 13 }}>{c.impactSub}</p>
          <div className="row" style={{ gap: 8, marginTop: "auto" }}>
            <Link className="btn btn-primary" href="/impact">{t.common.seeImpact}</Link>
            <button type="button" className="btn btn-ghost-inv" onClick={share}>{shared ? c.shared : c.share}</button>
          </div>
        </section>
      </div>

      <div className="row" style={{ justifyContent: "center" }}>
        <Link className="btn btn-primary" href="/account">{c.track}</Link>
        <Link className="btn btn-outline" href="/shop">{t.common.continueShopping}</Link>
      </div>
    </div>
  );
}
