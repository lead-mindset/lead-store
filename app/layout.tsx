import type { Metadata, Viewport } from "next";
import { Geist, Montserrat } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Providers } from "@/components/providers";
import { DICTS } from "@/lib/i18n";
import { THEME_KEY } from "@/lib/prefs";
import { getLang } from "@/lib/server-lang";
import "./globals.css";
import "./chrome.css";
import "./pages.css";

// The layout reads the language cookie per request, so routes render on demand rather than from a static shell.
export const instant = false;

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"], weight: ["600", "700", "800", "900"] });

export async function generateMetadata(): Promise<Metadata> {
  const t = DICTS[await getLang()];
  return { title: { default: t.meta.title, template: "%s · LEAD Store" }, description: t.meta.description };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#030c40" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1240" },
  ],
};

// Applies the saved or system theme before first paint to avoid a flash.
const themeScript = `(function(){try{var t=localStorage.getItem('${THEME_KEY}');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}})()`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const lang = await getLang();
  return (
    <html lang={lang} className={`${geist.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers initialLang={lang}>
          <Header />
          <main id="main">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
