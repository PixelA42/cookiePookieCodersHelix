"use client";

import Link from "next/link";
import { Badge, Button, Divider } from "@/components/ui/primitives";
import { getProfile } from "@/lib/profileStorage";

export default function DashboardHome() {
  const profile = typeof window === "undefined" ? null : getProfile();
  const isHeatSource = profile?.role === "heat-source";

  if (!profile) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 600,
          textAlign: "center",
          color: "var(--text-muted)",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "var(--radius-sharp)",
            background: "var(--primary-soft)",
            border: "2px solid var(--primary)",
            display: "grid",
            placeItems: "center",
            fontWeight: 800,
            color: "var(--primary)",
            marginBottom: 16,
          }}
        >
          H
        </div>
        <h2 style={{ margin: 0, color: "var(--text)", marginBottom: 8 }}>Welcome to HeatREco</h2>
        <p style={{ margin: 0, maxWidth: 400, marginBottom: 20 }}>
          Let&apos;s set up your facility profile so we can find the best industrial waste heat recovery partnerships for you.
        </p>
        <Link href="/onboarding">
          <Button>Get started</Button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 32 }}>
      {/* Greeting header */}
      <div>
        <div
          className="eyebrow"
          style={{ marginBottom: 12, color: "var(--primary)", borderLeft: "3px solid var(--primary)", paddingLeft: 10 }}
        >
          Welcome back
        </div>
        <h1 style={{ margin: 0, fontSize: "clamp(28px, 6vw, 40px)", lineHeight: 1.1, marginBottom: 8 }}>
          {isHeatSource ? "Waste heat source" : "Heat recovery site"}
        </h1>
        <p style={{ marginBottom: 0, color: "var(--text-muted)", maxWidth: 700, fontSize: 15 }}>
          {profile.facilityName} • {profile.location}
        </p>
      </div>

      <Divider />

      {/* Quick stats */}
      <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
        <div
          style={{
            padding: "20px",
            borderRadius: 12,
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
            {isHeatSource ? "Waste Heat Temp" : "Recovery Target"}
          </p>
          <strong style={{ fontSize: 20, display: "block", marginTop: 8 }}>
            {isHeatSource ? profile.wasteHeatTemp : profile.requiredTemp}°C
          </strong>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 12 }}>
            {isHeatSource ? profile.recoveryCapacity : profile.demandVolume} kW
          </p>
        </div>

        <div
          style={{
            padding: "20px",
            borderRadius: 12,
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
            Operating Schedule
          </p>
          <strong style={{ fontSize: 20, display: "block", marginTop: 8 }}>
            {profile.operatingSchedule ? profile.operatingSchedule.split(" ")[0] : "Not set"}
          </strong>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 12 }}>
            {profile.operatingSchedule ? "Active" : "Configure in profile"}
          </p>
        </div>

        <div
          style={{
            padding: "20px",
            borderRadius: 12,
            background: "var(--surface)",
            border: "1px solid var(--border)",
          }}
        >
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
            Facility Status
          </p>
          <Badge tone="good" style={{ marginTop: 8, display: "inline-block" }}>
            ✓ Profile active
          </Badge>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 12 }}>
            Ready for matching
          </p>
        </div>
      </div>

      <Divider />

      {/* Next steps */}
      <div>
        <h2 style={{ margin: 0, marginBottom: 16, fontSize: 18, fontWeight: 600 }}>Next steps</h2>
        <div style={{ display: "grid", gap: 12 }}>
          <div
            style={{
              padding: "16px",
              borderRadius: 12,
              background: "var(--primary-soft)",
              border: "1px solid var(--primary)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <strong style={{ display: "block", marginBottom: 2 }}>View matched facilities</strong>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
                See which {isHeatSource ? "heat recovery sites" : "heat sources"} match your facility and review compatibility scores.
              </p>
            </div>
            <Link href="/dashboard">
              <Button>View matches</Button>
            </Link>
          </div>

          <div
            style={{
              padding: "16px",
              borderRadius: 12,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <strong style={{ display: "block", marginBottom: 2 }}>Explore on map</strong>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
                Visualize partnership opportunities by geographic proximity and pipe distance feasibility.
              </p>
            </div>
            <Link href="/dashboard/map">
              <Button variant="ghost">View map</Button>
            </Link>
          </div>

          <div
            style={{
              padding: "16px",
              borderRadius: 12,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <strong style={{ display: "block", marginBottom: 2 }}>Update your profile</strong>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>
                Keep facility details current so we can refresh match quality and seasonal relevance.
              </p>
            </div>
            <Link href="/profile">
              <Button variant="ghost">Edit profile</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div
        style={{
          padding: "24px",
          borderRadius: 12,
          background: "linear-gradient(135deg, rgba(47,97,255,0.05), rgba(255,255,255,0.5))",
          border: "1px solid var(--border)",
        }}
      >
        <h3 style={{ margin: 0, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>How matching works</h3>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.06em",
                color: "var(--primary)",
                marginBottom: 8,
              }}
            >
              01
            </div>
            <strong style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Proximity-aware</strong>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
              Prioritizes feasible pipe distances for practical heat transfer delivery.
            </p>
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.06em",
                color: "var(--primary)",
                marginBottom: 8,
              }}
            >
              02
            </div>
            <strong style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Temperature fit</strong>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
              Matches waste heat output to recovery demand, minimizing conversion losses.
            </p>
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.06em",
                color: "var(--primary)",
                marginBottom: 8,
              }}
            >
              03
            </div>
            <strong style={{ display: "block", marginBottom: 4, fontSize: 13 }}>Schedule overlap</strong>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
              Ensures operating windows align for stable, continuous energy exchange.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
