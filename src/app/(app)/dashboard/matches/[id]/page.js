"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge, Field, Textarea } from "@/components/ui/primitives";
import { connectionsApi, feedbackApi, mapMatchDetailToView, matchesApi } from "@/lib/api/client";

function BreakdownBars({ data }) {
  const rows = [
    { key: "distance", label: "Location alignment" },
    { key: "temperature", label: "Temperature alignment" },
    { key: "schedule", label: "Schedule alignment" },
  ];

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {rows.map((row) => {
        const value = Math.max(0, Math.min(100, Number(data?.[row.key] || 0)));
        return (
          <div key={row.key} style={{ display: "grid", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
              <strong>{value}%</strong>
            </div>
            <div style={{ height: 8, background: "var(--surface-soft)", borderRadius: 999, overflow: "hidden" }}>
              <div
                style={{
                  width: `${value}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, #2f61ff, #26b36a)",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function MatchDetailPage() {
  const params = useParams();
  const matchId = String(params.id || "");

  const [loading, setLoading] = useState(true);
  const [match, setMatch] = useState(null);
  const [reason, setReason] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackState, setFeedbackState] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [requestBusy, setRequestBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    matchesApi.getDetail(matchId).then((detail) => {
      if (cancelled) return;
      if (!detail) {
        setMatch(null);
      } else {
        setMatch({
          id: String(detail.match_id),
          counterpartName: "Matched facility",
          score: detail.compatibility_score != null ? Math.round(Number(detail.compatibility_score)) : 0,
          summary: "AI-generated compatibility recommendation",
          ...mapMatchDetailToView(detail),
        });
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [matchId]);

  const deepDive = useMemo(() => {
    if (!match) return [];
    return [
      {
        label: "Producer profile",
        values: [
          `Facility: ${match.producerSpecs?.facilityName || "—"}`,
          `Temperature: ${match.producerSpecs?.temperatureC ?? "—"} C`,
          `Volume: ${match.producerSpecs?.volumeM3h ?? "—"} m3/h`,
          `Schedule: ${match.producerSpecs?.schedule || "—"}`,
        ],
      },
      {
        label: "Consumer profile",
        values: [
          `Facility: ${match.consumerSpecs?.facilityName || "—"}`,
          `Min temp: ${match.consumerSpecs?.temperatureC ?? "—"} C`,
          `Demand: ${match.consumerSpecs?.volumeM3h ?? "—"} m3/h`,
          `Schedule: ${match.consumerSpecs?.schedule || "—"}`,
        ],
      },
    ];
  }, [match]);

  if (loading) {
    return <p style={{ margin: 0, color: "#999" }}>Loading match details...</p>;
  }

  if (!match) {
    return (
      <div className="any-page" style={{ display: "grid", gap: 12 }}>
        <h1 className="any-title">Match not found</h1>
        <p style={{ margin: 0, color: "#999" }}>This match is unavailable or outside your account scope.</p>
        <Link href="/dashboard" style={{ color: "#c65440", fontWeight: 600, textDecoration: "none" }}>
          Return to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="any-page" style={{ gap: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <h1 className="any-title" style={{ marginBottom: 8 }}>
            Match
            <br />
            <span className="any-title-accent">detail</span>
          </h1>
          <p className="any-subtitle" style={{ marginTop: 0, maxWidth: 680 }}>{match.summary}</p>
        </div>
        <Badge tone="neutral" style={{ fontSize: 14, padding: "6px 12px", border: "0.5px solid #ebb0a5", background: "#fff7f5", color: "#c65440" }}>
          {match.score}% Compatible
        </Badge>
      </div>

      <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div className="any-card any-card-tight">
          <div style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>Distance</div>
          <strong style={{ fontSize: 20 }}>{match.distanceKm != null ? `${match.distanceKm} km` : "—"}</strong>
        </div>
        <div className="any-card any-card-tight">
          <div style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>Temperature fit</div>
          <strong style={{ fontSize: 20 }}>{match.temperatureFit}</strong>
        </div>
        <div className="any-card any-card-tight">
          <div style={{ fontSize: 12, color: "#999", marginBottom: 6 }}>Schedule fit</div>
          <strong style={{ fontSize: 20 }}>{match.scheduleOverlap}</strong>
        </div>
      </div>

      <section className="any-card" style={{ display: "grid", gap: 12 }}>
        <p className="any-section-label" style={{ margin: 0 }}>Compatibility breakdown</p>
        <BreakdownBars data={match.compatibilityBreakdown} />
      </section>

      <section className="any-card" style={{ display: "grid", gap: 12 }}>
        <p className="any-section-label" style={{ margin: 0 }}>Facility deep-dive</p>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {deepDive.map((block) => (
            <div key={block.label} style={{ border: "0.5px solid #e0ddd6", borderRadius: 12, padding: 16, background: "#fff" }}>
              <strong style={{ display: "block", marginBottom: 8 }}>{block.label}</strong>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#888", lineHeight: 1.6 }}>
                {block.values.map((value) => (
                  <li key={value}>{value}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="any-card" style={{ display: "grid", gap: 12 }}>
        <p className="any-section-label" style={{ margin: 0 }}>Feedback</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            className="any-btn-primary"
            disabled={savingFeedback}
            onClick={async () => {
              setSavingFeedback(true);
              await feedbackApi.submit({ matchId: match.id, rating: "useful", reason });
              setFeedbackState("useful");
              setSavingFeedback(false);
              setNotice("Feedback saved as Useful.");
            }}
          >
            Interested / Useful
          </button>
          <button
            className="any-btn-secondary"
            disabled={savingFeedback}
            onClick={async () => {
              setSavingFeedback(true);
              await feedbackApi.submit({ matchId: match.id, rating: "not_useful", reason });
              setFeedbackState("not_useful");
              setSavingFeedback(false);
              setNotice("Feedback saved as Not useful.");
            }}
          >
            Not for me
          </button>
        </div>
        <Field label="Reason (optional)">
          <Textarea value={reason} onChange={(event) => setReason(event.target.value)} style={{ minHeight: 84 }} />
        </Field>
      </section>

      <section className="any-card" style={{ display: "grid", gap: 12 }}>
        <p className="any-section-label" style={{ margin: 0 }}>Call to action</p>
        <Field label="Request message (optional)">
          <Textarea
            value={requestMessage}
            onChange={(event) => setRequestMessage(event.target.value)}
            placeholder="Requesting connection to discuss feasibility, exchanger sizing, and routing constraints."
            style={{ minHeight: 92 }}
          />
        </Field>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            className="any-btn-primary"
            disabled={requestBusy}
            onClick={async () => {
              setRequestBusy(true);
              try {
                await connectionsApi.create({ matchId: match.id, message: requestMessage });
                setNotice("Connection request sent.");
              } catch {
                setNotice("Could not send connection request.");
              } finally {
                setRequestBusy(false);
              }
            }}
          >
            Request connection
          </button>
          <Link href="/connections" style={{ textDecoration: "none" }}>
            <button type="button" className="any-btn-secondary">View connections</button>
          </Link>
        </div>
        {notice ? <p style={{ margin: 0, fontSize: 13, color: "#999" }}>{notice}</p> : null}
      </section>
    </div>
  );
}
