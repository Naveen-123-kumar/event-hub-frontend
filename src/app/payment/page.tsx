import { Suspense } from "react";
import { PaymentScreen } from "@/components/screens/checkout-screens";

export default function Page() {
  return (
    <Suspense>
      <PaymentScreen />
    </Suspense>
  );
}
