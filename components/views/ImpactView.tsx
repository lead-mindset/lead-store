"use client";

import Link from "next/link";
import { useState } from "react";
import { CHAPTERS } from "@/lib/catalog";
import { storeConfig as cfg } from "@/lib/config";
import { Icon } from "../Icon";
import { usePrefs } from "../providers";

type Region = "all" | "us" | "latam";

export function ImpactView() {
  const { t, lang } = usePrefs();
  const m = t.impact;
  const [region, setRegion] = useState<Region>("all");
  const stats = [cfg.impact.students, cfg.impact.events, cfg.impact.chapters, cfg.impact.raised];
  const chapters = CHAPTERS.filter((c) => region === "all" || c.region === region);

  return (
    <>
      <section className="impact-hero">
        <div className="wrap" style={{ paddingTop: 72, paddingBottom: 88, display: "flex", flexDirection: "column", gap: 20, maxWidth: 900, textAlign: "center", alignItems: "center" }}>
          <span className="overline" style={{ color: "oklch(0.78 0.12 287)" }}>{m.over}</span>
          <h1 style={{ color: "#fff", fontSize: "clamp(30px, 4.5vw, 48px)", fontWeight: 800, lineHeight: 1.1 }}>{m.title}</h1>
          <p style={{ fontSize: 18, color: "oklch(0.88 0.03 272)", maxWidth: 680 }}>{m.lead}</p>
          <span style={{ fontSize: 13, letterSpacing: ".1em", color: "oklch(0.85 0.03 272)" }}>{t.footer.tagline}</span>
        </div>
      </section>

      <section className="wrap" style={{ marginTop: -36 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          {stats.map((v, i) => (
            <div key={i} className="card" style={{ padding: 24 }}>
              <strong style={{ display: "block", fontFamily: "var(--font-display)", fontSize: 36 }}>{v}</strong>
              <span className="muted">{m.stats[i]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap section" style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 40 }}>
        <div className="stack" style={{ flex: "1 1 380px", gap: 16 }}>
          <h2 className="h2">{m.whereTitle}</h2>
          <p className="muted" style={{ fontSize: 16 }}>{m.whereSub}</p>
        </div>
        <div className="card" style={{ flex: "1 1 460px", padding: 28, display: "flex", flexDirection: "column", gap: 16 }}>
          {cfg.uses.map((u) => (
            <div key={u.id} className="stack" style={{ gap: 6 }}>
              <div className="between"><strong>{m.uses[u.id]}</strong><span>{u.share}%</span></div>
              <div className="progress"><div style={{ width: `${u.share}%` }} /></div>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap section">
        <h2 className="h2">{m.fundsTitle}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {m.funds.map(([over, title, body]) => (
            <article key={title} className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 10 }}>
              <span className="overline" style={{ color: "var(--link)" }}>{over}</span>
              <h3 style={{ fontSize: 18 }}>{title}</h3>
              <p className="muted">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="wrap section">
        <div className="between" style={{ alignItems: "end" }}>
          <h2 className="h2">{m.chaptersTitle}</h2>
          <div role="group" aria-label={m.region} className="seg seg-inline">
            {(["all", "us", "latam"] as Region[]).map((r) => (
              <button key={r} type="button" aria-pressed={region === r} onClick={() => setRegion(r)} style={{ minHeight: 40 }}>{m.regions[r]}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {chapters.map((c) => (
            <div key={c.id} className="card" style={{ padding: 20, display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ width: 44, height: 44, borderRadius: 12, background: "var(--tint)", color: "var(--link)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <Icon name="pin" />
              </span>
              <div><strong style={{ display: "block" }}>{c.name}</strong><span className="muted" style={{ fontSize: 13 }}>{c.place[lang]}</span></div>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap section" style={{ paddingBottom: 72 }}>
        <div className="inverse between" style={{ borderRadius: 21.6, padding: 40, gap: 20 }}>
          <div style={{ flex: "1 1 360px" }}>
            <h2 style={{ fontSize: 26 }}>{m.ctaTitle}</h2>
            <p style={{ marginTop: 6, color: "var(--inverse-muted)" }}>{m.ctaSub}</p>
          </div>
          <div className="row" style={{ gap: 10 }}>
            <Link className="btn btn-primary" href="/shop">{t.common.shopNow}</Link>
            <Link className="btn btn-light" href="/group-order">{m.ctaGroup}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
