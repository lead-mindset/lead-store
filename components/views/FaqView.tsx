"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { usePrefs, useStore } from "../providers";

type Topic = "all" | "orders" | "pickup" | "custom" | "group" | "returns";
const TOPICS: Topic[] = ["all", "orders", "pickup", "custom", "group", "returns"];

export function FaqView() {
  const { t } = usePrefs();
  const f = t.faq;
  const { notify } = useStore();
  const params = useSearchParams();
  const initial = params.get("topic") as Topic | null;
  const [topic, setTopic] = useState<Topic>(initial && TOPICS.includes(initial) ? initial : "all");
  const [open, setOpen] = useState(0);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState<Record<string, string>>({});

  const list = f.items.filter(([tp]) => topic === "all" || tp === topic);

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = t.checkout.errors.email;
    if (!msg.trim()) next.msg = t.checkout.errors.required;
    setErr(next);
    if (Object.keys(next).length) return;
    setSent(true);
    setMsg("");
    notify(f.sent);
  };

  return (
    <div className="wrap page" style={{ paddingTop: 40, gap: 28 }}>
      <div className="stack" style={{ gap: 8, maxWidth: 640 }}>
        <h1 className="h1">{f.title}</h1>
        <p className="muted" style={{ fontSize: 16 }}>{f.sub}</p>
      </div>

      <div role="group" aria-label={f.topic} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {TOPICS.map((id) => (
          <button key={id} type="button" className="chip" aria-pressed={topic === id} onClick={() => { setTopic(id); setOpen(0); }}>{f.topics[id]}</button>
        ))}
      </div>

      <div className="split">
        <section aria-label={f.questions} className="card split-main" style={{ padding: "8px 24px", gap: 0 }}>
          {list.map(([, q, a], i) => (
            <div key={q} className="acc-item" style={i === list.length - 1 ? { borderBottom: 0 } : undefined}>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>
                <button type="button" className="acc-btn" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)} style={{ minHeight: 60 }}>
                  {q}<span aria-hidden="true">{open === i ? "−" : "+"}</span>
                </button>
              </h2>
              {open === i && <p className="muted" style={{ paddingBottom: 18, maxWidth: 680 }}>{a}</p>}
            </div>
          ))}
        </section>

        <aside className="split-side" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <form id="contact" className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14, scrollMarginTop: 140 }} onSubmit={send} noValidate>
            <h2 style={{ fontSize: 18 }}>{f.helpTitle}</h2>
            <p className="muted" style={{ fontSize: 13 }}>{f.helpSub}</p>
            <div>
              <label className="label" htmlFor="h-email">{f.email}</label>
              <input id="h-email" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!err.email} />
              {err.email && <p className="field-error">{err.email}</p>}
            </div>
            <div><label className="label" htmlFor="h-order">{f.orderNum}</label><input id="h-order" className="input" placeholder="#" /></div>
            <div>
              <label className="label" htmlFor="h-msg">{f.message}</label>
              <textarea id="h-msg" className="input" rows={4} value={msg} onChange={(e) => { setMsg(e.target.value); setSent(false); }} aria-invalid={!!err.msg} />
              {err.msg && <p className="field-error">{err.msg}</p>}
            </div>
            <button className="btn btn-primary" type="submit">{sent ? f.sent : f.send}</button>
          </form>
          <div className="inverse" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <strong style={{ fontFamily: "var(--font-display)" }}>{f.trackTitle}</strong>
            <span style={{ fontSize: 13, color: "var(--inverse-muted)" }}>{f.trackSub}</span>
            <Link href="/account" style={{ color: "#fff", fontWeight: 600, minHeight: 36, display: "inline-flex", alignItems: "center" }}>{f.trackLink}</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
