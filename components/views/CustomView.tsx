"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { COLORS, COLOR_IDS, CUSTOM_KINDS, ONE_SIZE, type ColorId, type Kind, type Print } from "@/lib/catalog";
import { storeConfig as cfg } from "@/lib/config";
import type { Design, Mark } from "@/lib/types";
import { Icon } from "../Icon";
import { ProductArt } from "../ProductArt";
import { QtyStepper } from "../ProductCard";
import { uid, useFormat, usePrefs, useStore } from "../providers";

type Tool = "templates" | "text" | "upload" | "elements";
type Snap = { template: string; text: string; kind: Kind; color: ColorId; mark: Mark; image?: string };

const TEMPLATES: { id: string; color: ColorId; text: string; mark: Mark }[] = [
  { id: "uni", color: "black", text: "YOUR SCHOOL", mark: "logo" },
  { id: "chapter", color: "white", text: "LEAD PERU", mark: "logo" },
  { id: "event", color: "navy", text: "ASPIRE 2026", mark: "logo" },
  { id: "classic", color: "gray", text: "", mark: "logo" },
];
const DEFAULT: Snap = { template: "uni", text: "YOUR SCHOOL", kind: "tee", color: "black", mark: "logo" };
const APPAREL = ["XS", "S", "M", "L", "XL", "2XL"];
const MAX_BYTES = 5 * 1024 * 1024;

/** Logo-only designs render the large centered mark; everything else uses the custom print. */
const printFor = (s: Snap): Print => (!s.text && !s.image && s.mark === "logo" ? "logo" : "custom");

export function CustomView() {
  const { t } = usePrefs();
  const c = t.custom;
  const fmt = useFormat();
  const router = useRouter();
  const params = useSearchParams();
  const { state, update, ready, addLine, notify } = useStore();

  const [hist, setHist] = useState<Snap[]>([DEFAULT]);
  const [idx, setIdx] = useState(0);
  const [tool, setTool] = useState<Tool>((params.get("tool") as Tool) || "templates");
  const [side, setSide] = useState<"front" | "back">("front");
  const [qty, setQty] = useState<Record<string, number>>({ S: 4, M: 8, L: 6, XL: 2 });
  const [designId, setDesignId] = useState<string | null>(null);
  const [savedNow, setSavedNow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [over, setOver] = useState(false);
  const [needUnits, setNeedUnits] = useState(false);
  const inited = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const snap = hist[idx];

  // Load the starting design once the store is ready: saved design, share link, template, or last draft.
  useEffect(() => {
    if (!ready || inited.current) return;
    inited.current = true;
    let start: Snap | null = null;
    const id = params.get("design");
    const saved = id ? state.designs.find((d) => d.id === id) : undefined;
    if (saved) {
      start = { template: saved.template, text: saved.text, kind: saved.kind, color: saved.color, mark: saved.mark, image: saved.image };
      // eslint-disable-next-line react-hooks/set-state-in-effect -- initial state depends on hydrated browser storage
      setDesignId(saved.id);
    } else if (params.get("k") || params.get("t")) {
      const k = params.get("k") as Kind;
      const col = params.get("c") as ColorId;
      const m = params.get("m") as Mark;
      start = {
        template: "custom",
        text: (params.get("t") ?? "").toUpperCase().slice(0, cfg.maxCustomText),
        kind: CUSTOM_KINDS.some((x) => x.kind === k) ? k : "tee",
        color: COLOR_IDS.includes(col) ? col : "black",
        mark: ["logo", "values", "none"].includes(m) ? m : "logo",
      };
    } else if (params.get("tpl")) {
      const tpl = TEMPLATES.find((x) => x.id === params.get("tpl"));
      if (tpl) start = { ...DEFAULT, template: tpl.id, text: tpl.text, color: tpl.color, mark: tpl.mark };
    } else if (state.draft) {
      const d = state.draft;
      start = { template: d.template, text: d.text, kind: d.kind, color: d.color, mark: d.mark, image: d.image };
    }
    if (start) { setHist([start]); setIdx(0); }
  }, [ready, params, state.designs, state.draft]);

  // Keep the working design as a draft so group orders and later visits can use it.
  useEffect(() => {
    if (!ready || !inited.current) return;
    update((s) => ({ ...s, draft: { id: designId ?? "draft", ...snap, updatedAt: new Date().toISOString() } }));
  }, [snap, ready, designId, update]);

  const commit = (patch: Partial<Snap>) => {
    const next = { ...snap, ...patch };
    const nextHist = [...hist.slice(0, idx + 1), next].slice(-50);
    setHist(nextHist);
    setIdx(nextHist.length - 1);
    setSavedNow(false);
  };

  const kindPrice = CUSTOM_KINDS.find((k) => k.kind === snap.kind)!.price;
  const sizeList = snap.kind === "cap" || snap.kind === "tote" ? [ONE_SIZE] : APPAREL;
  const units = sizeList.reduce((n, s) => n + (qty[s] || 0), 0);
  const base = units * kindPrice;
  const print = printFor(snap);
  const apparel = snap.kind === "tee" || snap.kind === "hoodie";

  const onFile = (file?: File | null) => {
    setUploadErr("");
    if (!file) return;
    if (!/^image\/(png|jpe?g|svg\+xml)$/.test(file.type)) return setUploadErr(c.badType);
    if (file.size > MAX_BYTES) return setUploadErr(c.tooBig);
    const reader = new FileReader();
    reader.onload = () => { commit({ image: String(reader.result), template: "custom" }); notify(c.uploaded); };
    reader.readAsDataURL(file);
  };

  const shareUrl = () => {
    const u = new URL("/custom", window.location.origin);
    u.searchParams.set("k", snap.kind);
    u.searchParams.set("c", snap.color);
    u.searchParams.set("m", snap.mark);
    if (snap.text) u.searchParams.set("t", snap.text);
    return u.toString();
  };

  const share = async () => {
    try { await navigator.clipboard.writeText(shareUrl()); setCopied(true); notify(c.copied); } catch {}
  };

  const saveDesign = () => {
    const id = designId ?? uid();
    const d: Design = { id, ...snap, updatedAt: new Date().toISOString() };
    update((s) => ({ ...s, designs: [d, ...s.designs.filter((x) => x.id !== id)] }));
    setDesignId(id);
    setSavedNow(true);
    notify(c.saved, "/account", t.header.account);
  };

  const addToCart = () => {
    if (units === 0) return setNeedUnits(true);
    sizeList.forEach((s) => {
      const q = qty[s] || 0;
      if (q > 0) addLine({ kind: snap.kind, color: snap.color, size: s, qty: q, unitPrice: kindPrice, print, custom: true, text: snap.text, image: snap.image, mark: snap.mark });
    });
    notify(c.addedMsg(units), "/cart", t.common.viewCart);
  };

  const startGroup = () => router.push("/group-order");

  return (
    <div className="wrap page" style={{ gap: 20 }}>
      <div className="between" style={{ alignItems: "end", gap: 16 }}>
        <div><h1 className="h1">{c.title}</h1><p className="muted" style={{ marginTop: 4 }}>{c.sub}</p></div>
        <ol aria-label={c.stepsLabel} style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap", gap: 8, fontSize: 13 }}>
          {c.steps.map((s, i) => (
            <li key={s} className={i === 0 ? "badge badge-soft" : "badge badge-muted"} style={{ height: 30, padding: "0 12px", fontWeight: i === 0 ? 600 : 500 }}>{s}</li>
          ))}
        </ol>
      </div>

      <div className="studio">
        <aside className="card studio-panel studio-tools" aria-label={c.tools}>
          <div role="tablist" aria-label={c.tools} className="seg" style={{ gridAutoColumns: "minmax(0,1fr)" }}>
            {(Object.keys(c.toolTabs) as Tool[]).map((id) => (
              <button key={id} type="button" role="tab" aria-selected={tool === id} onClick={() => setTool(id)} style={{ fontSize: 12, padding: "0 4px" }}>{c.toolTabs[id]}</button>
            ))}
          </div>

          {tool === "templates" && (
            <div className="stack" style={{ gap: 10 }}>
              <span className="sec">{c.fromTemplate}</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
                {TEMPLATES.map((tp) => (
                  <button key={tp.id} type="button" className="tpl-btn" aria-pressed={snap.template === tp.id}
                    onClick={() => commit({ template: tp.id, text: tp.text, color: tp.color, mark: tp.mark, image: undefined })}>
                    <span style={{ display: "block", width: "100%", aspectRatio: 1, borderRadius: 9.6, background: "var(--tile)" }}>
                      <ProductArt kind="tee" fill={COLORS[tp.color].hex} print={tp.text ? "custom" : "logo"} text={tp.text} decorative />
                    </span>
                    {c.tpl[tp.id as keyof typeof c.tpl]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tool === "text" && (
            <div className="stack" style={{ gap: 12 }}>
              <span className="sec">{c.addText}</span>
              <div>
                <label className="label" htmlFor="txt">{c.mainText}</label>
                <input id="txt" className="input" value={snap.text} maxLength={cfg.maxCustomText}
                  onChange={(e) => commit({ text: e.target.value.toUpperCase().slice(0, cfg.maxCustomText), template: "custom" })} />
                <span className="muted" style={{ fontSize: 12 }}>{c.chars(snap.text.length)}</span>
              </div>
            </div>
          )}

          {tool === "upload" && (
            <div className="stack" style={{ gap: 12 }}>
              <span className="sec">{c.uploadTitle}</span>
              <label htmlFor="art" className="dropzone" data-over={over}
                onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
                onDrop={(e) => { e.preventDefault(); setOver(false); onFile(e.dataTransfer.files?.[0]); }}>
                <Icon name="upload" size={28} />
                <strong style={{ color: "var(--fg)" }}>{c.drop}</strong>
                <span style={{ fontSize: 12 }}>{c.dropHint}</span>
              </label>
              <input id="art" ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml" className="sr-only" onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
              {uploadErr && <p className="field-error" role="alert">{uploadErr}</p>}
              {snap.image && (
                <div className="between" style={{ padding: 10, borderRadius: 12, background: "var(--muted)" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
                  <img src={snap.image} alt="" style={{ width: 48, height: 48, objectFit: "contain", borderRadius: 8, background: "var(--tile)" }} />
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => commit({ image: undefined })}><Icon name="trash" size={16} />{c.remove}</button>
                </div>
              )}
              <p className="muted" style={{ fontSize: 12 }}>{c.uploadNote}</p>
            </div>
          )}

          {tool === "elements" && (
            <div className="stack" style={{ gap: 12 }}>
              <span className="sec">{c.elements}</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: 10 }}>
                {(["logo", "values", "none"] as Mark[]).map((m) => (
                  <button key={m} type="button" className="tpl-btn" aria-pressed={snap.mark === m} onClick={() => commit({ mark: m })} style={{ minHeight: 72, justifyContent: "center", fontSize: 14, fontWeight: 600 }}>
                    {c.el[m][0]}<span className="muted" style={{ fontSize: 11, fontWeight: 400 }}>{c.el[m][1]}</span>
                  </button>
                ))}
              </div>
              <p className="muted" style={{ fontSize: 12 }}>{c.elNote}</p>
            </div>
          )}
        </aside>

        <section aria-label={c.preview} className="card studio-panel studio-preview" style={{ gap: 12 }}>
          <div className="between" style={{ gap: 8 }}>
            <div role="group" aria-label={c.side} className="seg seg-inline">
              {(["front", "back"] as const).map((s) => (
                <button key={s} type="button" aria-pressed={side === s} onClick={() => setSide(s)} style={{ minHeight: 40 }}>{c[s]}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button type="button" className="btn btn-outline btn-sm" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>{c.undo}</button>
              <button type="button" className="btn btn-outline btn-sm" disabled={idx >= hist.length - 1} onClick={() => setIdx(idx + 1)}>{c.redo}</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => { commit(DEFAULT); setDesignId(null); }}>{c.reset}</button>
            </div>
          </div>
          <div className="studio-stage">
            <div style={{ width: "82%", height: "92%" }}>
              <ProductArt kind={snap.kind} fill={COLORS[snap.color].hex} print={side === "back" ? "none" : print} text={snap.text} image={snap.image} mark={snap.mark} />
            </div>
            {apparel && side === "front" && (
              <div aria-hidden="true" style={{ position: "absolute", left: "34%", top: "28%", width: "32%", height: "40%", border: "1.5px dashed oklch(0.52 0.2 287 / .6)", borderRadius: 6 }} />
            )}
            <span style={{ position: "absolute", left: 12, bottom: 12, fontSize: 12, padding: "4px 10px", borderRadius: 9999, background: "#fff", color: "oklch(0.28 0.05 272)" }}>{c.printArea}</span>
          </div>
          <div className="between" style={{ gap: 8 }}>
            <span className="muted" style={{ fontSize: 13 }}>{c.previewNote}</span>
            <button type="button" className="btn btn-outline" style={{ minHeight: 40 }} onClick={share}>{copied ? c.copied : c.share}</button>
          </div>
        </section>

        <aside className="card studio-panel studio-order" aria-label={c.productOrder} style={{ padding: 20, gap: 18 }}>
          <div className="stack" style={{ gap: 10 }}>
            <span className="sec">{c.product}</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
              {CUSTOM_KINDS.map(({ kind }) => (
                <button key={kind} type="button" className="tpl-btn" aria-pressed={snap.kind === kind} onClick={() => commit({ kind })} style={{ padding: 4, gap: 2, fontSize: 11 }}>
                  <span style={{ display: "block", width: "100%", aspectRatio: 1 }}><ProductArt kind={kind} fill="#9ca3af" print="none" decorative /></span>
                  {t.kindShort[kind]}
                </button>
              ))}
            </div>
          </div>
          <fieldset>
            <legend className="sec" style={{ marginBottom: 10 }}>{t.common.color}: <span style={{ fontWeight: 400, fontFamily: "var(--font-sans)", fontSize: 14 }}>{fmt.color(snap.color)}</span></legend>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {COLOR_IDS.map((col) => (
                <button key={col} type="button" className="swatch" style={{ width: 40, height: 40, background: COLORS[col].hex }} aria-label={fmt.color(col)} aria-pressed={snap.color === col} onClick={() => commit({ color: col })} />
              ))}
            </div>
          </fieldset>
          <div className="stack" style={{ gap: 8 }}>
            <span className="sec">{c.sizesQty}</span>
            {sizeList.map((s) => (
              <div key={s} className="between" style={{ flexWrap: "nowrap" }}>
                <span style={{ fontWeight: 500 }}>{fmt.size(s)}</span>
                <QtyStepper small min={0} max={500} value={qty[s] || 0} label={c.qtyFor(fmt.size(s))} onChange={(n) => { setQty({ ...qty, [s]: n }); setNeedUnits(false); }} />
              </div>
            ))}
            {needUnits && <p className="field-error" role="alert">{c.needUnits}</p>}
          </div>
          <div className="estimate">
            <div className="between" style={{ flexWrap: "nowrap" }}><span>{c.units(units, t.kindShort[snap.kind])}</span><span>{fmt.money(base)}</span></div>
            <div className="between" style={{ flexWrap: "nowrap" }}><span>{c.setupLine}</span><span>{fmt.money(cfg.customSetupFee)}</span></div>
            <div className="between" style={{ flexWrap: "nowrap", fontWeight: 700, fontSize: 15, paddingTop: 6, borderTop: "1px solid var(--border)" }}><span>{c.estTotal}</span><span>{fmt.money(base + (units ? cfg.customSetupFee : 0))}</span></div>
            <span className="muted" style={{ fontSize: 12 }}>{c.groupNote}</span>
          </div>
          <div className="stack" style={{ gap: 8 }}>
            <button type="button" className="btn btn-primary" onClick={addToCart}>{c.add}</button>
            <button type="button" className="btn btn-outline" onClick={startGroup} style={{ whiteSpace: "normal", textAlign: "center", padding: "8px 16px" }}>{c.startGroup}</button>
            <button type="button" className="btn btn-outline" onClick={saveDesign}>{savedNow ? <><Icon name="check" />{c.saved}</> : c.save}</button>
            {savedNow && <Link href="/account" className="muted" style={{ fontSize: 12, textAlign: "center" }}>{t.header.account} →</Link>}
          </div>
        </aside>
      </div>
    </div>
  );
}
