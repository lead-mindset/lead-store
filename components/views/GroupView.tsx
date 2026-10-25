"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { COLORS, CUSTOM_KINDS } from "@/lib/catalog";
import { storeConfig as cfg } from "@/lib/config";
import type { GroupOrder, MemberStatus } from "@/lib/types";
import { Icon } from "../Icon";
import { ProductArt } from "../ProductArt";
import { uid, useFormat, usePrefs, useStore } from "../providers";

const SIZES = ["XS", "S", "M", "L", "XL", "2XL"];
const AVATAR = ["oklch(0.56 0.21 20)", "oklch(0.487 0.2087 322.04)", "oklch(0.5584 0.2066 286.65)", "oklch(0.55 0.19 45)"];

const newGroup = (): GroupOrder => ({
  name: "", uni: "", org: "", deadline: "", del: "pickup", pay: "each", members: [], reminded: false,
  code: Math.random().toString(36).slice(2, 8).toUpperCase(),
});

export function GroupView() {
  const { t } = usePrefs();
  const g = t.group;
  const fmt = useFormat();
  const router = useRouter();
  const { state, update, ready, addLine, notify } = useStore();
  const [copied, setCopied] = useState(false);
  const [mName, setMName] = useState("");
  const [mSize, setMSize] = useState("M");
  const [mQty, setMQty] = useState(1);
  const [mPaid, setMPaid] = useState(true);
  const [err, setErr] = useState("");
  const [origin, setOrigin] = useState("");

  // eslint-disable-next-line react-hooks/set-state-in-effect -- the page origin is only known in the browser
  useEffect(() => setOrigin(window.location.origin), []);

  // The share code is random, so create the group in the browser only (keeps SSR markup stable).
  useEffect(() => {
    if (ready && !state.group) update((s) => (s.group ? s : { ...s, group: newGroup() }));
  }, [ready, state.group, update]);

  const group = state.group ?? { ...newGroup(), code: "" };
  const design = state.draft ?? { kind: "tee" as const, color: "black" as const, text: "YOUR SCHOOL", mark: "logo" as const, image: undefined };
  const kindPrice = CUSTOM_KINDS.find((k) => k.kind === design.kind)?.price ?? 12;
  const isCapOrTote = design.kind === "cap" || design.kind === "tote";

  const patch = (p: Partial<GroupOrder>) => update((s) => ({ ...s, group: { ...(s.group ?? group), ...p } }));

  const counts: Record<string, number> = {};
  group.members.forEach((m) => { if (m.status !== "waiting") counts[m.size] = (counts[m.size] ?? 0) + m.qty; });
  const units = Object.values(counts).reduce((a, b) => a + b, 0);
  const responded = group.members.filter((m) => m.status !== "waiting").length;
  const sub = units * kindPrice;
  const discount = units >= cfg.minGroupQty ? sub * cfg.groupDiscountRate : 0;
  const totalSizes = isCapOrTote ? ["One size"] : SIZES;

  const url = `${origin}/group-order?code=${group.code}`;
  const displayUrl = url.replace(/^https?:\/\//, "");
  const shareText = g.shareMsg(group.name || g.defaultName, url);

  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); notify(g.copied); } catch {}
  };

  const addMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName.trim()) return setErr(t.checkout.errors.required);
    const status: MemberStatus = group.pay === "chapter" ? "paid" : mPaid ? "paid" : "pending";
    patch({ members: [...group.members, { id: uid(), name: mName.trim(), size: isCapOrTote ? "One size" : mSize, qty: mQty, status, date: new Date().toISOString() }] });
    setMName(""); setMQty(1); setErr("");
  };

  const checkout = () => {
    if (units === 0) return notify(g.nothing);
    update((s) => ({ ...s, cart: s.cart.filter((l) => !l.group) }));
    Object.entries(counts).forEach(([size, q]) => {
      addLine({ kind: design.kind, color: design.color, size, qty: q, unitPrice: kindPrice, print: design.text || design.image || design.mark !== "logo" ? "custom" : "logo", custom: true, group: true, text: design.text, image: design.image, mark: design.mark });
    });
    router.push("/checkout");
  };

  const statusLabel = (s: MemberStatus) => (group.pay === "chapter" && s !== "waiting" ? g.status.chapter : g.status[s]);
  const statusClass = (s: MemberStatus) => (group.pay === "chapter" || s === "waiting" ? "badge-muted" : s === "paid" ? "badge-success" : "badge-warn");

  return (
    <div className="wrap page">
      <div className="between" style={{ alignItems: "end", gap: 16 }}>
        <div>
          <span className="overline" style={{ color: "var(--link)" }}>{g.over}</span>
          <h1 className="h1" style={{ marginTop: 4 }}>{g.title}</h1>
          <p className="muted" style={{ marginTop: 4 }}>{g.sub}</p>
        </div>
        <span className="badge badge-success">{g.collecting(group.deadline ? fmt.date(group.deadline) : "")}</span>
      </div>

      <div className="split">
        <div className="split-main" style={{ gap: 24 }}>
          <section className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
            <h2 style={{ fontSize: 20 }}>{g.s1}</h2>
            <div className="grid2" style={{ gap: 16 }}>
              <div><label className="label" htmlFor="g-name">{g.name}</label><input id="g-name" className="input" placeholder={g.defaultName} value={group.name} onChange={(e) => patch({ name: e.target.value })} /></div>
              <div><label className="label" htmlFor="g-uni">{g.uni}</label><input id="g-uni" className="input" placeholder={g.uniPh} value={group.uni} onChange={(e) => patch({ uni: e.target.value })} /></div>
              <div><label className="label" htmlFor="g-org">{g.org}</label><input id="g-org" className="input" type="email" placeholder="you@university.edu" value={group.org} onChange={(e) => patch({ org: e.target.value })} /></div>
              <div><label className="label" htmlFor="g-date">{g.deadline}</label><input id="g-date" className="input" type="date" value={group.deadline} onChange={(e) => patch({ deadline: e.target.value })} /></div>
            </div>
            <div className="row" style={{ gap: 14, padding: 12, borderRadius: 12, background: "var(--muted)", flexWrap: "nowrap" }}>
              <span style={{ width: 72, height: 72, borderRadius: 9.6, background: "var(--tile)", flex: "none", display: "block" }}>
                <ProductArt kind={design.kind} fill={COLORS[design.color].hex} print={design.text || design.image ? "custom" : "logo"} text={design.text} image={design.image} mark={design.mark} decorative />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: "block" }}>{g.designLine(t.kindShort[design.kind], fmt.color(design.color))}</strong>
                <span className="muted" style={{ fontSize: 13 }}>{design.text ? `“${design.text}” · ` : ""}{g.designMeta}</span>
              </div>
              <Link className="btn btn-outline" href="/custom">{g.change}</Link>
            </div>
          </section>

          <section className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
            <h2 style={{ fontSize: 20 }}>{g.s2}</h2>
            <fieldset style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
              <legend className="legend-plain">{g.how}</legend>
              {(["pickup", "one", "each"] as const).map((id) => (
                <label key={id} className="option" data-on={group.del === id}>
                  <input type="radio" name="gdel" checked={group.del === id} onChange={() => patch({ del: id })} />
                  <span><strong style={{ display: "block" }}>{g.del[id][0]}</strong><span className="muted" style={{ fontSize: 13 }}>{g.del[id][1]}</span></span>
                </label>
              ))}
            </fieldset>
            <fieldset style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
              <legend className="legend-plain">{g.who}</legend>
              {(["each", "chapter"] as const).map((id) => (
                <label key={id} className="option" data-on={group.pay === id}>
                  <input type="radio" name="gpay" checked={group.pay === id} onChange={() => patch({ pay: id })} />
                  <span><strong style={{ display: "block" }}>{g.pay[id][0]}</strong><span className="muted" style={{ fontSize: 13 }}>{g.pay[id][1]}</span></span>
                </label>
              ))}
            </fieldset>
          </section>

          <section className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="between">
              <h2 style={{ fontSize: 20 }}>{g.s3}</h2>
              <a className="btn btn-outline" href={`mailto:?subject=${encodeURIComponent(g.title)}&body=${encodeURIComponent(shareText)}`} onClick={() => patch({ reminded: true })}>
                {group.reminded ? g.reminded : g.remind}
              </a>
            </div>
            <div className="stack" style={{ gap: 6 }}>
              <div className="between" style={{ fontSize: 13 }}><span>{g.responded(responded, cfg.groupGoal)}</span><span className="muted">{g.goal}</span></div>
              <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={cfg.groupGoal} aria-valuenow={responded} aria-label={g.responses}>
                <div style={{ width: `${Math.min(100, (responded / cfg.groupGoal) * 100)}%` }} />
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr>{g.cols.map((col, i) => <th key={i} scope="col">{col}</th>)}</tr></thead>
                <tbody>
                  {ready && group.members.length === 0 && (
                    <tr><td colSpan={6} className="muted" style={{ textAlign: "center", padding: 24 }}>{g.nothing}</td></tr>
                  )}
                  {group.members.map((m, i) => (
                    <tr key={m.id}>
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ width: 32, height: 32, borderRadius: 9999, background: AVATAR[i % 4], color: "#fff", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {m.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                          </span>
                          {m.name}
                        </span>
                      </td>
                      <td>{m.status === "waiting" ? "—" : fmt.size(m.size)}</td>
                      <td>{m.status === "waiting" ? "—" : m.qty}</td>
                      <td>
                        <button type="button" className={`badge ${statusClass(m.status)}`} style={{ border: 0, cursor: group.pay === "each" ? "pointer" : "default" }}
                          onClick={() => group.pay === "each" && patch({ members: group.members.map((x) => (x.id === m.id ? { ...x, status: x.status === "paid" ? "pending" : "paid" } : x)) })}>
                          {statusLabel(m.status)}
                        </button>
                      </td>
                      <td className="muted">{m.date ? fmt.date(m.date) : g.invited}</td>
                      <td>
                        <button type="button" className="icon-btn" aria-label={g.removeMember(m.name)} onClick={() => patch({ members: group.members.filter((x) => x.id !== m.id) })} style={{ width: 36, height: 36 }}>
                          <Icon name="x" size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <form onSubmit={addMember} className="stack" style={{ gap: 10, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
              <strong style={{ fontSize: 14 }}>{g.addTitle}</strong>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "end" }}>
                <div style={{ flex: "2 1 180px" }}>
                  <label className="label" htmlFor="m-name">{g.memberName}</label>
                  <input id="m-name" className="input" value={mName} onChange={(e) => { setMName(e.target.value); setErr(""); }} aria-invalid={!!err} />
                </div>
                {!isCapOrTote && (
                  <div style={{ flex: "1 1 90px" }}>
                    <label className="label" htmlFor="m-size">{t.common.size}</label>
                    <select id="m-size" className="input" value={mSize} onChange={(e) => setMSize(e.target.value)}>{SIZES.map((s) => <option key={s}>{s}</option>)}</select>
                  </div>
                )}
                <div style={{ flex: "1 1 80px" }}>
                  <label className="label" htmlFor="m-qty">{t.common.qty}</label>
                  <input id="m-qty" className="input" type="number" min={1} max={20} value={mQty} onChange={(e) => setMQty(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} />
                </div>
                {group.pay === "each" && (
                  <label className="check" style={{ flex: "1 1 120px", paddingBottom: 10 }}><input type="checkbox" checked={mPaid} onChange={() => setMPaid(!mPaid)} />{g.status.paid}</label>
                )}
                <button className="btn btn-outline" type="submit">{g.add}</button>
              </div>
              {err && <p className="field-error">{err}</p>}
            </form>
          </section>
        </div>

        <aside className="split-side" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section className="inverse" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 style={{ fontSize: 18 }}>{g.shareTitle}</h2>
            <p style={{ color: "var(--inverse-muted)", fontSize: 13 }}>{g.shareSub}</p>
            <label htmlFor="share" className="sr-only">{g.shareLink}</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input id="share" className="input" readOnly value={displayUrl} style={{ background: "rgba(255,255,255,.08)", color: "#fff", borderColor: "rgba(255,255,255,.25)" }} onFocus={(e) => e.target.select()} />
              <button type="button" className="btn btn-primary" onClick={copy} style={{ padding: "0 16px" }}>{copied ? g.copied : g.copy}</button>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <a className="btn btn-ghost-inv" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">{g.whatsapp}</a>
              <a className="btn btn-ghost-inv" href={`mailto:?subject=${encodeURIComponent(g.title)}&body=${encodeURIComponent(shareText)}`}>{g.email}</a>
            </div>
          </section>

          <section className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <h2 style={{ fontSize: 18 }}>{g.totals}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
              {totalSizes.map((s) => (
                <div key={s} style={{ padding: 10, borderRadius: 12, background: "var(--muted)", textAlign: "center" }}>
                  <span className="muted" style={{ display: "block", fontSize: 12 }}>{fmt.size(s)}</span>
                  <strong style={{ fontFamily: "var(--font-display)", fontSize: 20 }}>{counts[s] ?? 0}</strong>
                </div>
              ))}
            </div>
            <div className="stack" style={{ gap: 6, fontSize: 14, paddingTop: 8, borderTop: "1px solid var(--border)" }}>
              <div className="between" style={{ flexWrap: "nowrap" }}><span>{g.unitsLine(units, fmt.money(kindPrice))}</span><span>{fmt.money(sub)}</span></div>
              <div className="between" style={{ flexWrap: "nowrap" }}><span>{g.setup}</span><span>{fmt.money(units ? cfg.customSetupFee : 0)}</span></div>
              <div className="between" style={{ flexWrap: "nowrap" }}><span>{g.discount}</span><span style={{ color: discount ? "var(--success-fg)" : undefined }}>{discount ? `−${fmt.money(discount)}` : g.notYet}</span></div>
              <div className="between" style={{ flexWrap: "nowrap", fontWeight: 700, fontSize: 16 }}><span>{g.est}</span><span>{fmt.money(sub - discount + (units ? cfg.customSetupFee : 0))}</span></div>
            </div>
            <button type="button" className="btn btn-primary" onClick={checkout} style={{ whiteSpace: "normal", padding: "8px 16px" }}>{g.checkout}</button>
            <p className="muted" style={{ fontSize: 12 }}>{g.min}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
