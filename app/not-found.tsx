"use client";

import Link from "next/link";
import { usePrefs } from "@/components/providers";

export default function NotFound() {
  const { t } = usePrefs();
  return (
    <div className="wrap page" style={{ alignItems: "center", textAlign: "center", paddingTop: 96, paddingBottom: 120 }}>
      <span className="overline" style={{ color: "var(--link)" }}>404</span>
      <h1 className="h1">{t.notFound.title}</h1>
      <p className="muted">{t.notFound.sub}</p>
      <Link className="btn btn-primary" href="/">{t.notFound.back}</Link>
    </div>
  );
}
