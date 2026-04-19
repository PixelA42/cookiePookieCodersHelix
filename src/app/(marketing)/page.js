import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui/primitives";
import FeatureCarousel from "@/components/marketing/FeatureCarousel";
import MarqueeStrip from "@/components/marketing/MarqueeStrip";
import MarketingFooter from "@/components/marketing/MarketingFooter";

export default function MarketingPage() {
  return (
    <div style={{ display: "grid", gap: 0 }}>
      <section className="poster-hero">
        <div className="poster-hero-left reveal-up">
          <div className="eyebrow" style={{ width: "fit-content" }}>
            AI heat exchange network
          </div>
          <h1 className="poster-hero-title">
            A safer network
            <br />
            <span>for thermal collaboration</span>
          </h1>
          <p className="hero-subcopy" style={{ maxWidth: 620 }}>
            HeatREco links industrial producers and nearby thermal consumers with compatibility scored from distance,
            temperature fit, and schedule overlap.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/auth/register">
              <Button shape="sharp">Create facility profile</Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" shape="sharp">
                Enter dashboard
              </Button>
            </Link>
          </div>
        </div>

        <div className="poster-hero-right reveal-up delay-1">
          <div className="poster-stack-card">
            <strong>Producer profile</strong>
            <p>Data center · 84°C surplus · weekday output</p>
          </div>
          <div className="poster-stack-card">
            <strong>Consumer profile</strong>
            <p>Greenhouse · 72°C demand · daily thermal intake</p>
          </div>
          <div className="poster-stack-card">
            <strong>AI Compatibility</strong>
            <p>93 / 100 from distance, thermal overlap, and schedule fit.</p>
          </div>
        </div>
      </section>

      <section className="poster-strip">
        <article className="poster-tile">
          <h3>Profile submission</h3>
          <p>
            Role-aware forms capture location, temperature, output or demand, and operating schedule.
          </p>
        </article>
        <article className="poster-tile">
          <h3>Offline & online ready</h3>
          <p>
            PostgreSQL-backed data and local development support keep workflows stable for cloud and test environments.
          </p>
        </article>
        <article className="poster-tile poster-tile-accent">
          <h3>AI-driven ranking</h3>
          <p>
            Match recommendations are scored and ordered by model-driven compatibility from all available signals.
          </p>
        </article>
        <article className="poster-tile poster-tile-cta">
          <Badge tone="good" style={{ width: "fit-content", marginBottom: 10 }}>
            Feedback loop live
          </Badge>
          <p style={{ marginTop: 0 }}>
            Useful and not useful responses feed training data so future pair quality improves over time.
          </p>
          <Link href="/dashboard" style={{ fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 4 }}>
            Open match workspace
          </Link>
        </article>
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
