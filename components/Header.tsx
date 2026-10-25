"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { storeConfig } from "@/lib/config";
import { Icon } from "./Icon";
import { usePrefs, useStore } from "./providers";

const LINKS = [
  ["home", "/"],
  ["shop", "/shop"],
  ["custom", "/custom"],
  ["group", "/group-order"],
  ["impact", "/impact"],
  ["faq", "/faq"],
] as const;

function isActive(path: string, href: string) {
  if (href === "/") return path === "/";
  if (href === "/shop") return path.startsWith("/shop") || path.startsWith("/product");
  return path.startsWith(href);
}

// Social links shown in the header, same as the main LEAD site.
export const SOCIALS = [
  { label: "Instagram", href: storeConfig.links.instagram, icon: "instagram" },
  { label: "LinkedIn", href: storeConfig.links.linkedin, icon: "linkedin" },
] as const;

/** LEAD mark + wordmark from the main site, with the STORE tag. */
export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" className="logo" style={{ color: inverse ? "#fff" : undefined }}>
      <Image src="/brand/lead-mark.svg" alt="" width={40} height={22} className="logo-mark" loading="eager" />
      <span className="logo-words">
        <strong>LEAD</strong>
        <span>STORE</span>
      </span>
    </Link>
  );
}

export function Header() {
  const { t, lang, setLang, theme, setTheme } = usePrefs();
  const { cartCount, ready } = useStore();
  const path = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile menu whenever the route changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- reacting to navigation
  useEffect(() => setOpen(false), [path]);

  const dark = theme === "dark";
  const count = ready ? cartCount : 0;

  return (
    <header className="site-header">
      <div className="topbar">
        <div className="wrap topbar-inner">
          <span className="topbar-msg">{t.topbar}</span>
          <div className="topbar-controls">
            <a href={storeConfig.links.site} className="topbar-site hide-sm">
              {t.footer.mainSite} <Icon name="external" size={14} />
            </a>
            <div role="group" aria-label={t.header.language} className="lang-toggle">
              <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")} lang="en">EN</button>
              <button type="button" aria-pressed={lang === "es"} onClick={() => setLang("es")} lang="es">ES</button>
            </div>
          </div>
        </div>
      </div>
      <div className="navbar">
        <nav aria-label={t.header.main} className="wrap navbar-inner">
          <Logo />
          <div className="nav-links">
            {LINKS.map(([id, href]) => (
              <Link key={id} href={href} aria-current={isActive(path, href) ? "page" : undefined}>{t.nav[id]}</Link>
            ))}
          </div>
          <div className="nav-icons">
            <div className="nav-social" role="group" aria-label={t.header.social}>
              {SOCIALS.map((so) => (
                <a key={so.label} href={so.href} target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label={so.label}>
                  <Icon name={so.icon} size={18} />
                </a>
              ))}
            </div>
            <button type="button" className="icon-btn" onClick={() => setTheme(dark ? "light" : "dark")} aria-label={dark ? t.header.toLight : t.header.toDark} title={dark ? t.header.toLight : t.header.toDark}>
              <Icon name={dark ? "sun" : "moon"} size={22} />
            </button>
            <Link href="/search" className="icon-btn" aria-label={t.header.search}><Icon name="search" size={22} /></Link>
            <Link href="/account" className="icon-btn hide-xs" aria-label={t.header.account}><Icon name="user" size={22} /></Link>
            <Link href="/cart" className="icon-btn" aria-label={t.header.cart(count)}>
              <Icon name="cart" size={22} />
              {count > 0 && <span className="cart-badge">{count}</span>}
            </Link>
            <button type="button" className="icon-btn menu-btn" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? t.header.closeMenu : t.header.menu} onClick={() => setOpen(!open)}>
              <Icon name={open ? "x" : "menu"} size={24} />
            </button>
          </div>
        </nav>
        {open && (
          <div id="mobile-menu" className="mobile-menu">
            <div className="wrap">
              {LINKS.map(([id, href]) => (
                <Link key={id} href={href} aria-current={isActive(path, href) ? "page" : undefined}>{t.nav[id]}</Link>
              ))}
              <Link href="/account" aria-current={path.startsWith("/account") ? "page" : undefined}>{t.header.account}</Link>
              <div className="mobile-menu-lead">
                <a href={storeConfig.links.about}>{t.footer.about}</a>
                <a href={storeConfig.links.getInvolved}>{t.footer.getInvolved}</a>
                <div className="row" style={{ gap: 4 }}>
                  {SOCIALS.map((so) => (
                    <a key={so.label} href={so.href} target="_blank" rel="noopener noreferrer" className="icon-btn" aria-label={so.label}>
                      <Icon name={so.icon} size={20} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
