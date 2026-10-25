"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { APPAREL_SIZES, CHAPTERS, COLORS, getProduct, ONE_SIZE, type Lang } from "@/lib/catalog";
import { storeConfig } from "@/lib/config";
import type { Profile } from "@/lib/types";
import { ProductArt } from "../ProductArt";
import { ProductCard } from "../ProductCard";
import { LineArt } from "./CartView";
import { useFormat, usePrefs, useStore } from "../providers";

type Tab = "orders" | "designs" | "groups" | "wishlist" | "addresses" | "profile";
const TABS: Tab[] = ["orders", "designs", "groups", "wishlist", "addresses", "profile"];

export function AccountView() {
  const { t, lang, setLang } = usePrefs();
  const a = t.account;
  const fmt = useFormat();
  const router = useRouter();
  const { state, update, ready, reset, notify, addLine } = useStore();
  const [tab, setTab] = useState<Tab>("orders");
  const [draft, setDraft] = useState<Profile | null>(null);
  const [addr, setAddr] = useState<string | null>(null);

  const p = state.profile;
  const form = draft ?? p;
  const fullName = [p.first, p.last].filter(Boolean).join(" ");
  const initials = (p.first[0] ?? "") + (p.last[0] ?? "");

  const clearData = () => {
    if (window.confirm(a.signOut + "?")) { reset(); notify(a.cleared); }
  };

  const buyAgain = (id: string) => {
    const o = state.orders.find((x) => x.id === id);
    o?.lines.forEach((l) => addLine(l));
    router.push("/cart");
  };

  const viewOrder = (id: string) => { update((s) => ({ ...s, lastOrder: id })); router.push("/confirmation"); };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (draft) update((s) => ({ ...s, profile: draft }));
    setDraft(null);
    notify(a.savedMsg);
  };

  const field = (k: keyof Profile, label: string, type = "text") => (
    <div>
      <label className="label" htmlFor={`p-${k}`}>{label}</label>
      <input id={`p-${k}`} className="input" type={type} value={String(form[k] ?? "")} onChange={(e) => setDraft({ ...form, [k]: e.target.value })} />
    </div>
  );

  const empty = (title: string, sub?: string, cta?: React.ReactNode) => (
    <div className="card" style={{ padding: 40, textAlign: "center", display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
      <strong style={{ fontFamily: "var(--font-display)", fontSize: 18 }}>{title}</strong>
      {sub && <p className="muted">{sub}</p>}
      {cta}
    </div>
  );

  return (
    <div className="wrap page" style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start" }}>
      <aside style={{ flex: "1 1 240px", maxWidth: 300, display: "flex", flexDirection: "column", gap: 16 }} className="acct-side">
        <div className="card" style={{ padding: 20, display: "flex", gap: 12, alignItems: "center" }}>
          <span className="avatar" aria-hidden="true">{ready && initials ? initials.toUpperCase() : "L"}</span>
          <div style={{ minWidth: 0 }}>
            <strong style={{ display: "block" }}>{ready && fullName ? fullName : a.guest}</strong>
            <span className="muted" style={{ fontSize: 13 }}>{ready && p.chapter ? p.chapter : a.noChapter}</span>
          </div>
        </div>
        <nav aria-label={a.nav} className="card acct-nav" style={{ padding: 8, display: "flex", flexDirection: "column", gap: 2 }}>
          {TABS.map((id) => (
            <button key={id} type="button" aria-current={tab === id ? "page" : undefined} onClick={() => setTab(id)}>{a.tabs[id]}</button>
          ))}
          <button type="button" onClick={clearData} style={{ color: "var(--danger-fg)" }}>{a.signOut}</button>
        </nav>
        <p className="muted" style={{ fontSize: 12 }}>{a.localNote}</p>
      </aside>

      <section style={{ flex: "999 1 560px", minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
        <h1 className="h1">{a.tabs[tab]}</h1>
        {!ready ? null : tab === "orders" ? (
          state.orders.length === 0 ? empty(a.noOrders, a.noOrdersSub, <Link className="btn btn-primary" href="/shop">{t.common.shopNow}</Link>) : (
            <div className="stack" style={{ gap: 14 }}>
              {state.orders.map((o) => (
                <article key={o.id} className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                  <div className="between" style={{ gap: 10 }}>
                    <div>
                      <strong style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>{a.order(o.num)}</strong>
                      <span className="muted" style={{ fontSize: 13, marginLeft: 10 }}>{fmt.date(o.date)} · {o.method === "ship" ? t.checkout.ship : t.checkout.pickup} · {fmt.money(o.total)}</span>
                    </div>
                    <span className="badge badge-soft">{o.lines.some((l) => l.custom) ? a.st.prod : a.st.placed}</span>
                  </div>
                  <div className="row" style={{ gap: 14 }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {o.lines.slice(0, 4).map((l) => <LineArt key={l.id} l={l} size={64} />)}
                    </div>
                    <span className="muted" style={{ flex: "1 1 160px", fontSize: 13 }}>
                      {o.lines.map((l) => `${fmt.lineName(l)} × ${l.qty}`).join(", ")}
                    </span>
                    <div className="row" style={{ gap: 8 }}>
                      <button type="button" className="btn btn-outline" style={{ minHeight: 40 }} onClick={() => viewOrder(o.id)}>{a.view}</button>
                      <button type="button" className="btn btn-outline" style={{ minHeight: 40 }} onClick={() => buyAgain(o.id)}>{a.again}</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : tab === "designs" ? (
          <div className="pgrid">
            {state.designs.map((d) => (
              <div key={d.id} className="card" style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                <span className="tile" style={{ aspectRatio: 1, borderRadius: 12 }}>
                  <ProductArt kind={d.kind} fill={COLORS[d.color].hex} print="custom" text={d.text} image={d.image} mark={d.mark} decorative />
                </span>
                <div>
                  <strong style={{ display: "block" }}>{d.text || t.custom.tpl.classic}</strong>
                  <span className="muted" style={{ fontSize: 12 }}>{fmt.color(d.color)} · {t.kindShort[d.kind]} · {fmt.date(d.updatedAt)}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Link className="btn btn-outline" href={`/custom?design=${d.id}`} style={{ flex: 1, minHeight: 40, padding: "0 10px" }}>{a.edit}</Link>
                  <button type="button" className="btn btn-outline" style={{ minHeight: 40, padding: "0 10px" }} onClick={() => update((s) => ({ ...s, designs: s.designs.filter((x) => x.id !== d.id) }))}>{a.deleteDesign}</button>
                </div>
              </div>
            ))}
            <Link href="/custom" className="dashed" style={{ minHeight: 240 }}>{a.newDesign}</Link>
          </div>
        ) : tab === "groups" ? (
          <>
            {state.group ? (
              <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
                <div className="between" style={{ gap: 10 }}>
                  <strong style={{ fontFamily: "var(--font-display)", fontSize: 16 }}>{a.groupTitle(state.group.name || t.group.defaultName)}</strong>
                  <span className="badge badge-success">{t.group.collecting("")}</span>
                </div>
                {(() => {
                  const n = state.group.members.filter((m) => m.status !== "waiting").length;
                  return (
                    <>
                      <div className="progress"><div style={{ width: `${Math.min(100, (n / storeConfig.groupGoal) * 100)}%` }} /></div>
                      <span className="muted" style={{ fontSize: 13 }}>{a.responded(n, storeConfig.groupGoal)}{state.group.deadline ? ` · ${fmt.date(state.group.deadline)}` : ""}</span>
                    </>
                  );
                })()}
                <div><Link className="btn btn-primary" href="/group-order">{a.manage}</Link></div>
              </div>
            ) : empty(a.noGroup)}
            <Link className="btn btn-outline" href="/group-order" style={{ alignSelf: "flex-start" }}>{a.newGroup}</Link>
          </>
        ) : tab === "wishlist" ? (
          state.wishlist.length === 0 ? empty(a.noWish, a.noWishSub, <Link className="btn btn-primary" href="/shop">{t.common.shopNow}</Link>) : (
            <div className="pgrid">
              {state.wishlist.map((slug) => getProduct(slug)).filter((x) => !!x).map((x) => <ProductCard key={x.slug} p={x} variant="shop" />)}
            </div>
          )
        ) : tab === "addresses" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
            {p.address && addr === null ? (
              <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 6 }}>
                <span className="badge badge-soft" style={{ alignSelf: "flex-start" }}>{a.defaultAddr}</span>
                <strong>{a.home}</strong>
                <span className="muted" style={{ whiteSpace: "pre-line" }}>{p.address}</span>
                <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                  <button type="button" className="textbtn" onClick={() => setAddr(p.address)}>{a.edit}</button>
                  <button type="button" className="textbtn" onClick={() => update((s) => ({ ...s, profile: { ...s.profile, address: "" } }))}>{a.removeAddr}</button>
                </div>
              </div>
            ) : addr !== null ? (
              <form className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }} onSubmit={(e) => { e.preventDefault(); update((s) => ({ ...s, profile: { ...s.profile, address: addr.trim() } })); setAddr(null); }}>
                <label className="label" htmlFor="addr">{a.home}</label>
                <textarea id="addr" className="input" rows={3} placeholder={a.addrPh} value={addr} onChange={(e) => setAddr(e.target.value)} />
                <button className="btn btn-primary" type="submit">{a.saveAddr}</button>
              </form>
            ) : (
              <button type="button" className="dashed" onClick={() => setAddr("")}>{a.addAddress}</button>
            )}
            <div className="card" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 6 }}>
              <label className="label" htmlFor="pickup-pref" style={{ fontWeight: 700, fontSize: 14 }}>{a.pickupPref}</label>
              <select id="pickup-pref" className="input" value={p.pickup} onChange={(e) => update((s) => ({ ...s, profile: { ...s.profile, pickup: Number(e.target.value) } }))}>
                {a.pickupOpts.map((o, i) => <option key={o} value={i}>{o}</option>)}
              </select>
            </div>
          </div>
        ) : (
          <form className="card grid2" style={{ padding: 24, gap: 16 }} onSubmit={saveProfile}>
            {field("first", a.first)}
            {field("last", a.last)}
            {field("email", a.email, "email")}
            <div>
              <label className="label" htmlFor="p-chapter">{a.chapter}</label>
              <select id="p-chapter" className="input" value={form.chapter} onChange={(e) => setDraft({ ...form, chapter: e.target.value })}>
                <option value="">{t.checkout.selectChapter}</option>
                {CHAPTERS.map((ch) => <option key={ch.id} value={ch.name}>{ch.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="p-lang">{a.language}</label>
              <select id="p-lang" className="input" value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="p-size">{a.usualSize}</label>
              <select id="p-size" className="input" value={form.size} onChange={(e) => setDraft({ ...form, size: e.target.value })}>
                {[...APPAREL_SIZES, ONE_SIZE].slice(0, 7).map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="full"><button className="btn btn-primary" type="submit">{a.save}</button></div>
          </form>
        )}
      </section>
    </div>
  );
}
