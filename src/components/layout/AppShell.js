"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Badge } from "@/components/ui/primitives";
import { clearToken } from "@/lib/auth";
import { getProfile } from "@/lib/profileStorage";

export default function AppShell({ children }) {
  const router = useRouter();
  const profile = typeof window === "undefined" ? null : getProfile();

  const onLogout = () => {
    clearToken();
    router.push("/auth/login");
  };

  return (
    <div>
      <header style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.9)", backdropFilter: "blur(10px)" }}>
        <div
          className="container"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, padding: "14px 0" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/dashboard" style={{ fontWeight: 700 }}>
              HeatREco
            </Link>
            {profile?.role ? <Badge tone="primary">{profile.role}</Badge> : null}
          </div>
          <nav style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/dashboard/map">Map</Link>
            <Link href="/onboarding">Onboarding</Link>
            <Link href="/profile">Profile</Link>
            <Button variant="ghost" onClick={onLogout}>
              Logout
            </Button>
          </nav>
        </div>
      </header>
      <main className="container" style={{ padding: "28px 0 40px" }}>
        {children}
      </main>
    </div>
  );
}
