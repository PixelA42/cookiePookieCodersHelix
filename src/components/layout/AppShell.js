"use client";

import Sidebar from "./Sidebar";

export default function AppShell({ children }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main
        style={{
          flex: 1,
          marginLeft: 260,
          background:
            "linear-gradient(165deg, hsl(228 35% 98.5%) 0%, hsl(210 28% 97%) 45%, rgba(47, 97, 255, 0.03) 100%)",
          borderLeft: "1px solid var(--border)",
        }}
      >
        <div className="container" style={{ padding: "36px 28px", maxWidth: "1400px", margin: "0 auto" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
