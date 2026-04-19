"use client";

import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui/primitives";
import { getProfile } from "@/lib/profileStorage";

const JOURNEY = [
  {
    step: "01",
    title: "Profile intelligence",
    detail: "Keep producer or consumer profile data current so thermal compatibility and schedule matching stay accurate.",
  },
  {
    step: "02",
    title: "AI-ranked opportunities",
    detail: "Review top-scoring counterparts generated from distance, temperature fit, and operating overlap.",
  },
  {
    step: "03",
    title: "Feedback retraining",
    detail: "Mark recommendations useful or not useful so future rankings reflect real deployment outcomes.",
  },
];

export default function DashboardHomePage() {
  const profile = typeof window === "undefined" ? null : getProfile();
  const roleLabel = profile?.role === "producer" || profile?.role === "heat-source" ? "Producer" : "Consumer";

  return (
    <div className="workspace-page" style={{ maxWidth: 1120, gap: 24 }}>
      <section className="mesh-panel" style={{ minHeight: 280 }}>
        <div className="mesh-panel-inner" style={{ gap: 18 }}>
          <div className="eyebrow eyebrow-brutal" style={{ width: "fit-content" }}>
            Workspace home
          </div>
          <h1 className="hero-title" style={{ fontSize: "clamp(34px, 6vw, 72px)" }}>
            Build heat exchange
            <br />
            <span className="hero-title-accent">that actually ships.</span>
          </h1>
          <p className="hero-subcopy" style={{ maxWidth: 760 }}>
            This is your mission control between onboarding and live matchmaking. Use it to validate profile quality,
            run ranked matches, and move to map and connection workflows with less friction.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/dashboard">
              <Button shape="sharp">Open match dashboard</Button>
            </Link>
            <Link href="/dashboard/map">
              <Button variant="ghost" shape="sharp">Open map view</Button>
            </Link>
            <Link href="/connections">
              <Button variant="soft" shape="sharp">View connections</Button>
            </Link>
          </div>
        </div>
        <div className="floating-note" style={{ maxWidth: 260 }}>
          Active role: <strong>{roleLabel}</strong>
          {profile?.facilityName ? (
            <>
              <br />
              Facility: {profile.facilityName}
            </>
          ) : null}
        </div>
      </section>

      <section style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <Card variant="brutal" strong>
          <strong style={{ display: "block", marginBottom: 6 }}>Compatibility model</strong>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 14 }}>
            Scores are generated from profile data and ranked to prioritize practical heat-transfer partnerships.
          </p>
        </Card>
        <Card variant="brutal" strong>
          <strong style={{ display: "block", marginBottom: 6 }}>Versioned API</strong>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 14 }}>
            Frontend and backend communication is organized through /api/v1 for predictable integration.
          </p>
        </Card>
        <Card variant="brutal" strong>
          <strong style={{ display: "block", marginBottom: 6 }}>Cloud-ready data</strong>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 14 }}>
            PostgreSQL supports both local development and cloud production with aligned schema behavior.
          </p>
        </Card>
      </section>

      <section style={{ display: "grid", gap: 14 }}>
        <h2 className="section-title" style={{ marginBottom: 0 }}>Execution path</h2>
        <div style={{ display: "grid", gap: 12 }}>
          {JOURNEY.map((item) => (
            <div
              key={item.step}
              className="glass-row"
              style={{ borderRadius: 8, border: "2px solid var(--border-strong)", background: "rgba(255, 255, 255, 0.9)" }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <Badge tone="primary">{item.step}</Badge>
                  <strong>{item.title}</strong>
                </div>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 14 }}>{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
