import { Suspense } from "react";
import VerifyOtpForm from "./VerifyOtpForm";

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 24 }}>Loading…</p>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  );
}
