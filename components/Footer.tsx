"use client";

import Link from "next/link";
import { storeConfig } from "@/lib/config";
import { Icon } from "./Icon";
import { Logo } from "./Header";
import { usePrefs } from "./providers";

const isExternal = (href: string) => /^(https?:|mailto:)/.test(href);

// Layout follows the main LEAD site footer (brand + socials, link columns, bottom bar), plus the store's own columns.
export function Footer() {
  const { t } = usePrefs();
  const f = t.footer;
  const links = storeConfig.links;
  const socials = [
    { label: f.email, href: links.contactEmail, icon: "mail" },
    { label: "LinkedIn", href: links.linkedin, icon: "linkedin" },
    { label: "Instagram", href: links.instagram, icon: "instagram" },
  ];
  const cols: [string, [string, string][]][] = [
    [f.shop, [[f.all, "/shop"], [f.tees, "/shop?cat=tees"], [f.hoodies, "/shop?cat=hoodies"], [f.accessories, "/shop?cat=acc"], [f.designOwn, "/custom"], [f.groupOrders, "/group-order"]]],
    [f.help, [[f.faqs, "/faq"], [f.shipping, "/faq?topic=pickup"], [f.returns, "/faq?topic=returns"], [f.sizeGuide, "/product/lead-classic-tee#size-guide"], [f.track, "/account"]]],
    [f.quick, [[f.about, links.about], [f.getInvolved, links.getInvolved], [f.impact, "/impact"], [f.talent, links.talent]]],
    [f.connect, [[f.partner, links.partnerEmail], [f.contact, links.contactEmail]]],
  ];
  return (
    <footer className="site-footer">
      <div className="wrap footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <Logo inverse />
            <p>{f.blurb}</p>
            <span className="footer-tag">{f.tagline}</span>
            <div className="footer-social">
              {socials.map((so) => (
                <a key={so.href} href={so.href} aria-label={so.label} {...(so.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  <Icon name={so.icon} size={18} />
                </a>
              ))}
            </div>
          </div>
          <div className="footer-cols">
            {cols.map(([title, items]) => (
              <div key={title} className="footer-col">
                <strong>{title}</strong>
                {items.map(([label, href]) =>
                  isExternal(href) ? (
                    <a key={label} href={href}>{label}</a>
                  ) : (
                    <Link key={label} href={href}>{label}</Link>
                  ),
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="footer-bottom">
          <span>{f.rights}</span>
          <div>
            <Link href="/faq">{f.privacy}</Link>
            <Link href="/faq">{f.terms}</Link>
            <span>{f.builtFor}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
