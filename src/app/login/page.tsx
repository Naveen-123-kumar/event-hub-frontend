import { Suspense } from "react";
import { LoginScreen } from "@/components/screens/auth-screens";

export default function Page() {
  return (
    <Suspense>
      <LoginScreen />
    </Suspense>
  );
}
