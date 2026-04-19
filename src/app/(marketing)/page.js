import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui/primitives";
import FeatureCarousel from "@/components/marketing/FeatureCarousel";
import MarqueeStrip from "@/components/marketing/MarqueeStrip";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export default function MarketingPage() {
  return (
    <div style={{ display: "grid", gap: 0 }}>
      <section style={{ paddingBottom: 28 }}>
        <div className="eyebrow eyebrow-brutal" style={{ marginBottom: 16 }}>
          Industrial heat matching
        </div>
        <div
          style={{
            display: "grid",
            gap: 28,
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 18 }}>
            <h1 style={{ margin: 0, fontSize: "clamp(40px, 7vw, 76px)", lineHeight: 0.95, letterSpacing: "-0.03em" }}>
              Waste heat,
              <br />
              <span style={{ color: "var(--accent-heat)" }}>matched.</span>
            </h1>
            <p style={{ color: "var(--text-muted)", maxWidth: 560, fontSize: 18, margin: 0, lineHeight: 1.6 }}>
              Connect producers with surplus heat to nearby consumers who need it—greenhouses, cold storage, district
              heating. HeatREco ranks partnerships by distance, temperature fit, and schedule overlap so recoverable
              thermal energy stops evaporating unused.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/auth/register">
                <Button shape="sharp">Start matching</Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="ghost" shape="sharp">
                  Open workspace
                </Button>
              </Link>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Badge tone="primary" shape="tag">
                Proximity-aware
              </Badge>
              <Badge tone="good" shape="tag">
                Temperature fit
              </Badge>
              <Badge tone="neutral" shape="tag">
                Schedule overlap
              </Badge>
            </div>
          </div>

          <Card variant="brutal" strong style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
              <strong>Compatibility snapshot</strong>
              <Badge tone="good">92/100</Badge>
            </div>
            <div className="grid-auto" style={{ marginTop: 16 }}>
              <div style={{ padding: 14, border: "2px solid var(--border)", borderRadius: "var(--radius-sharp)", background: "var(--surface-soft)" }}>
                <strong>Waste heat source</strong>
                <p style={{ margin: "8px 0 0", color: "var(--text-muted)", fontSize: 14 }}>Food processing · 82°C output</p>
              </div>
              <div style={{ padding: 14, border: "2px solid var(--border)", borderRadius: "var(--radius-sharp)", background: "var(--surface-soft)" }}>
                <strong>Recovery site</strong>
                <p style={{ margin: "8px 0 0", color: "var(--text-muted)", fontSize: 14 }}>Greenhouse · 71°C demand</p>
              </div>
            </div>
            <div
              style={{
                marginTop: 16,
                padding: 14,
                border: "2px dashed var(--border-strong)",
                borderRadius: "var(--radius-sharp)",
              }}
            >
              <strong>Why this pairing works</strong>
              <p style={{ margin: "8px 0 0", color: "var(--text-muted)", fontSize: 14 }}>
                Short pipe distance, strong temperature overlap, steady weekday schedules.
              </p>
            </div>
          </Card>
        </div>
      </section>

      <MarqueeStrip />

      <section style={{ padding: "48px 0 32px" }}>
        <h2 className="section-title">What makes a viable match</h2>
        <p className="section-copy" style={{ maxWidth: 640, marginBottom: 24 }}>
          Scroll the highlights or use arrow keys when focused — same signals the workspace uses to rank partners.
        </p>
        <FeatureCarousel />
      </section>

      <section className="band-accent" style={{ margin: "0 -8px", padding: "36px 24px", borderRadius: "var(--radius-sharp)" }}>
        <h2 className="section-title">Why it works</h2>
        <div className="grid-auto" style={{ marginTop: 20 }}>
          <Card variant="brutal" style={{ background: "var(--surface)" }}>
            <h3 style={{ marginTop: 0 }}>Proximity aware</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: 0 }}>Prioritizes feasible pipe distances for practical delivery.</p>
          </Card>
          <Card variant="brutal" style={{ background: "var(--surface)" }}>
            <h3 style={{ marginTop: 0 }}>Thermal compatibility</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: 0 }}>Aligns temperature ranges to limit conversion losses.</p>
          </Card>
          <Card variant="brutal" style={{ background: "var(--surface)" }}>
            <h3 style={{ marginTop: 0 }}>Schedule alignment</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: 0 }}>Surfaces overlap windows for stable exchange planning.</p>
          </Card>
        </div>
      </section>

      <section style={{ padding: "40px 0 24px" }}>
        <h2 className="section-title">How it works</h2>
        <div className="grid-auto">
          <Card>
            <strong>1. Create account</strong>
            <p style={{ color: "var(--text-muted)" }}>Register as a heat source or recovery site and verify your email.</p>
          </Card>
          <Card>
            <strong>2. Facility profile</strong>
            <p style={{ color: "var(--text-muted)" }}>Describe location, temperatures, capacity, and operating schedule.</p>
          </Card>
          <Card>
            <strong>3. Ranked matches</strong>
            <p style={{ color: "var(--text-muted)" }}>Review scores, open the map view, and send feedback on each lead.</p>
          </Card>
        </div>
      </section>

      <section className="band-trust" style={{ padding: "36px 24px", borderRadius: "var(--radius-sharp)" }}>
        <h2 className="section-title" style={{ color: "inherit" }}>
          Security and trust
        </h2>
        <div className="grid-auto" style={{ marginTop: 8 }}>
          <div>
            <h3 style={{ marginTop: 0, fontSize: 16 }}>Authenticated API</h3>
            <p style={{ color: "rgba(244,246,251,0.82)", marginBottom: 0, fontSize: 15, lineHeight: 1.55 }}>
              Facility data and match lists use HTTPS with JWT bearer tokens; keep credentials off shared channels.
            </p>
          </div>
          <div>
            <h3 style={{ marginTop: 0, fontSize: 16 }}>Email verification</h3>
            <p style={{ color: "rgba(244,246,251,0.82)", marginBottom: 0, fontSize: 15, lineHeight: 1.55 }}>
              Accounts activate after OTP verification so automated sign-ups cannot pollute the matching pool.
            </p>
          </div>
          <div>
            <h3 style={{ marginTop: 0, fontSize: 16 }}>Least exposure</h3>
            <p style={{ color: "rgba(244,246,251,0.82)", marginBottom: 0, fontSize: 15, lineHeight: 1.55 }}>
              Share what partners need for feasibility—scores and schedules—not full plant telemetry.
            </p>
          </div>
        </div>
      </section>

      <section style={{ padding: "40px 0 8px" }}>
        <h2 className="section-title">Directional metrics</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginTop: 16,
          }}
        >
          {[
            { k: "3", d: "Inputs combined", s: "Distance, temperature compatibility, and schedule overlap into one ranked score." },
            { k: "2", d: "Roles", s: "Waste heat source and recovery site onboarding with role-specific fields." },
            { k: "1", d: "Workspace", s: "Landing through auth, onboarding, dashboard, map, and feedback in one flow." },
          ].map((item) => (
            <div
              key={item.k}
              style={{
                border: "2px solid var(--text)",
                borderRadius: "var(--radius-sharp)",
                padding: 20,
                background: "var(--surface)",
                boxShadow: "var(--shadow-brutal)",
              }}
            >
              <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.04em" }}>{item.k}</div>
              <div style={{ fontWeight: 700, marginTop: 8 }}>{item.d}</div>
              <p style={{ color: "var(--text-muted)", marginBottom: 0, fontSize: 14, marginTop: 8 }}>{item.s}</p>
            </div>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
