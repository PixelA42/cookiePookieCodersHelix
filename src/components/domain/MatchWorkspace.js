"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Badge, Divider, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { feedbackApi, matchesApi } from "@/lib/api/client";

function scoreTone(score) {
  if (score >= 85) return "good";
  if (score >= 70) return "primary";
  return "neutral";
}

function FeedbackButtons({ matchId, existingFeedback, onSaved }) {
  const [rating, setRating] = useState(existingFeedback?.rating || "");
  const [reason, setReason] = useState(existingFeedback?.reason || "");
  const [busy, setBusy] = useState(false);

  const submit = async (nextRating) => {
    setBusy(true);
    try {
      setRating(nextRating);
      await feedbackApi.submit({ matchId, rating: nextRating, reason });
      onSaved({ matchId, rating: nextRating, reason });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button variant={rating === "useful" ? "primary" : "soft"} disabled={busy} onClick={() => submit("useful")}>
          Useful
        </Button>
        <Button variant={rating === "not-useful" ? "danger" : "ghost"} disabled={busy} onClick={() => submit("not-useful")}>
          Not useful
        </Button>
      </div>
      <Field label="Reason (optional)">
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Add a note for why this match is or is not useful."
          style={{ minHeight: 88 }}
        />
      </Field>
      <Button variant="ghost" disabled={busy || !rating} onClick={() => submit(rating)}>
        Save feedback note
      </Button>
    </div>
  );
}

function MatchDetail({ match, feedback, onFeedbackSaved }) {
  if (!match) {
    return (
      <Card strong style={{ minHeight: 420, display: "grid", placeItems: "center", textAlign: "center" }}>
        <div>
          <h2 style={{ marginBottom: 8 }}>No match selected</h2>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>
            Choose a ranked partner to inspect their temperature, distance, and schedule fit.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card strong style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Match detail
          </div>
          <h2 style={{ margin: 0 }}>{match.counterpartName}</h2>
          <p style={{ margin: "8px 0 0", color: "var(--text-muted)" }}>{match.summary}</p>
        </div>
        <Badge tone={scoreTone(match.score)}>{match.score}/100 fit</Badge>
      </div>
      <div className="grid-auto">
        <Card style={{ padding: 16 }}>
          <strong>Distance</strong>
          <p style={{ margin: "8px 0 0", color: "var(--text-muted)" }}>{match.distanceKm} km from your facility</p>
        </Card>
        <Card style={{ padding: 16 }}>
          <strong>Temperature fit</strong>
          <p style={{ margin: "8px 0 0", color: "var(--text-muted)" }}>{match.temperatureFit}</p>
        </Card>
        <Card style={{ padding: 16 }}>
          <strong>Schedule overlap</strong>
          <p style={{ margin: "8px 0 0", color: "var(--text-muted)" }}>{match.scheduleOverlap}</p>
        </Card>
      </div>
      <Card style={{ padding: 16 }}>
        <strong>Explanation</strong>
        <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: "var(--text-muted)" }}>
          {match.explanation?.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Card>
      <div style={{ display: "grid", gap: 8 }}>
        <strong>Facility details</strong>
        <p style={{ margin: 0, color: "var(--text-muted)" }}>{match.location}</p>
        <p style={{ margin: 0, color: "var(--text-muted)" }}>{match.contact}</p>
      </div>
      <Divider />
      <div>
        <h3 style={{ marginTop: 0 }}>Feedback loop</h3>
        <FeedbackButtons matchId={match.id} existingFeedback={feedback} onSaved={onFeedbackSaved} />
      </div>
    </Card>
  );
}

export default function MatchWorkspace({ mapMode = false }) {
  const [matches, setMatches] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [feedback, setFeedback] = useState([]);
  const [minScore, setMinScore] = useState("70");
  const [radius, setRadius] = useState("15");

  useEffect(() => {
    Promise.all([matchesApi.list(), feedbackApi.list()]).then(([nextMatches, nextFeedback]) => {
      setMatches(nextMatches);
      setSelectedId(nextMatches[0]?.id || "");
      setFeedback(nextFeedback);
    });
  }, []);

  const visibleMatches = useMemo(() => {
    return matches.filter((item) => item.score >= Number(minScore || 0) && item.distanceKm <= Number(radius || 999));
  }, [matches, minScore, radius]);

  const activeId = visibleMatches.some((item) => item.id === selectedId)
    ? selectedId
    : visibleMatches[0]?.id || "";

  const selectedMatch = visibleMatches.find((item) => item.id === activeId) || null;

  const feedbackByMatch = useMemo(() => {
    return Object.fromEntries(feedback.map((entry) => [entry.matchId, entry]));
  }, [feedback]);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Ranked opportunities
          </div>
          <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.1 }}>{mapMode ? "Map view" : "Match dashboard"}</h1>
          <p style={{ marginBottom: 0, color: "var(--text-muted)", maxWidth: 680 }}>
            Review compatibility scores, inspect operational tradeoffs, and collect feedback before contacting a partner.
          </p>
        </div>
        <Card style={{ display: "grid", gap: 12, minWidth: 280 }}>
          <Field label="Minimum score">
            <Input value={minScore} onChange={(event) => setMinScore(event.target.value)} />
          </Field>
          <Field label="Radius (km)">
            <Input value={radius} onChange={(event) => setRadius(event.target.value)} />
          </Field>
        </Card>
      </div>

      <div style={{ display: "grid", gap: 18, gridTemplateColumns: mapMode ? "1.1fr 0.9fr" : "0.85fr 1.15fr" }}>
        <div style={{ display: "grid", gap: 14 }}>
          {mapMode ? (
            <Card strong style={{ minHeight: 360, display: "grid", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                <strong>Map panel</strong>
                <Badge tone="primary">Placeholder</Badge>
              </div>
              <div
                style={{
                  flex: 1,
                  minHeight: 280,
                  borderRadius: 18,
                  background:
                    "linear-gradient(135deg, rgba(47,97,255,0.15), rgba(255,255,255,0.85)), var(--surface-soft)",
                  border: "1px solid var(--border)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {visibleMatches.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    style={{
                      position: "absolute",
                      left: `${20 + index * 22}%`,
                      top: `${24 + (index % 2) * 28}%`,
                      width: 18,
                      height: 18,
                      borderRadius: 999,
                      border: "2px solid white",
                      background: item.id === activeId ? "var(--primary)" : "var(--good)",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
              <p style={{ margin: 0, color: "var(--text-muted)" }}>
                MapLibre can replace this panel later once live facility coordinates and tile configuration are available.
              </p>
            </Card>
          ) : null}

          <Card strong style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
              <strong>{visibleMatches.length} ranked matches</strong>
              <Badge tone="neutral">Mocked data</Badge>
            </div>
            {visibleMatches.length ? (
              visibleMatches.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  style={{
                    textAlign: "left",
                    padding: 16,
                    borderRadius: 16,
                    border: `1px solid ${item.id === activeId ? "var(--primary)" : "var(--border)"}`,
                    background: item.id === activeId ? "var(--primary-soft)" : "var(--surface)",
                    cursor: "pointer",
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <strong>{item.counterpartName}</strong>
                    <Badge tone={scoreTone(item.score)}>{item.score}</Badge>
                  </div>
                  <p style={{ margin: 0, color: "var(--text-muted)" }}>{item.summary}</p>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Badge tone="neutral">{item.distanceKm} km</Badge>
                    <Badge tone="primary">{item.temperatureFit}</Badge>
                    <Badge tone="good">{item.scheduleOverlap} overlap</Badge>
                  </div>
                </button>
              ))
            ) : (
              <Card style={{ padding: 18, textAlign: "center" }}>
                <h3 style={{ marginTop: 0 }}>No matches in this filter window</h3>
                <p style={{ marginBottom: 0, color: "var(--text-muted)" }}>
                  Broaden the radius or lower the score threshold to inspect more counterparties.
                </p>
              </Card>
            )}
          </Card>
        </div>

        <MatchDetail
          match={selectedMatch}
          feedback={selectedMatch ? feedbackByMatch[selectedMatch.id] : null}
          onFeedbackSaved={(entry) => {
            setFeedback((current) => [...current.filter((item) => item.matchId !== entry.matchId), entry]);
          }}
        />
      </div>
    </div>
  );
}
