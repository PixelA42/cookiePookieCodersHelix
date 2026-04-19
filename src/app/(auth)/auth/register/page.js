"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthCard from "@/components/layout/AuthCard";
import { Button, Field, Input, Select } from "@/components/ui/primitives";
import { authApi } from "@/lib/api/client";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    organization_name: "",
    email: "",
    password: "",
    role: "producer",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const update = (name, value) => setForm((current) => ({ ...current, [name]: value }));

  const onSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");

    try {
      await authApi.register({
        organization_name: form.organization_name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      });
      setMessage("Registration submitted. Check your email for the OTP code.");
      router.push(`/auth/verify-otp?email=${encodeURIComponent(form.email)}`);
    } catch (submissionError) {
      setError(submissionError.message || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard title="Create your HeatREco account" subtitle="Register as a producer or consumer, then verify your email to continue.">
      <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
        <Field label="Organization name">
          <Input
            value={form.organization_name}
            onChange={(event) => update("organization_name", event.target.value)}
            required
            minLength={2}
          />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required />
        </Field>
        <Field label="Password">
          <Input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} required />
        </Field>
        <Field label="Role">
          <Select value={form.role} onChange={(event) => update("role", event.target.value)}>
            <option value="producer">Producer</option>
            <option value="consumer">Consumer</option>
          </Select>
        </Field>
        {error ? <p style={{ margin: 0, color: "var(--bad)" }}>{error}</p> : null}
        {message ? <p style={{ margin: 0, color: "var(--good)" }}>{message}</p> : null}
        <Button type="submit" disabled={busy}>
          {busy ? "Creating account..." : "Continue to verification"}
        </Button>
      </form>
      <p style={{ marginBottom: 0, color: "var(--text-muted)" }}>
        Already have an account? <Link href="/auth/login">Log in</Link>
      </p>
    </AuthCard>
  );
}
