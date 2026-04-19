"use client";

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
  const title = TITLES[pathname] || "HeatREco Workspace";

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
