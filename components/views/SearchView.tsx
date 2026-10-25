"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PRODUCTS } from "@/lib/catalog";
import { Icon } from "../Icon";
import { ProductCard } from "../ProductCard";
import { usePrefs } from "../providers";

const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function SearchView() {
  const { t } = usePrefs();
  const s = t.search;
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(params.get("q") ?? "");

  const setQuery = (v: string) => {
    setQ(v);
    router.replace(v ? `/search?q=${encodeURIComponent(v)}` : "/search", { scroll: false });
  };

  const n = strip(q.trim());
  const terms = n.split(/\s+/).filter(Boolean);
  const results = n ? PRODUCTS.filter((p) => { const hay = strip(`${p.name.en} ${p.name.es} ${p.tags}`); return terms.every((w) => hay.includes(w)); }) : [];
  const hrefs = ["/shop", "/custom", "/group-order"];

  return (
    <div className="wrap page" style={{ paddingTop: 48, paddingBottom: 80, gap: 32 }}>
      <div role="search" style={{ position: "relative" }}>
        <label htmlFor="q" className="sr-only">{s.label}</label>
        <Icon name="search" size={24} style={{ position: "absolute", left: 20, top: 20, color: "var(--muted-fg)" }} />
        <input id="q" className="input" type="search" value={q} onChange={(e) => setQuery(e.target.value)} placeholder={s.placeholder} autoComplete="off" autoFocus
          style={{ minHeight: 64, fontSize: 18, paddingLeft: 56, paddingRight: 64, borderRadius: 16.8 }} />
        {q && (
          <button type="button" className="icon-btn" aria-label={s.clear} onClick={() => setQuery("")} style={{ position: "absolute", right: 10, top: 10, background: "var(--muted)" }}>
            <Icon name="x" />
          </button>
        )}
      </div>

      {!n ? (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 32 }}>
            {([[s.recent, s.recentTerms], [s.popular, s.popularTerms]] as const).map(([title, list]) => (
              <div key={title} className="stack" style={{ flex: "1 1 300px", gap: 12 }}>
                <h2 style={{ fontSize: 16 }}>{title}</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {list.map((term) => <button key={term} className="chip" type="button" onClick={() => setQuery(term)}>{term}</button>)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
            {s.links.map(([title, sub], i) => (
              <Link key={title} className="card plink" href={hrefs[i]} style={{ padding: 20, display: "flex", flexDirection: "column", gap: 4 }}>
                <strong style={{ fontFamily: "var(--font-display)" }}>{title}</strong>
                <span className="muted" style={{ fontSize: 13 }}>{sub}</span>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="stack" style={{ gap: 20 }}>
          <p aria-live="polite" className="muted">{s.results(results.length, q.trim())}</p>
          {results.length > 0 ? (
            <div className="pgrid">{results.map((p) => <ProductCard key={p.slug} p={p} variant="simple" />)}</div>
          ) : (
            <div className="card" style={{ padding: 40, display: "flex", flexDirection: "column", gap: 12, alignItems: "center", textAlign: "center" }}>
              <h2 style={{ fontSize: 20 }}>{s.noResults(q.trim())}</h2>
              <p className="muted" style={{ maxWidth: 440 }}>{s.noResultsSub}</p>
              <Link className="btn btn-primary" href="/custom">{t.common.designOwn}</Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
