import { Suspense } from "react";
import { ConfirmationScreen } from "@/components/screens/checkout-screens";
import { mockBookings } from "@/lib/mocks/data";

export function generateStaticParams() {
  return mockBookings.map((booking) => ({ id: booking._id }));
}

export default function Page() {
  return (
    <Suspense>
      <ConfirmationScreen />
    </Suspense>
  );
}
