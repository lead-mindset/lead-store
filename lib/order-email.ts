import "server-only";
import { APPAREL_SIZES, COLORS, CUSTOM_KINDS, ONE_SIZE, getProduct, type ColorId, type Kind } from "./catalog";
import { storeConfig } from "./config";
import { DICTS } from "./i18n";
import { PROMO_CODES, computeTotals, type Totals } from "./pricing";
import type { CartLine, OrderRequest } from "./types";

// The supplier email is always in Spanish.
const es = DICTS.es;
const MAX_LINES = 60;
const IMAGE = /^data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=]+)$/;

export type PricedOrder = Omit<OrderRequest, "lines"> & { lines: CartLine[]; totals: Totals; images: { filename: string; content: string }[] };

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const oneOf = <T extends string>(v: unknown, opts: readonly T[], fallback: T): T => (opts.includes(v as T) ? (v as T) : fallback);

/** Validates the request and re-prices every line from the catalog (client prices are never trusted). */
export function priceOrder(body: unknown): PricedOrder | string {
  const b = (body ?? {}) as Partial<OrderRequest>;
  const c = (b.customer ?? {}) as Partial<OrderRequest["customer"]>;
  const d = (b.delivery ?? {}) as Partial<OrderRequest["delivery"]>;

  const customer = { first: str(c.first, 80), last: str(c.last, 80), email: str(c.email, 160), phone: str(c.phone, 40), chapter: str(c.chapter, 120) };
  if (!customer.first || !customer.last || !/^\S+@\S+\.\S+$/.test(customer.email)) return "Invalid customer";

  const delivery: OrderRequest["delivery"] = {
    method: oneOf(d.method, ["pickup", "ship"] as const, "pickup"),
    speed: oneOf(d.speed, ["standard", "express"] as const, "standard"),
    spot: oneOf(d.spot, ["event", "chapter", "office"] as const, "event"),
    street: str(d.street), apt: str(d.apt, 80), city: str(d.city, 80), state: str(d.state, 80), zip: str(d.zip, 20), country: str(d.country, 80),
  };
  if (delivery.method === "ship" && (!delivery.street || !delivery.city || !delivery.zip)) return "Missing shipping address";

  if (!Array.isArray(b.lines) || b.lines.length === 0 || b.lines.length > MAX_LINES) return "Invalid lines";

  const images: PricedOrder["images"] = [];
  const imageNames = new Map<string, string>();
  const lines: CartLine[] = [];
  for (const [i, raw] of b.lines.entries()) {
    const l = raw as Partial<CartLine>;
    const qty = Math.floor(Number(l.qty));
    if (!(qty >= 1 && qty <= 99)) return `Invalid quantity on line ${i + 1}`;
    if (!(l.color && l.color in COLORS)) return `Invalid color on line ${i + 1}`;
    const size = str(l.size, 12);
    if (size !== ONE_SIZE && !APPAREL_SIZES.includes(size)) return `Invalid size on line ${i + 1}`;

    let unitPrice: number;
    let kind: Kind;
    if (l.custom) {
      const k = CUSTOM_KINDS.find((ck) => ck.kind === l.kind);
      if (!k) return `Invalid custom item on line ${i + 1}`;
      unitPrice = k.price;
      kind = k.kind;
    } else {
      const p = l.slug ? getProduct(l.slug) : undefined;
      if (!p || p.soldOut?.includes(size)) return `Unavailable product on line ${i + 1}`;
      unitPrice = p.price;
      kind = p.kind;
    }

    let image: string | undefined;
    const m = typeof l.image === "string" ? IMAGE.exec(l.image) : null;
    if (m) {
      // The same artwork usually repeats across sizes: attach it once.
      image = imageNames.get(l.image!);
      if (!image) {
        image = `diseno-${imageNames.size + 1}.${m[1] === "jpeg" ? "jpg" : m[1]}`;
        imageNames.set(l.image!, image);
        images.push({ filename: image, content: m[2] });
      }
    }

    lines.push({
      id: String(i + 1), slug: l.custom ? undefined : l.slug, kind, color: l.color as ColorId, size, qty, unitPrice,
      print: l.print ?? "logo", custom: !!l.custom, group: !!l.group, text: str(l.text, 40), mark: l.mark, image,
    });
  }

  const promo = typeof b.promo === "string" && PROMO_CODES.includes(b.promo.toUpperCase()) ? b.promo.toUpperCase() : null;
  const gift = Math.min(500, Math.max(0, Math.round(Number(b.gift) || 0)));
  const totals = computeTotals({ lines, delivery: delivery.method, speed: delivery.speed, gift, promo, withTax: true });

  return {
    num: str(b.num, 12) || "—", lang: b.lang === "en" ? "en" : "es", customer, delivery, pay: str(b.pay, 20) || "card",
    promo, gift, notes: str(b.notes, 1000), lines, totals, images, imagesOmitted: !!b.imagesOmitted,
  };
}

const money = (n: number) => new Intl.NumberFormat("es-US", { style: "currency", currency: storeConfig.currency }).format(n);
const esc = (s: string) => s.replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

function lineName(l: CartLine) {
  const p = l.slug ? getProduct(l.slug) : undefined;
  return p ? p.name.es : es.common.customItem(es.kindShort[l.kind]);
}

function lineDetails(l: CartLine) {
  const out: string[] = [];
  if (l.group) out.push("Pedido grupal");
  if (l.text) out.push(`Texto: "${l.text}"`);
  if (l.mark) out.push(`Elemento: ${es.custom.el[l.mark][0]}`);
  if (l.image) out.push(`Arte adjunto: ${l.image}`);
  return out;
}

const PAY = { card: "Tarjeta", apple: "Apple Pay", google: "Google Pay", paypal: "PayPal" } as Record<string, string>;

function summary(o: PricedOrder) {
  const d = o.delivery;
  const deliveryLines =
    d.method === "ship"
      ? [`Envío ${d.speed === "express" ? "exprés" : "estándar"}`, [d.street, d.apt].filter(Boolean).join(", "), [d.city, d.state, d.zip].filter(Boolean).join(", "), d.country ?? ""].filter(Boolean)
      : [`Retiro local: ${es.checkout.spots[d.spot ?? "event"][0]}`];
  const totals: [string, string][] = [
    ["Subtotal", money(o.totals.subtotal)],
    ...(o.totals.setup ? [["Preparación de impresión", money(o.totals.setup)] as [string, string]] : []),
    ...(o.totals.discount ? [[`Descuento${o.promo ? ` (${o.promo})` : ""}`, `−${money(o.totals.discount)}`] as [string, string]] : []),
    ["Envío", o.totals.shipping ? money(o.totals.shipping) : "Gratis"],
    ...(o.gift ? [["Regalo para LEAD", money(o.gift)] as [string, string]] : []),
    ["Impuestos estimados", money(o.totals.tax)],
    ["Total", money(o.totals.total)],
  ];
  return { deliveryLines, totals };
}

export function buildOrderEmail(o: PricedOrder) {
  const name = `${o.customer.first} ${o.customer.last}`;
  const subject = `Nuevo pedido #${o.num} · LEAD Store · ${name} · ${money(o.totals.total)}`;
  const { deliveryLines, totals } = summary(o);
  const customerLines = [name, o.customer.email, o.customer.phone, o.customer.chapter && `Capítulo: ${o.customer.chapter}`].filter(Boolean) as string[];
  const size = (s: string) => (s === ONE_SIZE ? es.common.oneSize : s);
  const warn = o.imagesOmitted ? "El cliente subió arte que era demasiado grande para adjuntar. Pídeselo por correo." : "";

  const text = [
    `Nuevo pedido #${o.num} — LEAD Store`,
    "",
    "CLIENTE", ...customerLines, "",
    "ENTREGA", ...deliveryLines, "",
    "ARTÍCULOS",
    ...o.lines.map((l) => [`- ${l.qty} × ${lineName(l)} · ${COLORS[l.color].name.es} · ${size(l.size)} · ${money(l.unitPrice)} c/u = ${money(l.unitPrice * l.qty)}`, ...lineDetails(l).map((x) => `    ${x}`)].join("\n")),
    "",
    ...totals.map(([k, v]) => `${k}: ${v}`),
    `Pago: ${PAY[o.pay] ?? o.pay} (demo, sin cobro real)`,
    ...(o.notes ? ["", "NOTAS DEL CLIENTE", o.notes] : []),
    ...(warn ? ["", warn] : []),
  ].join("\n");

  const td = 'style="padding:8px 10px;border-bottom:1px solid #e3e5ef;vertical-align:top"';
  const rows = o.lines
    .map((l) => `<tr><td ${td}><strong>${esc(lineName(l))}</strong>${lineDetails(l).map((x) => `<br><span style="color:#5b6079;font-size:13px">${esc(x)}</span>`).join("")}</td>
      <td ${td}>${esc(COLORS[l.color].name.es)}</td><td ${td}>${esc(size(l.size))}</td><td ${td} align="center">${l.qty}</td>
      <td ${td} align="right">${money(l.unitPrice)}</td><td ${td} align="right">${money(l.unitPrice * l.qty)}</td></tr>`)
    .join("");
  const th = (align = "left") => `style="padding:8px 10px;text-align:${align};font-size:12px;color:#5b6079;border-bottom:2px solid #030c40"`;
  const block = (title: string, ls: string[]) =>
    `<td style="vertical-align:top;padding:0 24px 16px 0"><div style="font-size:12px;font-weight:700;color:#5b6079;letter-spacing:.06em">${title}</div>${ls.map((x) => `<div>${esc(x)}</div>`).join("")}</td>`;

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#030c40;max-width:720px;margin:0 auto;font-size:14px;line-height:1.5">
  <div style="background:#030c40;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0">
    <div style="font-size:12px;letter-spacing:.12em;opacity:.8">LEAD STORE</div>
    <div style="font-size:22px;font-weight:700">Nuevo pedido #${esc(o.num)}</div>
  </div>
  <div style="border:1px solid #e3e5ef;border-top:0;padding:24px;border-radius:0 0 12px 12px">
    ${warn ? `<p style="background:#fff4e5;border:1px solid #f5c26b;padding:10px 12px;border-radius:8px">${esc(warn)}</p>` : ""}
    <table role="presentation" style="margin-bottom:8px"><tr>${block("CLIENTE", customerLines)}${block("ENTREGA", deliveryLines)}</tr></table>
    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
      <tr><th ${th()}>Artículo</th><th ${th()}>Color</th><th ${th()}>Talla</th><th ${th("center")}>Cant.</th><th ${th("right")}>Precio</th><th ${th("right")}>Subtotal</th></tr>
      ${rows}
    </table>
    <table style="margin-left:auto;border-collapse:collapse">${totals
      .map(([k, v], i) => `<tr><td style="padding:3px 16px 3px 0;${i === totals.length - 1 ? "font-weight:700;font-size:16px;border-top:1px solid #e3e5ef;padding-top:8px" : "color:#5b6079"}">${esc(k)}</td><td align="right" style="padding:3px 0;${i === totals.length - 1 ? "font-weight:700;font-size:16px;border-top:1px solid #e3e5ef;padding-top:8px" : ""}">${esc(v)}</td></tr>`)
      .join("")}</table>
    <p style="color:#5b6079;font-size:13px">Pago: ${esc(PAY[o.pay] ?? o.pay)} (demo, sin cobro real)</p>
    ${o.notes ? `<div style="background:#f4f5fa;padding:12px;border-radius:8px"><strong>Notas del cliente</strong><br>${esc(o.notes).replace(/\n/g, "<br>")}</div>` : ""}
  </div></div>`;

  return { subject, text, html };
}
