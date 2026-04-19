"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

const TITLES = {
  "/dashboard/home": "Workspace Home",
  "/dashboard": "Match Dashboard",
  "/dashboard/map": "Map View",
  "/profile": "My Facility",
  "/connections": "Connections",
  "/account": "Profile & Account",
};

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isHome = pathname === "/dashboard/home";
  const title = TITLES[pathname] || "HeatREco Workspace";
  const breadcrumb = pathname
    .replace(/^\//, "")
    .split("/")
    .filter(Boolean)
    .map((part) => part.replace(/-/g, " "))
    .join(" / ");

  if (isHome) {
    return (
      <div className="workspace-root">
        <Sidebar />
        <main className="workspace-main">
          <header className="workspace-topbar">
            <div className="workspace-topbar-inner">
              <div>
                <p className="workspace-kicker">HeatREco</p>
                <h1 className="workspace-heading">{title}</h1>
              </div>
            </div>
          </header>
          <div className="workspace-content">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="any-inner-root">
      <header className="any-topbar" role="banner">
        <div className="any-topbar-inner">
          <Link href="/dashboard/home" className="any-logo">
            heatreco
          </Link>
          <div className="any-nav-actions">
            <Link href="/dashboard/home" className="any-cta-btn">
              <span className="any-grid-icon" aria-hidden>
                <span />
                <span />
                <span />
                <span />
              </span>
              Open
            </Link>
            <button type="button" className="any-menu-btn" aria-label="Open menu">
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <main className="any-inner-main">
        <div className="any-inner-content">
          <div className="any-breadcrumb">{breadcrumb || "workspace"}</div>
          <div>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
