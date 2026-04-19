"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Divider, Field, Textarea } from "@/components/ui/primitives";
import { connectionsApi, feedbackApi, mapMatchDetailToView, matchesApi } from "@/lib/api/client";

function scoreTone(score) {
  if (score >= 85) return "good";
  if (score >= 70) return "primary";
  return "neutral";
}

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
    return <p style={{ margin: 0, color: "var(--text-muted)" }}>Loading match details...</p>;
  }

  if (!match) {
    return (
      <div style={{ display: "grid", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Match not found</h1>
        <p style={{ margin: 0, color: "var(--text-muted)" }}>This match is unavailable or outside your account scope.</p>
        <Link href="/dashboard" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none" }}>
          Return to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="workspace-page" style={{ gap: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10, borderLeft: "3px solid var(--primary)", paddingLeft: 10 }}>
            Match detail
          </div>
          <h1 style={{ margin: 0, marginBottom: 8, fontSize: "clamp(28px, 6vw, 40px)" }}>{match.counterpartName}</h1>
          <p style={{ margin: 0, color: "var(--text-muted)", maxWidth: 680 }}>{match.summary}</p>
        </div>
        <Badge tone={scoreTone(match.score)} style={{ fontSize: 14, padding: "6px 12px" }}>
          {match.score}% Compatible
        </Badge>
      </div>

      <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div style={{ padding: 16, border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Distance</div>
          <strong style={{ fontSize: 20 }}>{match.distanceKm != null ? `${match.distanceKm} km` : "—"}</strong>
        </div>
        <div style={{ padding: 16, border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Temperature fit</div>
          <strong style={{ fontSize: 20 }}>{match.temperatureFit}</strong>
        </div>
        <div style={{ padding: 16, border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)" }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>Schedule fit</div>
          <strong style={{ fontSize: 20 }}>{match.scheduleOverlap}</strong>
        </div>
      </div>

      <Divider />

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Compatibility breakdown</h2>
        <BreakdownBars data={match.compatibilityBreakdown} />
      </section>

      <Divider />

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Facility deep-dive</h2>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {deepDive.map((block) => (
            <div key={block.label} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 16, background: "var(--surface)" }}>
              <strong style={{ display: "block", marginBottom: 8 }}>{block.label}</strong>
              <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-muted)", lineHeight: 1.6 }}>
                {block.values.map((value) => (
                  <li key={value}>{value}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Feedback</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button
            variant={feedbackState === "useful" ? "primary" : "soft"}
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
          </Button>
          <Button
            variant={feedbackState === "not_useful" ? "danger" : "ghost"}
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
          </Button>
        </div>
        <Field label="Reason (optional)">
          <Textarea value={reason} onChange={(event) => setReason(event.target.value)} style={{ minHeight: 84 }} />
        </Field>
      </section>

      <Divider />

      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 20 }}>Call to action</h2>
        <Field label="Request message (optional)">
          <Textarea
            value={requestMessage}
            onChange={(event) => setRequestMessage(event.target.value)}
            placeholder="Requesting connection to discuss feasibility, exchanger sizing, and routing constraints."
            style={{ minHeight: 92 }}
          />
        </Field>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button
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
          </Button>
          <Link href="/connections" style={{ textDecoration: "none" }}>
            <Button type="button" variant="ghost">View connections</Button>
          </Link>
        </div>
        {notice ? <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)" }}>{notice}</p> : null}
      </section>
    </div>
  );
}
