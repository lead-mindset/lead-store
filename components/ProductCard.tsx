"use client";

import Link from "next/link";
import { COLORS, ONE_SIZE, type Product } from "@/lib/catalog";
import { Icon } from "./Icon";
import { ProductArt } from "./ProductArt";
import { useFormat, usePrefs, useStore } from "./providers";

export function ProductCard({ p, variant = "shop" }: { p: Product; variant?: "home" | "shop" | "simple" }) {
  const { t, lang } = usePrefs();
  const { state, toggleWish, addLine, notify, ready } = useStore();
  const fmt = useFormat();
  const href = `/product/${p.slug}`;
  const saved = ready && state.wishlist.includes(p.slug);
  const oneSize = p.sizes.length === 1 && p.sizes[0] === ONE_SIZE;
  const name = p.name[lang];

  const quickAdd = () => {
    addLine({ slug: p.slug, kind: p.kind, color: p.colors[0], size: ONE_SIZE, qty: 1, unitPrice: p.price, print: p.print });
    notify(t.common.added(1, name), "/cart", t.common.viewCart);
  };

  return (
    <div className="pcard">
      <div className="tile">
        <Link href={href} aria-label={name} style={{ display: "block", width: "100%", height: "100%" }}>
          <ProductArt kind={p.kind} fill={COLORS[p.colors[0]].hex} print={p.print} decorative />
        </Link>
        {p.tag && variant !== "simple" && (
          <span className={`badge ${p.tag === "new" ? "badge-new" : "badge-hot"}`} style={{ position: "absolute", top: 12, left: 12 }}>
            {p.tag === "new" ? t.common.new : t.common.popular}
          </span>
        )}
        {variant === "home" && (
          <button className="heart" type="button" aria-label={t.common.saveWishlist} aria-pressed={saved} onClick={() => toggleWish(p.slug)}>
            <Icon name="heart" fill={saved ? "currentColor" : "none"} />
          </button>
        )}
      </div>
      <Link className="plink" href={href} style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
        <strong style={{ fontSize: 15 }}>{name}</strong>
        <span style={{ fontSize: 15, whiteSpace: "nowrap" }}>{fmt.money(p.price)}</span>
      </Link>
      {variant === "shop" && <span className="muted" style={{ fontSize: 13, marginTop: -6 }}>{p.sub[lang]}</span>}
      {variant !== "simple" && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", gap: 6 }} aria-label={t.common.colors} role="list">
            {p.colors.map((c) => (
              <span key={c} role="listitem" title={COLORS[c].name[lang]} aria-label={COLORS[c].name[lang]} className="dot" style={{ background: COLORS[c].hex }} />
            ))}
          </div>
          {variant === "shop" &&
            (oneSize ? (
              <button type="button" className="btn btn-outline btn-sm" onClick={quickAdd}>{t.common.quickAdd}</button>
            ) : (
              <Link className="btn btn-outline btn-sm" href={href}>{t.common.chooseSize}</Link>
            ))}
        </div>
      )}
    </div>
  );
}

export function QtyStepper({ value, onChange, min = 1, max = 99, label, small }: { value: number; onChange: (n: number) => void; min?: number; max?: number; label: string; small?: boolean }) {
  const { t } = usePrefs();
  return (
    <div role="group" aria-label={label} className={`qty${small ? " qty-sm" : ""}`}>
      <button type="button" aria-label={t.common.decrease} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>−</button>
      <span aria-live="polite">{value}</span>
      <button type="button" aria-label={t.common.increase} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>+</button>
    </div>
  );
}
