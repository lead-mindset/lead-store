export type Lang = "en" | "es";
export type L10n = Record<Lang, string>;
export type Kind = "tee" | "hoodie" | "cap" | "tote" | "bottle" | "sticker";
export type Print = "logo" | "chest" | "values" | "custom" | "none";
export type ColorId = "navy" | "black" | "gray" | "white" | "natural";
export type Category = "tees" | "hoodies" | "hats" | "bags" | "acc";
export type Collection = "core" | "chapter" | "event" | "limited";

export const COLORS: Record<ColorId, { hex: string; name: L10n }> = {
  navy: { hex: "#1e2a4a", name: { en: "Navy", es: "Azul marino" } },
  black: { hex: "#16161a", name: { en: "Black", es: "Negro" } },
  gray: { hex: "#9ca3af", name: { en: "Heather gray", es: "Gris jaspeado" } },
  white: { hex: "#f8f8fa", name: { en: "White", es: "Blanco" } },
  natural: { hex: "#efe6d6", name: { en: "Natural", es: "Natural" } },
};
export const COLOR_IDS = Object.keys(COLORS) as ColorId[];

export const APPAREL_SIZES = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
export const ONE_SIZE = "One size";

export type Product = {
  slug: string;
  name: L10n;
  sub: L10n;
  desc: L10n;
  price: number;
  cat: Category;
  collection: Collection;
  kind: Kind;
  print: Print;
  colors: ColorId[];
  sizes: string[];
  soldOut?: string[];
  tag?: "popular" | "new";
  order: number;
  tags: string;
};

export const PRODUCTS: Product[] = [
  {
    slug: "lead-classic-tee",
    name: { en: "LEAD Classic Tee", es: "Camiseta LEAD Clásica" },
    sub: { en: "Unisex cotton tee", es: "Camiseta unisex de algodón" },
    desc: {
      en: "Our signature tee with the LEAD mark on the front. Made for class, events and chapter days.",
      es: "Nuestra camiseta insignia con el logo de LEAD al frente. Hecha para clases, eventos y días de capítulo.",
    },
    price: 12, cat: "tees", collection: "core", kind: "tee", print: "logo",
    colors: ["navy", "black", "gray"], sizes: APPAREL_SIZES, soldOut: ["3XL"], tag: "popular", order: 1,
    tags: "tee shirt t-shirt classic navy camiseta clasica playera",
  },
  {
    slug: "lead-hoodie",
    name: { en: "LEAD Hoodie", es: "Hoodie LEAD" },
    sub: { en: "Fleece pullover", es: "Sudadera de felpa con capucha" },
    desc: {
      en: "A warm fleece pullover with a small LEAD mark on the chest. Built for early classes and late study nights.",
      es: "Sudadera cálida de felpa con el logo de LEAD en el pecho. Para clases temprano y noches de estudio.",
    },
    price: 25, cat: "hoodies", collection: "core", kind: "hoodie", print: "chest",
    colors: ["black", "gray", "white"], sizes: APPAREL_SIZES.slice(0, 6), order: 2,
    tags: "hoodie sweatshirt black sudadera buzo capucha",
  },
  {
    slug: "lead-minimal-tee",
    name: { en: "LEAD Minimal Tee", es: "Camiseta LEAD Minimal" },
    sub: { en: "Small chest logo", es: "Logo pequeño en el pecho" },
    desc: {
      en: "A clean everyday tee with a small LEAD mark on the chest.",
      es: "Una camiseta limpia para todos los días con un pequeño logo de LEAD en el pecho.",
    },
    price: 12, cat: "tees", collection: "core", kind: "tee", print: "chest",
    colors: ["white", "black", "gray"], sizes: APPAREL_SIZES, order: 3,
    tags: "tee shirt t-shirt minimal white camiseta blanca playera",
  },
  {
    slug: "lead-values-tee",
    name: { en: "LEAD Values Tee", es: "Camiseta LEAD Valores" },
    sub: { en: "Mindset, excellence, purpose, impact", es: "Mentalidad, excelencia, propósito, impacto" },
    desc: {
      en: "Wear what LEAD stands for: mindset, excellence, purpose and impact.",
      es: "Lleva puesto lo que LEAD representa: mentalidad, excelencia, propósito e impacto.",
    },
    price: 14, cat: "tees", collection: "limited", kind: "tee", print: "values",
    colors: ["black", "gray", "white"], sizes: APPAREL_SIZES, tag: "new", order: 4,
    tags: "tee shirt t-shirt values black camiseta valores negra playera",
  },
  {
    slug: "lead-cap",
    name: { en: "LEAD Cap", es: "Gorra LEAD" },
    sub: { en: "Adjustable strap", es: "Correa ajustable" },
    desc: {
      en: "A structured cap with the LEAD mark and an adjustable strap. Pairs with the Classic Tee.",
      es: "Gorra estructurada con el logo de LEAD y correa ajustable. Combina con la Camiseta Clásica.",
    },
    price: 18, cat: "hats", collection: "core", kind: "cap", print: "logo",
    colors: ["navy", "black", "gray"], sizes: [ONE_SIZE], order: 5,
    tags: "cap hat navy gorra sombrero",
  },
  {
    slug: "lead-tote-bag",
    name: { en: "LEAD Tote Bag", es: "Bolsa Tote LEAD" },
    sub: { en: "Heavy canvas", es: "Lona resistente" },
    desc: {
      en: "A heavy canvas tote for books, laptops and event swag.",
      es: "Una bolsa de lona resistente para libros, laptop y regalos de eventos.",
    },
    price: 15, cat: "bags", collection: "event", kind: "tote", print: "logo",
    colors: ["natural", "black", "gray"], sizes: [ONE_SIZE], order: 6,
    tags: "tote bag bolsa tote",
  },
  {
    slug: "lead-water-bottle",
    name: { en: "LEAD Water Bottle", es: "Botella LEAD" },
    sub: { en: "Insulated steel", es: "Acero aislado térmico" },
    desc: {
      en: "An insulated steel bottle that keeps drinks cold through a full event day.",
      es: "Botella de acero aislada que mantiene tus bebidas frías durante todo un día de evento.",
    },
    price: 20, cat: "acc", collection: "event", kind: "bottle", print: "logo",
    colors: ["white", "navy"], sizes: [ONE_SIZE], order: 7,
    tags: "bottle water accessories botella agua accesorios",
  },
  {
    slug: "lead-sticker-pack",
    name: { en: "LEAD Sticker Pack", es: "Stickers LEAD" },
    sub: { en: "Laptop stickers", es: "Stickers para laptop" },
    desc: {
      en: "A pack of LEAD stickers for your laptop, bottle or notebook.",
      es: "Un paquete de stickers de LEAD para tu laptop, botella o cuaderno.",
    },
    price: 5, cat: "acc", collection: "core", kind: "sticker", print: "logo",
    colors: ["white"], sizes: [ONE_SIZE], order: 8,
    tags: "sticker stickers accessories laptop calcomania accesorios",
  },
];

export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);

/** Base prices for custom items in the design studio. */
export const CUSTOM_KINDS: { kind: Kind; price: number }[] = [
  { kind: "tee", price: 12 },
  { kind: "hoodie", price: 25 },
  { kind: "tote", price: 15 },
  { kind: "cap", price: 18 },
];

export const CHAPTERS = [
  { id: "dallas", name: "LEAD Dallas", place: { en: "Texas, United States", es: "Texas, Estados Unidos" }, region: "us" },
  { id: "colombia", name: "LEAD Colombia", place: { en: "Bogotá, Colombia", es: "Bogotá, Colombia" }, region: "latam" },
  { id: "peru", name: "LEAD Peru", place: { en: "Peru", es: "Perú" }, region: "latam" },
  { id: "chile", name: "LEAD Chile", place: { en: "Chile", es: "Chile" }, region: "latam" },
] as const;
