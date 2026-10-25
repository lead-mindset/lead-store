import type { ColorId, Kind, Print } from "./catalog";

export type Mark = "logo" | "values" | "none";

export type CartLine = {
  id: string;
  /** Catalog product slug. Absent for custom items. */
  slug?: string;
  kind: Kind;
  color: ColorId;
  size: string;
  qty: number;
  unitPrice: number;
  print: Print;
  custom?: boolean;
  /** Part of a chapter group order (group pricing applies). */
  group?: boolean;
  text?: string;
  image?: string;
  mark?: Mark;
};

export type Design = {
  id: string;
  template: string;
  kind: Kind;
  color: ColorId;
  text: string;
  mark: Mark;
  image?: string;
  updatedAt: string;
};

export type Order = {
  id: string;
  num: string;
  date: string;
  lines: CartLine[];
  total: number;
  method: "pickup" | "ship";
  spot?: string;
  city?: string;
  firstName: string;
  email: string;
};

export type MemberStatus = "paid" | "pending" | "waiting";
export type Member = { id: string; name: string; size: string; qty: number; status: MemberStatus; date?: string };

export type GroupOrder = {
  name: string;
  uni: string;
  org: string;
  deadline: string;
  del: "pickup" | "one" | "each";
  pay: "each" | "chapter";
  members: Member[];
  reminded: boolean;
  code: string;
};

export type Profile = {
  first: string;
  last: string;
  email: string;
  chapter: string;
  size: string;
  address: string;
  pickup: number;
};

/** What checkout sends to /api/order. Prices are recomputed on the server from the catalog. */
export type OrderRequest = {
  num: string;
  lang: "en" | "es";
  customer: { first: string; last: string; email: string; phone?: string; chapter?: string };
  delivery: {
    method: "pickup" | "ship";
    speed: "standard" | "express";
    spot?: "event" | "chapter" | "office";
    street?: string; apt?: string; city?: string; state?: string; zip?: string; country?: string;
  };
  pay: string;
  promo: string | null;
  gift: number;
  notes?: string;
  lines: Omit<CartLine, "id" | "unitPrice">[];
  /** Uploaded artwork was too large to send; the supplier must ask the customer for it. */
  imagesOmitted?: boolean;
};
