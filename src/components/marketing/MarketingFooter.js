import Link from "next/link";

export default function MarketingFooter() {
  return (
    <footer
      style={{
        marginTop: 48,
        paddingTop: 24,
        borderTop: "2px solid var(--text)",
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap",
        alignItems: "center",
        color: "var(--text-muted)",
        fontSize: 14,
      }}
    >
      <span>HeatREco — industrial waste heat matchmaking</span>
      <div style={{ display: "flex", gap: 18 }}>
        <Link href="/auth/register" style={{ fontWeight: 600, color: "var(--text)" }}>
          Register
        </Link>
        <Link href="/auth/login" style={{ fontWeight: 600, color: "var(--text)" }}>
          Login
        </Link>
      </div>
    </footer>
  );
}
