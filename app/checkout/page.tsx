import { CheckoutView } from "@/components/views/CheckoutView";
import { pageMeta } from "@/lib/server-lang";

export const generateMetadata = pageMeta((t) => t.checkout.title);

export default function Page() {
  return <CheckoutView />;
}
