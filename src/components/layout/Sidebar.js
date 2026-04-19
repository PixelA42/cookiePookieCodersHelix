"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { Badge, Button } from "@/components/ui/primitives";
import { clearToken } from "@/lib/auth";
import { getProfile } from "@/lib/profileStorage";

function IconDashboard() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="5" rx="1.5" />
      <rect x="13" y="10" width="8" height="11" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function IconMap() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M6 20c0-4 3-6 6-6s6 2 6 6" strokeLinecap="round" />
    </svg>
  );
}

function IconConnections() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM16 22a3 3 0 100-6 3 3 0 000 6z" />
      <path d="M10 6l4 12" strokeLinecap="round" />
      <path d="M5.5 10.5l5 2M13.5 13.5l5 2" strokeLinecap="round" />
    </svg>
  );
}

function IconAccount() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="8" r="3" />
      <path d="M4 20c1.5-3.5 4.4-5 8-5s6.5 1.5 8 5" strokeLinecap="round" />
      <path d="M18.5 4.5l1.5 1.5M20 6l-1.5 1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconOut() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const profile = typeof window === "undefined" ? null : getProfile();
  const roleLabel = profile?.role === "producer" || profile?.role === "heat-source" ? "Producer" : "Consumer";

  const onLogout = () => {
    clearToken();
    router.push("/auth/login");
  };

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: IconDashboard },
    { href: "/profile", label: "My Facility", icon: IconUser },
    { href: "/dashboard/map", label: "Map View", icon: IconMap },
    { href: "/connections", label: "Connections", icon: IconConnections },
    { href: "/account", label: "Profile / Account", icon: IconAccount },
  ];

  return (
    <aside
      style={{
        width: 260,
        borderRight: "2px solid var(--border-strong)",
        background: "linear-gradient(180deg, var(--surface) 0%, var(--surface-soft) 100%)",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 20,
        boxShadow: "4px 0 0 rgba(19, 23, 34, 0.04)",
      }}
    >
      <div style={{ padding: "22px 16px", borderBottom: "1px solid var(--border)" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--radius-sharp)",
              background: "var(--primary)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: "-0.02em",
              boxShadow: "var(--shadow-brutal)",
            }}
          >
            H
          </div>
          <div>
            <strong style={{ color: "var(--text)", display: "block", fontSize: 15 }}>HeatREco</strong>
            {profile?.role && (
              <Badge tone="primary" style={{ marginTop: 4, display: "inline-block", fontSize: 10 }}>
                {roleLabel}
              </Badge>
            )}
          </div>
        </Link>
      </div>

      <nav style={{ flex: 1, padding: "14px 12px", display: "flex", flexDirection: "column", gap: 6 }} aria-label="Workspace">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                borderRadius: "var(--radius-sharp)",
                textDecoration: "none",
                border: isActive ? "2px solid var(--primary)" : "2px solid transparent",
                background: isActive ? "var(--primary-soft)" : "transparent",
                fontWeight: isActive ? 600 : 500,
                color: isActive ? "var(--primary-strong)" : "var(--text)",
                transition: "background 120ms ease, border-color 120ms ease",
              }}
            >
              <span style={{ display: "flex", opacity: isActive ? 1 : 0.85 }}>
                <Icon />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "14px 12px", borderTop: "1px solid var(--border)" }}>
        <Button
          variant="ghost"
          onClick={onLogout}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            justifyContent: "flex-start",
            borderRadius: "var(--radius-sharp)",
          }}
        >
          <IconOut />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
}
