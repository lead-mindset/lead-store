import { CartView } from "@/components/views/CartView";
import { pageMeta } from "@/lib/server-lang";

export const generateMetadata = pageMeta((t) => t.cart.title);

export default function Page() {
  return <CartView />;
}
