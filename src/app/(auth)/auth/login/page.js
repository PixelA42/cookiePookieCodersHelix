"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthCard from "@/components/layout/AuthCard";
import { Button, Field, Input } from "@/components/ui/primitives";
import { authApi } from "@/lib/api/client";
import { setAuthSession } from "@/lib/auth";
import { getProfile } from "@/lib/profileStorage";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await authApi.login(form);
      setAuthSession({
        token: response.access_token || response.token || "",
        user: response.user || { email: form.email },
      });
      router.push(getProfile() ? "/dashboard" : "/onboarding");
    } catch (submissionError) {
      setError(submissionError.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Log in to HeatREco" subtitle="Resume your matchmaking workspace and continue reviewing heat exchange opportunities.">
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
        </Field>
        <Field label="Password">
          <Input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} required />
        </Field>
        {error ? <p style={{ margin: 0, color: "var(--bad)" }}>{error}</p> : null}
        <Button type="submit" disabled={busy}>
          {busy ? "Signing in..." : "Login"}
        </Button>
      </form>
      <p style={{ marginBottom: 0, color: "var(--text-muted)" }}>
        New here? <Link href="/auth/register">Create an account</Link>
      </p>
    </AuthCard>
  );
}
