import { Suspense } from "react";
import { ResetPasswordScreen } from "@/components/screens/auth-screens";

export default function Page() {
  return (
    <Suspense>
      <ResetPasswordScreen />
    </Suspense>
  );
}
