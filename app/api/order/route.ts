import { Resend } from "resend";
import { buildOrderEmail, priceOrder } from "@/lib/order-email";

// Same email setup as the main LEAD site (lead-main): Resend + the leadmindset.org sender.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const ORDER_FROM = process.env.ORDER_FROM ?? "LEAD Store <noreply@leadmindset.org>";
/** Supplier inbox. Comma-separated for several recipients. */
const ORDER_TO = process.env.ORDER_TO ?? "angela.cortes@leadmindset.org";

// Basic abuse guard: there is no real payment yet, so cap orders per IP (per server instance).
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (limited(ip)) return Response.json({ error: "Too many orders, try again later" }, { status: 429 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const order = priceOrder(body);
  if (typeof order === "string") return Response.json({ error: order }, { status: 400 });

  const { subject, text, html } = buildOrderEmail(order);

  if (!resend) {
    // Local development without a key: show the email in the server log instead of sending it.
    console.info(`[order] RESEND_API_KEY not set, email not sent.\nTo: ${ORDER_TO}\nSubject: ${subject}\n\n${text}`);
    return Response.json({ ok: true, delivered: false, total: order.totals.total });
  }

  try {
    const result = await resend.emails.send({
      from: ORDER_FROM,
      to: ORDER_TO.split(/,\s*/),
      replyTo: order.customer.email,
      subject,
      text,
      html,
      attachments: order.images,
    });
    if (result.error) throw new Error(result.error.message);
    return Response.json({ ok: true, delivered: true, total: order.totals.total });
  } catch (error) {
    console.error("[order] email failed", error);
    return Response.json({ error: "Failed to send order email" }, { status: 502 });
  }
}
