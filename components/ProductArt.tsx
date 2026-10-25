"use client";

import { useId } from "react";
import type { Kind, Print } from "@/lib/catalog";
import type { Mark } from "@/lib/types";
import { usePrefs } from "./providers";

type Props = {
  kind: Kind;
  fill: string;
  print?: Print;
  text?: string;
  image?: string;
  mark?: Mark;
  /** Decorative when a nearby label already names the product. */
  decorative?: boolean;
};

const MARK = "M-26 6 C-38 -12 -14 -24 -2 -6 C8 10 30 2 22 -14 C16 -26 -2 -18 4 -4 C10 12 -14 22 -26 6 Z";

function luminance(hex: string) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
}

const CENTER: Record<Kind, string> = {
  tee: "translate(100 104) scale(1.05)", hoodie: "translate(100 112) scale(0.95)", cap: "translate(100 94) scale(0.62)",
  tote: "translate(100 128) scale(1)", bottle: "translate(100 112) scale(0.55)", sticker: "translate(100 96) scale(1.35)",
};

export function ProductArt({ kind, fill, print = "logo", text = "", image, mark = "logo", decorative }: Props) {
  const { t } = usePrefs();
  const gid = useId().replace(/:/g, "");
  const light = luminance(fill) > 0.6;
  const ink = light ? "#1e2a4a" : "#ffffff";
  const apparel = kind === "tee" || kind === "hoodie";
  const chest = kind === "tee" ? "translate(124 76) scale(0.38)" : kind === "hoodie" ? "translate(124 82) scale(0.36)" : CENTER[kind];
  const upper = text.toUpperCase();
  const customSize = upper.length > 14 ? 13 : upper.length > 10 ? 15 : upper.length > 7 ? 19 : 24;
  const hasImg = print === "custom" && !!image;
  const customY = (kind === "cap" ? 100 : kind === "tote" ? 116 : 96) + (hasImg ? 34 : 0);
  const markT = kind === "cap" ? "translate(100 112) scale(0.3)" : kind === "tote" ? "translate(100 140) scale(0.5)" : `translate(100 ${124 + (hasImg ? 22 : 0)}) scale(0.5)`;
  const img = kind === "tee" || kind === "hoodie" ? { x: 70, y: 62, w: 60, h: 56 } : kind === "tote" ? { x: 70, y: 84, w: 60, h: 46 } : { x: 80, y: 70, w: 40, h: 34 };
  const showValues = print === "values" && apparel;
  const showLogo = print === "logo" || (print === "values" && !apparel);

  const logo = (transform: string) => (
    <g transform={transform}>
      <path d={MARK} fill="none" stroke={`url(#${gid})`} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <text x="0" y="34" textAnchor="middle" fontFamily="var(--font-montserrat), Montserrat, sans-serif" fontWeight="800" fontSize="20" letterSpacing="5" fill={ink}>LEAD</text>
    </g>
  );

  return (
    <svg
      viewBox="0 0 200 200"
      style={{ width: "100%", height: "100%", display: "block" }}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": t.mockup(t.kinds[kind]) })}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dd3029" />
          <stop offset="1" stopColor="#931ea2" />
        </linearGradient>
      </defs>
      {kind === "tee" && (
        <g>
          <path d="M70 30 L48 36 L18 62 L34 88 L50 78 L50 176 L150 176 L150 78 L166 88 L182 62 L152 36 L130 30 C125 42 115 48 100 48 C85 48 75 42 70 30 Z" fill={fill} stroke="rgba(0,0,0,.16)" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M70 30 C75 42 85 48 100 48 C115 48 125 42 130 30" fill="none" stroke="rgba(0,0,0,.22)" strokeWidth="3" />
        </g>
      )}
      {kind === "hoodie" && (
        <g>
          <path d="M66 36 L42 46 L18 124 L36 130 L50 88 L50 180 L150 180 L150 88 L164 130 L182 124 L158 46 L134 36 C130 20 116 12 100 12 C84 12 70 20 66 36 Z" fill={fill} stroke="rgba(0,0,0,.16)" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M76 40 C80 54 90 60 100 60 C110 60 120 54 124 40" fill="none" stroke="rgba(0,0,0,.25)" strokeWidth="3" />
          <path d="M72 140 L128 140 L134 166 L66 166 Z" fill="none" stroke="rgba(0,0,0,.2)" strokeWidth="2" />
          <path d="M94 60 L92 84 M106 60 L108 84" stroke="rgba(255,255,255,.5)" strokeWidth="2" />
        </g>
      )}
      {kind === "cap" && (
        <g>
          <path d="M40 122 C40 74 68 52 100 52 C132 52 160 74 160 122 Z" fill={fill} stroke="rgba(0,0,0,.16)" strokeWidth="1.5" />
          <path d="M36 120 Q110 140 186 126 Q192 140 176 146 Q104 156 36 132 Z" fill={fill} stroke="rgba(0,0,0,.25)" strokeWidth="1.5" />
          <path d="M100 52 L100 122" stroke="rgba(0,0,0,.12)" strokeWidth="1.5" />
          <circle cx="100" cy="52" r="5" fill={fill} stroke="rgba(0,0,0,.25)" />
        </g>
      )}
      {kind === "tote" && (
        <g>
          <path d="M76 72 C76 28 124 28 124 72" fill="none" stroke={fill} strokeWidth="8" />
          <path d="M76 72 C76 28 124 28 124 72" fill="none" stroke="rgba(0,0,0,.18)" strokeWidth="1" />
          <path d="M44 72 L156 72 L162 182 L38 182 Z" fill={fill} stroke="rgba(0,0,0,.16)" strokeWidth="1.5" strokeLinejoin="round" />
        </g>
      )}
      {kind === "bottle" && (
        <g>
          <rect x="86" y="20" width="28" height="22" rx="4" fill="#1e2a4a" />
          <rect x="78" y="40" width="44" height="144" rx="16" fill={fill} stroke="rgba(0,0,0,.18)" strokeWidth="1.5" />
        </g>
      )}
      {kind === "sticker" && (
        <g>
          <circle cx="100" cy="100" r="76" fill={fill} stroke="rgba(0,0,0,.12)" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="68" fill="none" stroke="rgba(0,0,0,.08)" strokeWidth="1.5" strokeDasharray="4 4" />
        </g>
      )}

      {showLogo && logo(CENTER[kind])}
      {print === "chest" && logo(chest)}
      {showValues && (
        <g fontFamily="var(--font-montserrat), Montserrat, sans-serif" fontWeight="800" fontSize="11" fill={ink}>
          <text x="70" y="78">MINDSET</text>
          <text x="70" y="92">EXCELLENCE</text>
          <text x="70" y="106">PURPOSE</text>
          <text x="70" y="120">IMPACT</text>
          <text x="70" y="134" fontSize="8" letterSpacing="2" fill="#dd3029">LEAD</text>
        </g>
      )}
      {print === "custom" && (
        <g>
          {hasImg && <image href={image} x={img.x} y={img.y} width={img.w} height={img.h} preserveAspectRatio="xMidYMid meet" />}
          {upper && (
            <text x="100" y={customY} textAnchor="middle" fontFamily="var(--font-montserrat), Montserrat, sans-serif" fontWeight="900" fontSize={customSize} fill={ink} stroke={light ? "none" : "rgba(0,0,0,.2)"} strokeWidth="0.6">
              {upper}
            </text>
          )}
          {mark === "logo" && logo(markT)}
          {mark === "values" && (
            <text x="100" y={customY + 22} textAnchor="middle" fontFamily="var(--font-montserrat), Montserrat, sans-serif" fontWeight="800" fontSize="5.5" letterSpacing="1" fill={ink}>
              MINDSET · EXCELLENCE · PURPOSE · IMPACT
            </text>
          )}
        </g>
      )}
    </svg>
  );
}
