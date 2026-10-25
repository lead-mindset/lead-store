"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { COLORS, getProduct, type Lang } from "@/lib/catalog";
import { storeConfig } from "@/lib/config";
import { DICTS, type Dict } from "@/lib/i18n";
import { LANG_COOKIE, THEME_KEY } from "@/lib/prefs";
import type { CartLine, Design, GroupOrder, Order, Profile } from "@/lib/types";

export type Theme = "light" | "dark";

/* ---------- Preferences: language + theme ---------- */

type Prefs = { lang: Lang; t: Dict; setLang: (l: Lang) => void; theme: Theme; setTheme: (t: Theme) => void };
const PrefsCtx = createContext<Prefs | null>(null);


/* ---------- Store ---------- */

export type StoreState = {
  cart: CartLine[];
  saved: CartLine[];
  wishlist: string[];
  designs: Design[];
  draft: Design | null;
  orders: Order[];
  lastOrder: string | null;
  group: GroupOrder | null;
  profile: Profile;
  delivery: "pickup" | "ship";
  gift: number;
  promo: string | null;
};

const emptyProfile: Profile = { first: "", last: "", email: "", chapter: "", size: "M", address: "", pickup: 0 };

const initialState: StoreState = {
  cart: [], saved: [], wishlist: [], designs: [], draft: null, orders: [], lastOrder: null, group: null,
  profile: emptyProfile, delivery: "pickup", gift: 0, promo: null,
};

const STORE_KEY = "lead-store-v1";

type Toast = { id: number; msg: string; href?: string; cta?: string };

type Store = {
  state: StoreState;
  ready: boolean;
  update: (fn: (s: StoreState) => StoreState) => void;
  addLine: (line: Omit<CartLine, "id">) => void;
  toggleWish: (slug: string) => void;
  reset: () => void;
  notify: (msg: string, href?: string, cta?: string) => void;
  cartCount: number;
};
const StoreCtx = createContext<Store | null>(null);

export const uid = () => Math.random().toString(36).slice(2, 10);

/** Same item and options: merge quantities instead of adding a new line. */
const sameLine = (a: Omit<CartLine, "id">, b: CartLine) =>
  !a.custom && !b.custom && a.slug === b.slug && a.color === b.color && a.size === b.size && !a.group && !b.group;

export function Providers({ children, initialLang }: { children: React.ReactNode; initialLang: Lang }) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [theme, setThemeState] = useState<Theme>("light");
  const [state, setState] = useState<StoreState>(initialState);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Sync with what the inline head script applied, then load persisted store.
    const current = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    let saved: StoreState | null = null;
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) saved = { ...initialState, ...JSON.parse(raw) };
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from browser-only storage
    setThemeState(current);
    if (saved) setState(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch {
      // Storage full (large uploaded artwork): keep the session working without persisting images.
      try {
        const strip = (l: CartLine) => ({ ...l, image: undefined });
        localStorage.setItem(STORE_KEY, JSON.stringify({ ...state, cart: state.cart.map(strip), saved: state.saved.map(strip),
          designs: state.designs.map((d) => ({ ...d, image: undefined })), draft: state.draft ? { ...state.draft, image: undefined } : null,
          orders: state.orders.map((o) => ({ ...o, lines: o.lines.map(strip) })) }));
      } catch {}
    }
  }, [state, ready]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    document.documentElement.lang = l;
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem(THEME_KEY, t); } catch {}
  }, []);

  const notify = useCallback((msg: string, href?: string, cta?: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), msg, href, cta });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const update = useCallback((fn: (s: StoreState) => StoreState) => setState(fn), []);

  const addLine = useCallback((line: Omit<CartLine, "id">) => {
    setState((s) => {
      const hit = s.cart.find((c) => sameLine(line, c));
      const cart = hit
        ? s.cart.map((c) => (c === hit ? { ...c, qty: Math.min(99, c.qty + line.qty) } : c))
        : [...s.cart, { ...line, id: uid() }];
      return { ...s, cart };
    });
  }, []);

  const toggleWish = useCallback((slug: string) => {
    setState((s) => ({ ...s, wishlist: s.wishlist.includes(slug) ? s.wishlist.filter((w) => w !== slug) : [...s.wishlist, slug] }));
  }, []);

  const reset = useCallback(() => setState(initialState), []);

  const prefs = useMemo<Prefs>(() => ({ lang, t: DICTS[lang], setLang, theme, setTheme }), [lang, setLang, theme, setTheme]);
  const cartCount = state.cart.reduce((n, l) => n + l.qty, 0);
  const store = useMemo<Store>(
    () => ({ state, ready, update, addLine, toggleWish, reset, notify, cartCount }),
    [state, ready, update, addLine, toggleWish, reset, notify, cartCount],
  );

  return (
    <PrefsCtx.Provider value={prefs}>
      <StoreCtx.Provider value={store}>
        {children}
        {toast && (
          <div className="toast" role="status" key={toast.id}>
            <span>{toast.msg}</span>
            {toast.href && <Link href={toast.href} onClick={() => setToast(null)}>{toast.cta}</Link>}
          </div>
        )}
      </StoreCtx.Provider>
    </PrefsCtx.Provider>
  );
}

export function usePrefs() {
  const v = useContext(PrefsCtx);
  if (!v) throw new Error("usePrefs outside Providers");
  return v;
}

export function useStore() {
  const v = useContext(StoreCtx);
  if (!v) throw new Error("useStore outside Providers");
  return v;
}

/* ---------- Formatting helpers bound to the current language ---------- */

export function useFormat() {
  const { lang, t } = usePrefs();
  return useMemo(() => {
    const nf = new Intl.NumberFormat(storeConfig.locale[lang], { style: "currency", currency: storeConfig.currency });
    const money = (n: number) => nf.format(n);
    const color = (id: keyof typeof COLORS) => COLORS[id].name[lang];
    const size = (s: string) => (s === "One size" ? t.common.oneSize : s);
    const lineName = (l: CartLine) => {
      const p = l.slug ? getProduct(l.slug) : undefined;
      return p ? p.name[lang] : t.common.customItem(t.kindShort[l.kind]);
    };
    const date = (iso: string) => {
      const dt = iso.length === 10 ? new Date(iso + "T12:00:00") : new Date(iso);
      return new Intl.DateTimeFormat(storeConfig.locale[lang], { month: "short", day: "numeric", year: "numeric" }).format(dt);
    };
    return { money, color, size, lineName, date };
  }, [lang, t]);
}
