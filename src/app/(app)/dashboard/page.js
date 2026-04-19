"use client";

import MatchWorkspace from "@/components/domain/MatchWorkspace";
import AiCompatibilityCard from "@/components/domain/AiCompatibilityCard";

export default function DashboardPage() {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <AiCompatibilityCard />
      <MatchWorkspace />
    </div>
  );
}
