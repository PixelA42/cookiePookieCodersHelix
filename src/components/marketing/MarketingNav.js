import Link from "next/link";
import { Button } from "@/components/ui/primitives";

export default function MarketingNav() {
  return (
    <header className="sticky-nav" role="banner">
      <Link href="/" className="sticky-nav-logo">
        HeatREco
      </Link>
      <nav aria-label="Marketing" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <Link href="/auth/login" style={{ fontWeight: 600, fontSize: 14 }}>
          Login
        </Link>
        <Link href="/auth/register">
          <Button shape="sharp">Get started</Button>
        </Link>
      </nav>
    </header>
  );
}
