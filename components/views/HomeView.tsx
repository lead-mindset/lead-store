"use client";

import { getImageProps } from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PRODUCTS, type Kind } from "@/lib/catalog";
import { storeConfig } from "@/lib/config";
import { Icon } from "../Icon";
import { ProductArt } from "../ProductArt";
import { ProductCard } from "../ProductCard";
import { usePrefs, useStore } from "../providers";

const CATS: { id: "tees" | "hoodies" | "hats" | "acc"; kind: Kind; fill: string; href: string }[] = [
  { id: "tees", kind: "tee", fill: "#1e2a4a", href: "/shop?cat=tees" },
  { id: "hoodies", kind: "hoodie", fill: "#16161a", href: "/shop?cat=hoodies" },
  { id: "hats", kind: "cap", fill: "#1e2a4a", href: "/shop?cat=hats" },
  { id: "acc", kind: "bottle", fill: "#f8f8fa", href: "/shop?cat=acc" },
];

const PERK_ICONS = ["shirt", "users", "truck", "palette"];

// Hero photo: wide shot on desktop, portrait shot (shirt at the bottom) below 1024px.
const heroCommon = { alt: "", sizes: "100vw", fetchPriority: "high" as const };
const { props: { srcSet: heroDesktop } } = getImageProps({ ...heroCommon, src: "/media/hero/hero-desktop.webp", width: 2134, height: 737 });
const { props: heroImg } = getImageProps({ ...heroCommon, src: "/media/hero/hero-mobile.webp", width: 1122, height: 1402 });

export function HomeView() {
  const { t } = usePrefs();
  const h = t.home;
  const { notify } = useStore();
  const [email, setEmail] = useState("");
  const [err, setErr] = useState(false);
  const [done, setDone] = useState(false);

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr(true);
    setErr(false);
    setDone(true);
    notify(h.subscribed);
  };

  return (
    <>
      <section className="hero">
        <picture className="hero-photo">
          <source media="(min-width: 1024px)" srcSet={heroDesktop} />
          <img {...heroImg} alt="" />
        </picture>
        <div className="wrap hero-inner">
          <div className="hero-copy">
            <span className="overline" style={{ color: "oklch(0.78 0.12 287)" }}>{h.overline}</span>
            <h1>{h.title1}<br />{h.title2}</h1>
            <p className="hero-lead">{h.lead}</p>
            <div className="row">
              <Link className="btn btn-primary" href="/shop">{t.common.shopNow} <Icon name="arrow" /></Link>
              <Link className="btn btn-light" href="/custom">{t.common.designOwn}</Link>
            </div>
            <span style={{ fontSize: 13, color: "oklch(0.85 0.03 272)" }}>{h.pillars}</span>
          </div>
        </div>
      </section>

      <section className="perks">
        <div className="wrap perks-inner">
          {h.perks.map(([title, sub], i) => (
            <div key={title} className="perk">
              <span className="perk-icon"><Icon name={PERK_ICONS[i]} /></span>
              <div><strong>{title}</strong><span className="muted">{sub}</span></div>
            </div>
          ))}
        </div>
      </section>

      <section className="wrap section">
        <div><h2 className="h2">{h.catTitle}</h2><p className="muted section-sub">{h.catSub}</p></div>
        <div className="cat-grid">
          {CATS.map((c) => (
            <Link key={c.id} className="card plink cat-card" href={c.href}>
              <span className="cat-art"><ProductArt kind={c.kind} fill={c.fill} print="logo" decorative /></span>
              <span className="stack" style={{ gap: 2 }}>
                <strong style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>{h.cats[c.id][0]}</strong>
                <span className="muted" style={{ fontSize: 13 }}>{h.cats[c.id][1]}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="wrap section">
        <div className="between" style={{ alignItems: "end" }}>
          <div><h2 className="h2">{h.featured}</h2><p className="muted section-sub">{h.featuredSub}</p></div>
          <Link href="/shop" style={{ fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, minHeight: 44, textDecoration: "none" }}>
            {h.viewAll} <Icon name="arrow" />
          </Link>
        </div>
        <div className="pgrid">
          {PRODUCTS.slice(0, 6).map((p) => <ProductCard key={p.slug} p={p} variant="home" />)}
        </div>
      </section>

      <section className="wrap section">
        <div className="promo">
          <div className="stack" style={{ flex: "1 1 420px", gap: 20, minWidth: 0 }}>
            <h2 className="h2">{h.customTitle}</h2>
            <p className="muted" style={{ fontSize: 16, maxWidth: 480 }}>{h.customSub}</p>
            <ol className="steps3">
              {h.customSteps.map((s, i) => (
                <li key={s}><span className="step-num">{i + 1}</span><span style={{ fontSize: 13 }}>{s}</span></li>
              ))}
            </ol>
            <div className="row">
              <Link className="btn btn-primary" href="/custom">{h.startDesigning} <Icon name="arrow" /></Link>
              <Link className="btn btn-outline" href="/custom?tool=templates">{h.viewTemplates}</Link>
            </div>
          </div>
          <div className="tpl-grid">
            <Link className="card plink tpl-card" href="/custom?tpl=uni">
              <span className="tpl-art"><ProductArt kind="tee" fill="#16161a" print="custom" text="YOUR SCHOOL" decorative /></span>
              <span>{h.tplUni}</span>
            </Link>
            <Link className="card plink tpl-card" href="/custom?tpl=chapter">
              <span className="tpl-art"><ProductArt kind="tee" fill="#f8f8fa" print="custom" text="LEAD PERU" decorative /></span>
              <span>{h.tplChapter}</span>
            </Link>
            <Link className="card plink tpl-card" href="/custom?tool=upload">
              <span className="tpl-art tpl-upload"><Icon name="upload" /><span style={{ fontSize: 12 }}>{h.upload}</span></span>
              <span>{h.tplUpload}</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="wrap section">
        <div className="duo">
          <div className="card duo-card">
            <span className="overline" style={{ color: "var(--link)" }}>{h.forChapters}</span>
            <h2 style={{ fontSize: 24 }}>{h.groupTitle}</h2>
            <p className="muted" style={{ fontSize: 15 }}>{h.groupSub}</p>
            <ul className="arrow-list">
              {h.groupPoints.map((pt) => <li key={pt}><span aria-hidden="true">→</span>{pt}</li>)}
            </ul>
            <div><Link className="btn btn-primary" href="/group-order">{t.common.startGroup}</Link></div>
          </div>
          <div className="inverse duo-card">
            <span className="overline" style={{ color: "var(--inverse-accent)" }}>{h.impactOver}</span>
            <h2 style={{ fontSize: 24 }}>{h.impactTitle}</h2>
            <div className="stats3">
              {[storeConfig.impact.students, storeConfig.impact.events, storeConfig.impact.chapters].map((v, i) => (
                <div key={i}><strong>{v}</strong><span>{h.stats[i]}</span></div>
              ))}
            </div>
            <div><Link className="btn btn-light" href="/impact">{t.common.seeImpact}</Link></div>
          </div>
        </div>
      </section>

      <section className="wrap section" style={{ paddingBottom: 72 }}>
        <div className="card news">
          <div style={{ flex: "1 1 360px" }}>
            <h2 style={{ fontSize: 24 }}>{h.newsTitle}</h2>
            <p className="muted" style={{ fontSize: 15, marginTop: 6 }}>{h.newsSub}</p>
          </div>
          <form className="news-form" onSubmit={subscribe} noValidate>
            <label htmlFor="nl-email" className="sr-only">{h.email}</label>
            <input id="nl-email" className="input" type="email" placeholder="you@university.edu" value={email}
              onChange={(e) => { setEmail(e.target.value); setDone(false); }} aria-invalid={err} aria-describedby={err ? "nl-err" : undefined} style={{ flex: "1 1 220px", width: "auto" }} />
            <button className="btn btn-primary" type="submit">{done ? <><Icon name="check" />{h.subscribe}</> : h.subscribe}</button>
            {err && <p id="nl-err" className="field-error" style={{ flexBasis: "100%" }}>{h.emailInvalid}</p>}
            {done && <p role="status" style={{ flexBasis: "100%", fontSize: 13, color: "var(--success-fg)" }}>{h.subscribed}</p>}
          </form>
        </div>
      </section>
    </>
  );
}
