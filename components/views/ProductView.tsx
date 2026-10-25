"use client";

import Link from "next/link";
import { useState } from "react";
import { COLORS, ONE_SIZE, PRODUCTS, type ColorId, type Print, type Product } from "@/lib/catalog";
import { Icon } from "../Icon";
import { ProductArt } from "../ProductArt";
import { ProductCard, QtyStepper } from "../ProductCard";
import { useFormat, usePrefs, useStore } from "../providers";

type View = "front" | "back" | "detail" | "lifestyle";

// Approximate unisex measurements in inches (chest width, body length) per size.
const GUIDE: Record<string, [number, number]> = {
  XS: [16.5, 27], S: [18, 28], M: [20, 29], L: [22, 30], XL: [24, 31], "2XL": [26, 32], "3XL": [28, 33],
};

export function ProductView({ p }: { p: Product }) {
  const { t, lang } = usePrefs();
  const pt = t.product;
  const fmt = useFormat();
  const { state, ready, addLine, toggleWish, notify } = useStore();

  const oneSize = p.sizes.length === 1 && p.sizes[0] === ONE_SIZE;
  const [color, setColor] = useState<ColorId>(p.colors[0]);
  const [size, setSize] = useState<string | null>(oneSize ? ONE_SIZE : null);
  const [qty, setQty] = useState(1);
  const [view, setView] = useState<View>("front");
  const [delivery, setDelivery] = useState<"ship" | "pickup">(state.delivery === "ship" ? "ship" : "pickup");
  const [open, setOpen] = useState<string | null>("desc");
  const [needSize, setNeedSize] = useState(false);
  const [added, setAdded] = useState(false);
  const [notified, setNotified] = useState(false);

  const apparel = p.kind === "tee" || p.kind === "hoodie";
  const views: [View, Print][] = apparel
    ? [["front", p.print], ["back", "none"], ["detail", p.print === "values" ? "values" : "chest"], ["lifestyle", "logo"]]
    : [["front", p.print]];
  const curPrint = views.find((v) => v[0] === view)?.[1] ?? p.print;
  const wish = ready && state.wishlist.includes(p.slug);
  const name = p.name[lang];
  const soldOut = p.soldOut ?? [];
  const related = PRODUCTS.filter((x) => x.slug !== p.slug).sort((a, b) => (a.cat === p.cat ? 1 : 0) - (b.cat === p.cat ? 1 : 0)).slice(0, 4);

  const add = () => {
    if (!size) return setNeedSize(true);
    addLine({ slug: p.slug, kind: p.kind, color, size, qty, unitPrice: p.price, print: p.print });
    setAdded(true);
    notify(t.common.added(qty, name), "/cart", t.common.viewCart);
  };

  const panels = [
    ["desc", pt.desc, p.desc[lang]],
    ["care", pt.care, pt.careBody],
    ["returns", pt.returns, pt.returnsBody],
  ];

  return (
    <div className="wrap page">
      <nav aria-label={t.common.breadcrumb} className="muted" style={{ fontSize: 13, display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Link href="/" style={{ color: "inherit" }}>{t.common.home}</Link><span aria-hidden="true">/</span>
        <Link href={`/shop?cat=${p.cat}`} style={{ color: "inherit" }}>{t.shop.cats[p.cat]}</Link><span aria-hidden="true">/</span>
        <span>{name}</span>
      </nav>

      <div className="pdp">
        <div className="pdp-gallery">
          <div className="tile pdp-hero">
            <ProductArt kind={p.kind} fill={COLORS[color].hex} print={curPrint} />
            {p.tag && <span className={`badge ${p.tag === "new" ? "badge-new" : "badge-hot"}`} style={{ position: "absolute", top: 16, left: 16 }}>{p.tag === "new" ? t.common.new : t.common.popular}</span>}
            <span className="badge" style={{ position: "absolute", bottom: 16, left: 16, background: "#fff", color: "oklch(0.28 0.05 272)" }}>{pt.view(pt.views[view])}</span>
          </div>
          {views.length > 1 && (
            <div role="group" aria-label={pt.viewsLabel} className="pdp-thumbs">
              {views.map(([id, print]) => (
                <button key={id} type="button" aria-label={pt.views[id]} aria-pressed={view === id} onClick={() => setView(id)}>
                  <ProductArt kind={p.kind} fill={COLORS[color].hex} print={print} decorative />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pdp-info">
          <div className="stack" style={{ gap: 8 }}>
            <span className="overline" style={{ color: "var(--link)" }}>{pt.collection[p.collection]}</span>
            <h1 className="h1">{name}</h1>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
              <strong style={{ fontSize: 24, fontFamily: "var(--font-display)" }}>{fmt.money(p.price)}</strong>
              {apparel && <span className="muted" style={{ fontSize: 13 }}>{pt.groupFrom}</span>}
            </div>
            <p className="muted" style={{ fontSize: 15 }}>{p.desc[lang]}</p>
          </div>

          <fieldset className="stack" style={{ gap: 10 }}>
            <legend className="legend-plain">{pt.colorLabel} <span style={{ fontWeight: 400 }}>{fmt.color(color)}</span></legend>
            <div style={{ display: "flex", gap: 12 }}>
              {p.colors.map((c) => (
                <button key={c} type="button" className="swatch swatch-lg" aria-label={COLORS[c].name[lang]} aria-pressed={color === c} onClick={() => { setColor(c); setAdded(false); }} style={{ background: COLORS[c].hex }} />
              ))}
            </div>
          </fieldset>

          {!oneSize && (
            <fieldset>
              <div className="between" style={{ marginBottom: 10 }}>
                <legend className="legend-plain" style={{ float: "left", margin: 0 }}>{pt.sizeLabel} <span style={{ fontWeight: 400 }}>{size ?? pt.selectSize}</span></legend>
                <a href="#size-guide" style={{ fontSize: 13, fontWeight: 600, minHeight: 44, display: "inline-flex", alignItems: "center" }}>{pt.sizeGuide}</a>
              </div>
              <div className="pdp-sizes" style={{ clear: "both" }}>
                {p.sizes.map((s) => (
                  <button key={s} type="button" className="size-btn" aria-pressed={size === s} disabled={soldOut.includes(s)} onClick={() => { setSize(s); setNeedSize(false); setAdded(false); }}>{s}</button>
                ))}
              </div>
              {needSize && <p role="alert" style={{ marginTop: 8, fontSize: 13, color: "var(--danger-fg)" }}>{pt.pickSize}</p>}
              {soldOut.length > 0 && (
                <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                  {pt.soldOut(soldOut.join(", "))}{" "}
                  {notified ? pt.notified : <><button type="button" className="textbtn" style={{ minHeight: 0 }} onClick={() => setNotified(true)}>{pt.notify}</button>{pt.notifyRest}</>}
                </p>
              )}
            </fieldset>
          )}

          <div className="row">
            <QtyStepper value={qty} onChange={(n) => { setQty(n); setAdded(false); }} max={20} label={t.common.quantity} />
            <button className="btn btn-primary" type="button" onClick={add} style={{ flex: "1 1 200px" }}>{pt.addTo(fmt.money(p.price * qty))}</button>
            <button className="btn btn-outline" type="button" onClick={() => toggleWish(p.slug)} aria-pressed={wish} aria-label={t.common.saveWishlist} style={{ padding: "0 14px", color: wish ? "var(--brand-red)" : undefined }}>
              <Icon name="heart" fill={wish ? "currentColor" : "none"} />
            </button>
          </div>
          {added && (
            <div role="status" className="between" style={{ padding: "12px 16px", borderRadius: 12, background: "var(--success-bg)" }}>
              <span style={{ display: "flex", gap: 8, alignItems: "center", fontWeight: 600 }}>
                <Icon name="check" style={{ color: "var(--success-fg)" }} />{t.common.added(qty, `${fmt.color(color)}${oneSize ? "" : " / " + size}`)}
              </span>
              <Link href="/cart" style={{ fontWeight: 600 }}>{t.common.viewCart}</Link>
            </div>
          )}

          <fieldset className="stack" style={{ gap: 10 }}>
            <legend className="legend-plain">{pt.how}</legend>
            {(["ship", "pickup"] as const).map((id) => (
              <label key={id} className="option" data-on={delivery === id}>
                <input type="radio" name="delivery" checked={delivery === id} onChange={() => setDelivery(id)} />
                <span className="stack"><strong>{pt[id][0]}</strong><span className="muted" style={{ fontSize: 13 }}>{pt[id][1]}</span></span>
              </label>
            ))}
          </fieldset>

          <div className="tint">
            <Icon name="cap" />
            <span>{pt.proceeds} <Link href="/impact">{t.common.seeImpact}</Link></span>
          </div>

          <div style={{ borderTop: "1px solid var(--border)" }}>
            {panels.map(([id, title, body]) => (
              <div key={id} className="acc-item">
                <button type="button" className="acc-btn" aria-expanded={open === id} onClick={() => setOpen(open === id ? null : id)}>
                  {title}<span aria-hidden="true">{open === id ? "−" : "+"}</span>
                </button>
                {open === id && <p className="muted" style={{ paddingBottom: 16 }}>{body}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {!oneSize && (
        <section id="size-guide" className="card" style={{ marginTop: 16, padding: 28, display: "flex", flexDirection: "column", gap: 16, scrollMarginTop: 140 }}>
          <div className="between" style={{ alignItems: "end" }}>
            <h2 style={{ fontSize: 24 }}>{pt.sizeGuide}</h2>
            <span className="muted" style={{ fontSize: 13 }}>{pt.guideNote}</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th scope="col">{t.common.size}</th>{p.sizes.map((s) => <th key={s} scope="col">{s}</th>)}</tr></thead>
              <tbody>
                <tr><th scope="row">{pt.chest}</th>{p.sizes.map((s) => <td key={s}>{GUIDE[s]?.[0]}</td>)}</tr>
                <tr><th scope="row">{pt.length}</th>{p.sizes.map((s) => <td key={s}>{GUIDE[s]?.[1]}</td>)}</tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="stack" style={{ paddingTop: 32, gap: 20 }}>
        <h2 style={{ fontSize: 24 }}>{pt.complete}</h2>
        <div className="pgrid">
          {related.map((r) => <ProductCard key={r.slug} p={r} variant="simple" />)}
        </div>
      </section>

      <div className="inverse between" style={{ padding: 28, gap: 16 }}>
        <div><h2 style={{ fontSize: 20 }}>{pt.chapterTitle}</h2><p style={{ marginTop: 4, color: "var(--inverse-muted)" }}>{pt.chapterSub}</p></div>
        <Link className="btn btn-primary" href="/group-order">{t.common.startGroup}</Link>
      </div>
    </div>
  );
}
