import { Suspense } from "react";
import { OAuthSuccessScreen } from "@/components/screens/auth-screens";

export default function Page() {
  return (
    <Suspense>
      <OAuthSuccessScreen />
    </Suspense>
  );
}
