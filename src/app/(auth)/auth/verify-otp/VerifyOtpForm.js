"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import AuthCard from "@/components/layout/AuthCard";
import { Button, Field, Input } from "@/components/ui/primitives";
import { authApi } from "@/lib/api/client";
import { setAuthSession } from "@/lib/auth";

export default function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") || "";
  const initialEmail = useMemo(() => emailFromQuery, [emailFromQuery]);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const onVerify = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      const response = await authApi.verifyOtp({ email, otp });
      const token = response.access_token || response.token || "";
      setAuthSession({ token, user: response.user || { email } });
      router.push("/onboarding");
    } catch (submissionError) {
      setError(submissionError.message || "Verification failed");
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await authApi.resendOtp({ email });
      setMessage("A fresh OTP was sent to your inbox.");
    } catch (submissionError) {
      setError(submissionError.message || "Could not resend OTP");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Verify your email" subtitle="Enter the OTP code from your inbox to activate your HeatREco account.">
      <form onSubmit={onVerify} style={{ display: "grid", gap: 14 }}>
        <Field label="Email">
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </Field>
        <Field label="OTP code">
          <Input value={otp} onChange={(event) => setOtp(event.target.value)} required />
        </Field>
        {error ? <p style={{ margin: 0, color: "var(--bad)" }}>{error}</p> : null}
        {message ? <p style={{ margin: 0, color: "var(--good)" }}>{message}</p> : null}
        <Button type="submit" disabled={busy}>
          {busy ? "Verifying..." : "Verify and continue"}
        </Button>
        <Button type="button" variant="ghost" onClick={onResend} disabled={busy}>
          Resend OTP
        </Button>
      </form>
      <p style={{ marginBottom: 0, color: "var(--text-muted)" }}>
        Need a different account? <Link href="/auth/register">Register again</Link>
      </p>
    </AuthCard>
  );
}
