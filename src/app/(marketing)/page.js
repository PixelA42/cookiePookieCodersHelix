import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui/primitives";
import FeatureCarousel from "@/components/marketing/FeatureCarousel";
import MarqueeStrip from "@/components/marketing/MarqueeStrip";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export default function MarketingPage() {
  return (
    <div style={{ display: "grid", gap: 0 }}>
      <section style={{ paddingBottom: 28 }}>
        <div className="hero-grid">
          <div className="reveal-up" style={{ display: "grid", gap: 18 }}>
            <div className="eyebrow eyebrow-brutal" style={{ marginBottom: 6 }}>
              AI heat exchange network
            </div>
            <h1 className="hero-title">
              Waste heat.
              <br />
              <span className="hero-title-accent">Finds a second life.</span>
            </h1>
            <p className="hero-subcopy">
              HeatREco links industrial producers and nearby thermal consumers with compatibility scored from distance,
              temperature fit, and schedule overlap. Factories and data centers stop venting usable heat while
              greenhouses, cold storage, and district systems recover it as utility.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link href="/auth/register">
                <Button shape="sharp">Create facility profile</Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="ghost" shape="sharp">
                  Enter dashboard
                </Button>
              </Link>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Badge tone="primary" shape="tag">
                Producer + Consumer roles
              </Badge>
              <Badge tone="good" shape="tag">
                AI compatibility score
              </Badge>
              <Badge tone="neutral" shape="tag">
                REST API /api/v1
              </Badge>
            </div>
          </div>

          <div className="mesh-panel reveal-up delay-1" style={{ minHeight: 360 }}>
            <div className="mesh-panel-inner">
              <div className="glass-row">
                <div>
                  <strong style={{ fontSize: 14, display: "block" }}>Producer</strong>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Data Center · 84°C surplus</div>
                </div>
                <Badge tone="primary">Live</Badge>
              </div>

              <div className="glass-row">
                <div>
                  <strong style={{ fontSize: 14, display: "block" }}>Consumer</strong>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Greenhouse · 72°C demand</div>
                </div>
                <Badge tone="good">8.1km</Badge>
              </div>

              <div className="glass-row">
                <div>
                  <strong style={{ fontSize: 14, display: "block" }}>Schedule overlap</strong>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Weekdays 06:00 to 18:00</div>
                </div>
                <Badge tone="neutral">Stable</Badge>
              </div>

              <Card variant="brutal" strong style={{ marginTop: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                  <strong>AI compatibility</strong>
                  <Badge tone="good">93 / 100</Badge>
                </div>
                <p style={{ margin: "10px 0 0", color: "var(--text-muted)", fontSize: 13 }}>
                  Ranked high due to short route feasibility, thermal range overlap, and aligned operating windows.
                </p>
              </Card>
            </div>
            <div className="floating-note">
              Feedback status: 16 useful votes this month are improving recommendation precision.
            </div>
          </div>
        </div>
      </section>

      <MarqueeStrip />

      <section style={{ padding: "48px 0 32px" }}>
        <h2 className="section-title reveal-up">What makes a viable match</h2>
        <p className="section-copy" style={{ maxWidth: 640, marginBottom: 24 }}>
          Scroll the highlights or use arrow keys when focused — same signals the workspace uses to rank partners.
        </p>
        <FeatureCarousel />
      </section>

      <section className="band-accent" style={{ margin: "0 -8px", padding: "36px 24px", borderRadius: "var(--radius-sharp)" }}>
        <h2 className="section-title">Built from product requirements</h2>
        <div className="grid-auto" style={{ marginTop: 20 }}>
          <Card variant="brutal" style={{ background: "var(--surface)" }}>
            <h3 style={{ marginTop: 0 }}>Profile submission</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: 0 }}>
              Role-aware forms capture location, temperature, output or demand, and operating schedule.
            </p>
          </Card>
          <Card variant="brutal" style={{ background: "var(--surface)" }}>
            <h3 style={{ marginTop: 0 }}>AI-driven ranking</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: 0 }}>
              Match recommendations are scored and ordered by model-driven compatibility from all available signals.
            </p>
          </Card>
          <Card variant="brutal" style={{ background: "var(--surface)" }}>
            <h3 style={{ marginTop: 0 }}>Feedback loop</h3>
            <p style={{ color: "var(--text-muted)", marginBottom: 0 }}>
              Useful and not useful responses feed training data so future pair quality improves over time.
            </p>
          </Card>
        </div>
      </section>

      <section style={{ padding: "40px 0 24px" }}>
        <h2 className="section-title">Core flow</h2>
        <div className="grid-auto">
          <Card>
            <strong>1. Register and verify</strong>
            <p style={{ color: "var(--text-muted)" }}>Create producer or consumer account, then activate with OTP verification.</p>
          </Card>
          <Card>
            <strong>2. Submit facility profile</strong>
            <p style={{ color: "var(--text-muted)" }}>Provide thermal profile fields required to calculate compatibility and distance feasibility.</p>
          </Card>
          <Card>
            <strong>3. Operate in dashboard</strong>
            <p style={{ color: "var(--text-muted)" }}>Review ranked matches, inspect map context, and submit feedback to retrain recommendations.</p>
          </Card>
        </div>
      </section>

      <section className="band-trust" style={{ padding: "36px 24px", borderRadius: "var(--radius-sharp)" }}>
        <h2 className="section-title" style={{ color: "inherit" }}>
          Security baseline
        </h2>
        <div className="grid-auto" style={{ marginTop: 8 }}>
          <div>
            <h3 style={{ marginTop: 0, fontSize: 16 }}>Authenticated API</h3>
            <p style={{ color: "rgba(244,246,251,0.82)", marginBottom: 0, fontSize: 15, lineHeight: 1.55 }}>
              Protected endpoints use token authentication, and all critical data actions stay behind authorized requests.
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
        <h2 className="section-title">Platform pillars</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginTop: 16,
          }}
        >
          {[
            { k: "01", d: "AI Matchmaking", s: "Model ranks producer and consumer pairs and returns compatibility out of 100." },
            { k: "02", d: "Map + Dashboard", s: "Ranked list and geographic view support technical screening and outreach workflows." },
            { k: "03", d: "Learning Feedback", s: "User feedback captures outcomes that improve recommendation behavior over time." },
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
