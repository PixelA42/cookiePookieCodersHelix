import { Card } from "@/components/ui/primitives";

export default function AuthCard({ title, subtitle, children }) {
  return (
    <Card variant="brutal" strong style={{ width: "min(460px, 94vw)", padding: 28 }}>
      <div className="eyebrow eyebrow-brutal" style={{ marginBottom: 16 }}>
        HeatREco account
      </div>
      <h1 style={{ marginTop: 0, marginBottom: 10, fontSize: 34, lineHeight: 1.1 }}>{title}</h1>
      {subtitle ? <p style={{ color: "var(--text-muted)", marginTop: 0 }}>{subtitle}</p> : null}
      {children}
    </Card>
  );
}
