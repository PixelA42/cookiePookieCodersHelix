"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Divider } from "@/components/ui/primitives";
import { feedbackApi, profileApi } from "@/lib/api/client";

export default function AccountPage() {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    Promise.all([profileApi.get(), feedbackApi.list()])
      .then(([nextProfile, nextHistory]) => {
        setProfile(nextProfile);
        setHistory(nextHistory);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    Promise.all([profileApi.get(), feedbackApi.list()])
      .then(([nextProfile, nextHistory]) => {
        if (!active) return;
        setProfile(nextProfile);
        setHistory(nextHistory);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p style={{ margin: 0, color: "var(--text-muted)" }}>Loading account settings...</p>;
  }

  return (
    <div style={{ display: "grid", gap: 24, maxWidth: 980 }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 10, borderLeft: "3px solid var(--primary)", paddingLeft: 10 }}>
          Profile / Account
        </div>
        <h1 style={{ margin: 0, marginBottom: 8, fontSize: "clamp(28px, 6vw, 40px)" }}>Settings and data management</h1>
        <p style={{ margin: 0, color: "var(--text-muted)", maxWidth: 760 }}>
          Manage your facility identity and historical match feedback records.
        </p>
      </div>

      <section style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)", padding: 18, display: "grid", gap: 10 }}>
        <strong>Profile settings</strong>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13 }}>
          Organization: {profile?.companyName || "—"}
        </p>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13 }}>
          Facility: {profile?.facilityName || "—"}
        </p>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13 }}>
          Role: {profile?.role || "—"}
        </p>
      </section>

      <Divider />

      <section style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <strong>Historical feedback</strong>
          <Button type="button" variant="ghost" onClick={reload}>
            Refresh
          </Button>
        </div>

        {!history.length ? (
          <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)", padding: 20, color: "var(--text-muted)" }}>
            No feedback recorded yet.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {history.map((entry) => (
              <div key={entry.matchId} style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)", padding: 14, display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <strong>{entry.counterpartName || `Match ${entry.matchId}`}</strong>
                  <Badge tone={entry.rating === "useful" ? "good" : "bad"}>{entry.rating}</Badge>
                </div>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13 }}>
                  Match ID: {entry.matchId}
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Button
                    type="button"
                    variant="soft"
                    onClick={async () => {
                      await feedbackApi.submit({ matchId: entry.matchId, rating: "useful", reason: entry.reason || "" });
                      reload();
                    }}
                  >
                    Set useful
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    onClick={async () => {
                      await feedbackApi.submit({ matchId: entry.matchId, rating: "not_useful", reason: entry.reason || "" });
                      reload();
                    }}
                  >
                    Set not useful
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
