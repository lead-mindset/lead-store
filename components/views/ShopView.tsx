"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { APPAREL_SIZES, COLORS, COLOR_IDS, PRODUCTS, type Category, type ColorId, type Collection } from "@/lib/catalog";
import { Icon } from "../Icon";
import { ProductCard } from "../ProductCard";
import { usePrefs } from "../providers";

type Sort = "featured" | "low" | "high" | "new";
type PriceBand = "under15" | "p15to20" | "over20";
const CATS: ("all" | Category)[] = ["all", "tees", "hoodies", "hats", "bags", "acc"];
const COLLECTIONS: Collection[] = ["core", "chapter", "event", "limited"];
const BANDS: PriceBand[] = ["under15", "p15to20", "over20"];
const inBand = (price: number, b: PriceBand) => (b === "under15" ? price < 15 : b === "p15to20" ? price >= 15 && price <= 20 : price >= 20);

export function ShopView() {
  const { t, lang } = usePrefs();
  const s = t.shop;
  const params = useSearchParams();
  const initialCat = params.get("cat");
  const initialCol = params.get("col") as Collection | null;

  const [cat, setCat] = useState<"all" | Category>(CATS.includes(initialCat as Category) ? (initialCat as Category) : "all");
  const [sort, setSort] = useState<Sort>("featured");
  const [q, setQ] = useState("");
  const [sizes, setSizes] = useState<string[]>([]);
  const [color, setColor] = useState<ColorId | null>(null);
  const [bands, setBands] = useState<PriceBand[]>([]);
  const [cols, setCols] = useState<Collection[]>(initialCol && COLLECTIONS.includes(initialCol) ? [initialCol] : []);
  const [pickupOnly, setPickupOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const clear = () => { setCat("all"); setSizes([]); setColor(null); setBands([]); setCols([]); setQ(""); setPickupOnly(false); };

  const products = useMemo(() => {
    const n = q.trim().toLowerCase();
    let list = PRODUCTS.filter((p) => cat === "all" || p.cat === cat)
      .filter((p) => !color || p.colors.includes(color))
      .filter((p) => sizes.length === 0 || sizes.some((sz) => p.sizes.includes(sz) && !p.soldOut?.includes(sz)))
      .filter((p) => bands.length === 0 || bands.some((b) => inBand(p.price, b)))
      .filter((p) => cols.length === 0 || cols.includes(p.collection))
      .filter((p) => !n || `${p.name.en} ${p.name.es} ${p.tags}`.toLowerCase().includes(n));
    if (sort === "low") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "new") list = [...list].sort((a, b) => b.order - a.order);
    return list;
  }, [cat, color, sizes, bands, cols, q, sort]);

  return (
    <div className="wrap page">
      <nav aria-label={t.common.breadcrumb} className="muted" style={{ fontSize: 13, display: "flex", gap: 6 }}>
        <Link href="/" style={{ color: "inherit" }}>{t.common.home}</Link><span aria-hidden="true">/</span><span>{t.nav.shop}</span>
      </nav>
      <div className="between" style={{ alignItems: "end", gap: 16 }}>
        <div><h1 className="h1">{s.title}</h1><p className="muted" style={{ marginTop: 4 }} aria-live="polite">{s.count(products.length)}</p></div>
        <div className="row" style={{ alignItems: "end" }}>
          <div style={{ position: "relative", width: 280, maxWidth: "100%" }}>
            <label htmlFor="shop-q" className="sr-only">{s.search}</label>
            <input id="shop-q" className="input" type="search" placeholder={s.search} value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 40 }} />
            <Icon name="search" style={{ position: "absolute", left: 12, top: 12, color: "var(--muted-fg)" }} />
          </div>
          <div>
            <label className="label" htmlFor="sort">{s.sortBy}</label>
            <select id="sort" className="input" style={{ width: 200 }} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              {(Object.keys(s.sort) as Sort[]).map((k) => <option key={k} value={k}>{s.sort[k]}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div role="group" aria-label={s.category} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {CATS.map((c) => (
          <button key={c} className="chip" type="button" aria-pressed={cat === c} onClick={() => setCat(c)}>{s.cats[c]}</button>
        ))}
        <button className="chip filter-toggle" type="button" aria-expanded={showFilters} aria-controls="filters" onClick={() => setShowFilters(!showFilters)}>
          <Icon name="sliders" size={16} />{showFilters ? s.hideFilters : s.showFilters}
        </button>
      </div>

      <div className="shop-layout">
        <aside id="filters" aria-label={s.filters} className="filters" data-open={showFilters}>
          <div className="between">
            <strong style={{ fontFamily: "var(--font-display)", fontSize: 18, display: "flex", gap: 8, alignItems: "center" }}><Icon name="sliders" />{s.filters}</strong>
            <button type="button" className="textbtn" onClick={clear}>{s.clearAll}</button>
          </div>
          <fieldset>
            <legend className="legend">{s.size}</legend>
            <div className="size-grid">
              {APPAREL_SIZES.map((sz) => (
                <button key={sz} className="chip" type="button" style={{ padding: 0 }} aria-pressed={sizes.includes(sz)} onClick={() => setSizes(toggle(sizes, sz))}>{sz}</button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="legend">{s.color}</legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {COLOR_IDS.map((c) => (
                <button key={c} type="button" className="swatch" aria-label={COLORS[c].name[lang]} title={COLORS[c].name[lang]} aria-pressed={color === c} onClick={() => setColor(color === c ? null : c)} style={{ background: COLORS[c].hex }} />
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="legend">{s.price}</legend>
            {BANDS.map((b) => (
              <label key={b} className="check"><input type="checkbox" checked={bands.includes(b)} onChange={() => setBands(toggle(bands, b))} />{s[b]}</label>
            ))}
          </fieldset>
          <fieldset>
            <legend className="legend">{s.delivery}</legend>
            <label className="check"><input type="checkbox" checked readOnly />{s.ships}</label>
            {/* Every product supports local pickup today, so this filter never hides items. */}
            <label className="check"><input type="checkbox" checked={pickupOnly} onChange={() => setPickupOnly(!pickupOnly)} />{s.pickup}</label>
          </fieldset>
          <fieldset>
            <legend className="legend">{s.collection}</legend>
            {COLLECTIONS.map((c) => (
              <label key={c} className="check"><input type="checkbox" checked={cols.includes(c)} onChange={() => setCols(toggle(cols, c))} />{s.col[c]}</label>
            ))}
          </fieldset>
        </aside>

        <div className="shop-main">
          {products.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: "center", display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
              <h2 style={{ fontSize: 20 }}>{s.emptyTitle}</h2>
              <p className="muted">{s.emptySub}</p>
              <button className="btn btn-outline" type="button" onClick={clear}>{s.clear}</button>
            </div>
          ) : (
            <div className="pgrid">
              {products.map((p) => <ProductCard key={p.slug} p={p} />)}
            </div>
          )}
          <div className="card between" style={{ padding: 24, gap: 16 }}>
            <div><h2 style={{ fontSize: 18 }}>{s.ctaTitle}</h2><p className="muted" style={{ marginTop: 4 }}>{s.ctaSub}</p></div>
            <div className="row" style={{ gap: 10 }}>
              <Link className="btn btn-primary" href="/custom">{t.common.designOwn}</Link>
              <Link className="btn btn-outline" href="/group-order">{s.groupOrder}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
