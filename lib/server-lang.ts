import "server-only";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import type { Lang } from "./catalog";
import { DICTS, type Dict } from "./i18n";
import { LANG_COOKIE } from "./prefs";

/** Saved language cookie, else the browser's Accept-Language. */
export async function getLang(): Promise<Lang> {
  const saved = (await cookies()).get(LANG_COOKIE)?.value;
  if (saved === "en" || saved === "es") return saved;
  const accept = (await headers()).get("accept-language") ?? "";
  return accept.toLowerCase().startsWith("es") ? "es" : "en";
}

/** Builds a page's metadata from the dictionary in the visitor's language. */
export function pageMeta(pick: (t: Dict) => string) {
  return async (): Promise<Metadata> => ({ title: pick(DICTS[await getLang()]) });
}
