import { Suspense } from "react";
import { VerifyEmailScreen } from "@/components/screens/auth-screens";

export default function Page() {
  return (
    <Suspense>
      <VerifyEmailScreen />
    </Suspense>
  );
}
