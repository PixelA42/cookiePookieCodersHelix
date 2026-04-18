import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui/primitives";

export default function MarketingPage() {
  return (
    <div>
      <header style={{ borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)" }}>
        <div
          className="container"
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0" }}
        >
          <strong>HeatREco</strong>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/auth/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="container" style={{ padding: "68px 0 40px", display: "grid", gap: 24 }}>
        <div className="eyebrow">Industrial heat matching</div>
        <div style={{ display: "grid", gap: 18, gridTemplateColumns: "1.1fr 0.9fr", alignItems: "center" }}>
          <div style={{ display: "grid", gap: 16 }}>
            <h1 style={{ fontSize: "clamp(46px, 8vw, 72px)", margin: 0, maxWidth: 740, lineHeight: 0.98 }}>
              A calmer way to turn waste heat into shared utility.
            </h1>
            <p style={{ color: "var(--text-muted)", maxWidth: 620, fontSize: 18, margin: 0 }}>
              HeatREco helps producers and consumers discover high-fit thermal partnerships by combining distance,
              temperature, and schedule compatibility in one spacious workflow.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/auth/register">
                <Button>Start matching</Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="ghost">Open workspace</Button>
              </Link>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Badge tone="primary">Proximity-aware</Badge>
              <Badge tone="good">Temperature fit</Badge>
              <Badge tone="neutral">Schedule overlap</Badge>
            </div>
          </div>
          <Card strong style={{ padding: 24, display: "grid", gap: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
              <strong>Compatibility snapshot</strong>
              <Badge tone="good">92/100</Badge>
            </div>
            <div className="grid-auto">
              <Card style={{ padding: 16 }}>
                <strong>Producer</strong>
                <p style={{ margin: "8px 0 0", color: "var(--text-muted)" }}>Food processing plant, 82 C output</p>
              </Card>
              <Card style={{ padding: 16 }}>
                <strong>Consumer</strong>
                <p style={{ margin: "8px 0 0", color: "var(--text-muted)" }}>Greenhouse, 71 C demand</p>
              </Card>
            </div>
            <Card style={{ padding: 16 }}>
              <strong>Why this pairing works</strong>
              <p style={{ margin: "8px 0 0", color: "var(--text-muted)" }}>
                Close pipeline distance, strong temperature overlap, and steady weekday schedules.
              </p>
            </Card>
          </Card>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 30 }}>
        <h2 className="section-title">Why it works</h2>
        <div className="grid-auto">
          <Card>
            <h3>Proximity aware</h3>
            <p style={{ color: "var(--text-muted)" }}>Prioritizes feasible pipe distances for practical delivery.</p>
          </Card>
          <Card>
            <h3>Thermal compatibility</h3>
            <p style={{ color: "var(--text-muted)" }}>Matches by temperature ranges to reduce conversion losses.</p>
          </Card>
          <Card>
            <h3>Schedule alignment</h3>
            <p style={{ color: "var(--text-muted)" }}>Surfaces overlap windows for stable energy exchange planning.</p>
          </Card>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 30 }}>
        <h2 className="section-title">How it works</h2>
        <div className="grid-auto">
          <Card>
            <strong>1. Create account</strong>
            <p style={{ color: "var(--text-muted)" }}>Register as producer or consumer and verify your email.</p>
          </Card>
          <Card>
            <strong>2. Add facility profile</strong>
            <p style={{ color: "var(--text-muted)" }}>Describe location, temperatures, output/demand, and schedule.</p>
          </Card>
          <Card>
            <strong>3. Review ranked matches</strong>
            <p style={{ color: "var(--text-muted)" }}>Track compatibility scores, inspect details, and give feedback.</p>
          </Card>
        </div>
      </section>

      <section className="container" style={{ paddingBottom: 54 }}>
        <h2 className="section-title">A few directional metrics</h2>
        <div className="grid-auto">
          <Card>
            <strong>3 inputs</strong>
            <p style={{ color: "var(--text-muted)" }}>Distance, temperature, and schedule are combined into one ranked score.</p>
          </Card>
          <Card>
            <strong>2 roles</strong>
            <p style={{ color: "var(--text-muted)" }}>Producer and consumer onboarding stays lightweight while preserving role-specific data.</p>
          </Card>
          <Card>
            <strong>1 workspace</strong>
            <p style={{ color: "var(--text-muted)" }}>Move from landing page to auth, profile setup, dashboard, map, and feedback in one flow.</p>
          </Card>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--border)", background: "rgba(255,255,255,0.78)" }}>
        <div
          className="container"
          style={{ padding: "18px 0", display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}
        >
          <span style={{ color: "var(--text-muted)" }}>HeatREco hackathon frontend</span>
          <div style={{ display: "flex", gap: 14, color: "var(--text-muted)" }}>
            <Link href="/auth/register">Register</Link>
            <Link href="/auth/login">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
