import { storeConfig as cfg } from "./config";
import type { CartLine } from "./types";

export const PROMO_CODES = ["LEAD10", "CHAPTER10"];
export const PROMO_RATE = 0.1;

export type TotalsInput = {
  lines: CartLine[];
  delivery: "pickup" | "ship";
  speed?: "standard" | "express";
  gift: number;
  promo: string | null;
  /** Include estimated tax (checkout) or leave it for later (cart). */
  withTax?: boolean;
};

export type Totals = {
  units: number;
  subtotal: number;
  setup: number;
  discount: number;
  shipping: number;
  gift: number;
  tax: number;
  total: number;
  hasCustom: boolean;
};

const round = (n: number) => Math.round(n * 100) / 100;

export function computeTotals({ lines, delivery, speed = "standard", gift, promo, withTax = false }: TotalsInput): Totals {
  const units = lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = round(lines.reduce((n, l) => n + l.unitPrice * l.qty, 0));
  const hasCustom = lines.some((l) => l.custom);
  const setup = hasCustom ? cfg.customSetupFee : 0;
  const groupLines = lines.filter((l) => l.group);
  const groupUnits = groupLines.reduce((n, l) => n + l.qty, 0);
  const groupSub = groupLines.reduce((n, l) => n + l.unitPrice * l.qty, 0);
  const groupDiscount = groupUnits >= cfg.minGroupQty ? groupSub * cfg.groupDiscountRate : 0;
  const promoDiscount = promo ? (subtotal - groupSub) * PROMO_RATE : 0;
  const discount = round(groupDiscount + promoDiscount);
  const shipping = delivery === "ship" && units > 0 ? cfg.shipping[speed] : 0;
  const taxable = Math.max(0, subtotal + setup - discount + shipping);
  const tax = withTax ? round(taxable * cfg.taxRate) : 0;
  const total = round(taxable + tax + gift);
  return { units, subtotal, setup, discount, shipping, gift, tax, total, hasCustom };
}
