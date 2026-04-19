import Link from "next/link";
import { Button } from "@/components/ui/primitives";

export default function MarketingNav() {
  return (
    <header className="sticky-nav" role="banner">
      <Link href="/" className="sticky-nav-logo">
        HeatREco
      </Link>
      <nav className="sticky-nav-actions" aria-label="Marketing">
        <Link href="/auth/login" style={{ fontWeight: 600, fontSize: 14 }}>
          Login
        </Link>
        <Link href="/auth/register">
          <Button shape="sharp">Start matching</Button>
        </Link>
        <button type="button" className="sticky-nav-burger" aria-label="Open navigation menu">
          <span />
          <span />
        </button>
      </nav>
    </header>
  );
}
