import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductView } from "@/components/views/ProductView";
import { getProduct, PRODUCTS } from "@/lib/catalog";
import { getLang } from "@/lib/server-lang";

// Renders on demand with the visitor's language, like the root layout.
export const instant = false;

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const p = getProduct((await params).slug);
  if (!p) return {};
  const lang = await getLang();
  return { title: p.name[lang], description: p.desc[lang] };
}

export default async function Page({ params }: PageProps<"/product/[slug]">) {
  const p = getProduct((await params).slug);
  if (!p) notFound();
  return <ProductView key={p.slug} p={p} />;
}
