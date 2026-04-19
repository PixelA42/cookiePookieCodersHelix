"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/primitives";
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
    return (
      <div className="any-page">
        <p style={{ margin: 0, color: "#999" }}>Loading account settings...</p>
      </div>
    );
  }

  return (
    <div className="any-page">
      <div>
        <h1 className="any-title">
          Settings and
          <br />
          <span className="any-title-accent">data management</span>
        </h1>
        <p className="any-subtitle" style={{ maxWidth: 760 }}>
          Manage your facility identity and historical match feedback records.
        </p>
      </div>

      <section className="any-card" style={{ display: "grid", gap: 12 }}>
        <p className="any-section-label">Profile settings</p>
        <div className="any-meta-row">
          <span className="any-meta-label">Organization</span>
          <span className="any-meta-value">{profile?.companyName || "—"}</span>
        </div>
        <div className="any-meta-row">
          <span className="any-meta-label">Facility</span>
          <span className="any-meta-value">{profile?.facilityName || "—"}</span>
        </div>
        <div className="any-meta-row">
          <span className="any-meta-label">Role</span>
          <span className="any-pill accent">{profile?.role || "—"}</span>
        </div>
      </section>

      <section style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <p className="any-section-label" style={{ margin: 0 }}>Historical feedback</p>
          <button type="button" className="any-btn-primary" onClick={reload}>
            Refresh
          </button>
        </div>

        {!history.length ? (
          <div className="any-empty">
            No feedback recorded yet.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {history.map((entry) => (
              <div key={entry.matchId} className="any-card any-card-tight" style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <strong>{entry.counterpartName || `Match ${entry.matchId}`}</strong>
                  <Badge tone="neutral" style={{ border: "0.5px solid #ebb0a5", background: "#fff7f5", color: "#c65440" }}>
                    {entry.rating}
                  </Badge>
                </div>
                <div className="any-meta-row">
                  <span className="any-meta-label">Match ID</span>
                  <span className="any-meta-value">{entry.matchId}</span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    className="any-btn-secondary"
                    onClick={async () => {
                      await feedbackApi.submit({ matchId: entry.matchId, rating: "useful", reason: entry.reason || "" });
                      reload();
                    }}
                  >
                    Set useful
                  </button>
                  <button
                    type="button"
                    className="any-btn-secondary"
                    onClick={async () => {
                      await feedbackApi.submit({ matchId: entry.matchId, rating: "not_useful", reason: entry.reason || "" });
                      reload();
                    }}
                  >
                    Set not useful
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
