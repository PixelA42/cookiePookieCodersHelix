import { Suspense } from "react";
import VerifyOtpForm from "./VerifyOtpForm";

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="container" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "32px 0" }}>
          <p style={{ color: "var(--text-muted)" }}>Loading…</p>
        </div>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  );
}
