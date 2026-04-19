"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button, Card, Badge, Divider, Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { feedbackApi, mapMatchDetailToView, matchesApi } from "@/lib/api/client";

function scoreTone(score) {
  if (score >= 85) return "good";
  if (score >= 70) return "primary";
  return "neutral";
}

function normalizeRating(r) {
  if (r === "not_useful") return "not-useful";
  return r || "";
}

function FeedbackButtons({ matchId, existingFeedback, onSaved }) {
  const [rating, setRating] = useState(() => normalizeRating(existingFeedback?.rating));
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
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Button
          variant={rating === "useful" ? "primary" : "soft"}
          disabled={busy}
          onClick={() => submit("useful")}
          style={{ flex: 1, minWidth: 100 }}
        >
          Useful
        </Button>
        <Button
          variant={rating === "not-useful" || rating === "not_useful" ? "danger" : "ghost"}
          disabled={busy}
          onClick={() => submit("not-useful")}
          style={{ flex: 1, minWidth: 100 }}
        >
          Not useful
        </Button>
      </div>
      <Field label="Reason (optional)">
        <Textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Why is this match useful or not useful? Share any concerns or opportunities..."
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 600,
          textAlign: "center",
          padding: 40,
          color: "var(--text-muted)",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "var(--radius-sharp)",
            border: "2px dashed var(--border-strong)",
            display: "grid",
            placeItems: "center",
            marginBottom: 16,
            color: "var(--text-muted)",
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          —
        </div>
        <h2 style={{ marginBottom: 8, color: "var(--text)" }}>No match selected</h2>
        <p style={{ margin: 0, maxWidth: 320 }}>
          Choose a ranked partner from the list to inspect their temperature, distance, and schedule fit.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <div
          className="eyebrow"
          style={{ marginBottom: 12, color: "var(--primary)", borderLeft: "3px solid var(--primary)", paddingLeft: 10 }}
        >
          Match detail
        </div>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 28 }}>{match.counterpartName}</h2>
            <p style={{ margin: "8px 0 0", color: "var(--text-muted)", fontSize: 14 }}>{match.summary}</p>
          </div>
          <Badge
            tone={scoreTone(match.score)}
            style={{
              padding: "6px 12px",
              fontSize: 13,
              whiteSpace: "nowrap",
              border: "1px solid var(--border-strong)",
              boxShadow: "2px 2px 0 rgba(47, 97, 255, 0.12)",
            }}
          >
            {match.score}/100 fit
          </Badge>
        </div>
      </div>

      <Divider />

      <div>
        <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
          Compatibility factors
        </h3>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
          <div style={{ padding: 16, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="eyebrow" style={{ marginBottom: 8, fontSize: 11 }}>Distance</div>
            <strong style={{ fontSize: 18, display: "block" }}>
              {match.distanceKm != null ? `${match.distanceKm} km` : "—"}
            </strong>
            <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 12 }}>From your facility</p>
          </div>
          <div style={{ padding: 16, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="eyebrow" style={{ marginBottom: 8, fontSize: 11 }}>Temperature</div>
            <strong style={{ fontSize: 18, display: "block" }}>{match.temperatureFit}</strong>
            <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 12 }}>Compatibility</p>
          </div>
          <div style={{ padding: 16, borderRadius: 12, background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="eyebrow" style={{ marginBottom: 8, fontSize: 11 }}>Schedule</div>
            <strong style={{ fontSize: 18, display: "block" }}>{match.scheduleOverlap}</strong>
            <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 12 }}>Overlap</p>
          </div>
        </div>
      </div>

      <Divider />

      <div>
        <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
          Why this pairing works
        </h3>
        <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-muted)", lineHeight: 1.6 }}>
          {match.explanation?.map((item) => (
            <li key={item} style={{ marginBottom: 8 }}>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <Divider />

      <div>
        <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 14, fontWeight: 600 }}>Contact information</h3>
        <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6 }}>
          <strong style={{ color: "var(--text)", display: "block" }}>Location</strong>
          {match.location}
        </p>
        <p style={{ margin: "12px 0 0", color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6 }}>
          <strong style={{ color: "var(--text)", display: "block" }}>Contact</strong>
          {match.contact}
        </p>
      </div>

      <Divider />

      <div>
        <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 14, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
          Feedback loop
        </h3>
        <p style={{ margin: "0 0 16px", color: "var(--text-muted)", fontSize: 12 }}>
          Help us improve matches by sharing whether this partnership would work for your facility.
        </p>
        <FeedbackButtons matchId={match.id} existingFeedback={feedback} onSaved={onFeedbackSaved} />
      </div>
    </div>
  );
}

export default function MatchWorkspace({ mapMode = false }) {
  const [matches, setMatches] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [feedback, setFeedback] = useState([]);
  const [minScore, setMinScore] = useState("70");
  const [radius, setRadius] = useState("15");
  const [sortBy, setSortBy] = useState("score");
  const [detailOverlay, setDetailOverlay] = useState(null);
  const [generating, setGenerating] = useState(false);

  const reload = () => {
    Promise.all([matchesApi.list(), feedbackApi.list()]).then(([nextMatches, nextFeedback]) => {
      setMatches(nextMatches);
      setSelectedId((current) => nextMatches.some((m) => m.id === current) ? current : nextMatches[0]?.id || "");
      setFeedback(nextFeedback);
    });
  };

  useEffect(() => {
    reload();
  }, []);

  const visibleMatches = useMemo(() => {
    const r = Number(radius || 999);
    let filtered = matches.filter((item) => {
      const scoreOk = item.score >= Number(minScore || 0);
      const distOk = item.distanceKm == null || item.distanceKm <= r;
      return scoreOk && distOk;
    });

    filtered.sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "distance") {
        const ad = a.distanceKm == null ? Infinity : a.distanceKm;
        const bd = b.distanceKm == null ? Infinity : b.distanceKm;
        return ad - bd;
      }
      return 0;
    });

    return filtered;
  }, [matches, minScore, radius, sortBy]);

  const activeId = visibleMatches.some((item) => item.id === selectedId) ? selectedId : visibleMatches[0]?.id || "";

  const selectedMatch = visibleMatches.find((item) => item.id === activeId) || null;

  const displayMatch = useMemo(() => {
    if (!selectedMatch) return null;
    if (detailOverlay && detailOverlay.id === selectedMatch.id) {
      return { ...selectedMatch, ...detailOverlay };
    }
    return selectedMatch;
  }, [selectedMatch, detailOverlay]);

  useEffect(() => {
    if (!activeId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale detail when nothing selected
      setDetailOverlay(null);
      return;
    }
    const base = matches.find((m) => m.id === activeId);
    if (!base || base.source !== "api") {
      setDetailOverlay(null);
      return;
    }
    let cancelled = false;
    matchesApi.getDetail(activeId).then((detail) => {
      if (cancelled || !detail) return;
      setDetailOverlay({ id: activeId, ...mapMatchDetailToView(detail) });
    });
    return () => {
      cancelled = true;
    };
  }, [activeId, matches]);

  const feedbackByMatch = useMemo(() => {
    return Object.fromEntries(feedback.map((entry) => [entry.matchId, entry]));
  }, [feedback]);

  return (
    <div className="workspace-page" style={{ gap: 28 }}>
      {/* Header */}
      <div>
        <div
          className="eyebrow"
          style={{ marginBottom: 12, color: "var(--primary)", borderLeft: "3px solid var(--primary)", paddingLeft: 10 }}
        >
          {mapMode ? "Geographic view" : "Ranked opportunities"}
        </div>
        <h1 style={{ margin: 0, fontSize: "clamp(28px, 6vw, 42px)", lineHeight: 1.1, marginBottom: 8 }}>
          {mapMode ? "Map view" : "Waste Heat Recovery Matches"}
        </h1>
        <p style={{ marginBottom: 0, color: "var(--text-muted)", maxWidth: 700, fontSize: 15 }}>
          {mapMode
            ? "Explore thermal partnerships by geographic location and pipe distance feasibility."
            : "Review compatibility scores based on proximity, temperature fit, and operating schedule overlap. Give feedback to help improve future matches."}
        </p>
        {!mapMode ? (
          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button
              variant="soft"
              disabled={generating}
              onClick={async () => {
                setGenerating(true);
                try {
                  await matchesApi.generate(100);
                  reload();
                } catch {
                  /* toast TBD */
                } finally {
                  setGenerating(false);
                }
              }}
            >
              {generating ? "Generating…" : "Generate / refresh matches"}
            </Button>
            <Link href="/dashboard/home">
              <Button variant="ghost">Open workspace home</Button>
            </Link>
          </div>
        ) : null}
      </div>

      {/* Filters and controls */}
      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          maxWidth: "600px",
        }}
      >
        <Field label="Minimum score">
          <Input value={minScore} onChange={(event) => setMinScore(event.target.value)} type="number" placeholder="0-100" />
        </Field>
        <Field label="Radius (km)">
          <Input value={radius} onChange={(event) => setRadius(event.target.value)} type="number" placeholder="0-100" />
        </Field>
        <Field label="Sort by">
          <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="score">Compatibility score</option>
            <option value="distance">Nearest first</option>
          </Select>
        </Field>
      </div>

      {/* Main content */}
      <div
        style={{
          display: "grid",
          gap: 20,
          gridTemplateColumns: mapMode ? "1fr 1fr" : "360px 1fr",
          alignItems: "start",
        }}
      >
        {/* Left column - List or Map */}
        <div style={{ display: "grid", gap: 12 }}>
          {mapMode ? (
            <div
              style={{
                minHeight: 360,
                borderRadius: "var(--radius-md)",
                background: "linear-gradient(135deg, rgba(47,97,255,0.1), var(--surface-soft))",
                border: "2px solid var(--border)",
                boxShadow: "var(--shadow-soft)",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                color: "var(--text-muted)",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                Map preview
              </div>
              <p style={{ margin: 0, textAlign: "center", maxWidth: 280 }}>
                MapLibre integration ready. Live facility coordinates and tile configuration coming soon.
              </p>
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 22,
                  height: 22,
                  borderRadius: 999,
                  border: "3px solid white",
                  background: "#2f61ff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
                title="Your facility"
              />
              {visibleMatches.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  style={{
                    position: "absolute",
                    left: `${20 + (index % 5) * 15}%`,
                    top: `${30 + Math.floor(index / 5) * 20}%`,
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    border: "2px solid white",
                    background: item.id === activeId ? "var(--primary)" : item.score >= 80 ? "var(--good)" : "var(--bad)",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    transition: "all 120ms ease",
                  }}
                  title={item.counterpartName}
                />
              ))}
            </div>
          ) : null}

          <div
            style={{
              display: "grid",
              gap: 10,
              maxHeight: mapMode ? "calc(100vh - 580px)" : "calc(100vh - 400px)",
              overflowY: "auto",
              paddingRight: 8,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, paddingX: 4 }}>
              <strong style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-muted)" }}>
                {visibleMatches.length} matches
              </strong>
              {visibleMatches.length !== matches.length && (
                <Badge tone="neutral" style={{ fontSize: 11 }}>
                  Filtered
                </Badge>
              )}
            </div>

            {visibleMatches.length ? (
              visibleMatches.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  style={{
                    textAlign: "left",
                    padding: "14px 12px",
                    borderRadius: "var(--radius-sharp)",
                    border: `2px solid ${item.id === activeId ? "var(--primary)" : "var(--border)"}`,
                    borderLeft: item.id === activeId ? "5px solid var(--primary)" : undefined,
                    background: item.id === activeId ? "var(--primary-soft)" : "var(--surface)",
                    boxShadow: item.id === activeId ? "3px 3px 0 rgba(47, 97, 255, 0.15)" : "none",
                    cursor: "pointer",
                    display: "grid",
                    gap: 8,
                    transition: "all 120ms ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: 13 }}>{item.counterpartName}</strong>
                    </div>
                    <Badge tone={scoreTone(item.score)} style={{ fontSize: 11, whiteSpace: "nowrap" }}>
                      {item.score}
                    </Badge>
                  </div>
                  <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 12 }}>{item.summary}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Badge tone="neutral" style={{ fontSize: 10 }}>
                      {item.distanceKm != null ? `${item.distanceKm} km` : "Distance —"}
                    </Badge>
                    <Badge tone="primary" style={{ fontSize: 10 }}>
                      {item.temperatureFit}
                    </Badge>
                    <Badge tone="good" style={{ fontSize: 10 }}>
                      {item.scheduleOverlap}
                    </Badge>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <Link
                      href={`/dashboard/matches/${item.id}`}
                      style={{
                        color: "var(--primary)",
                        fontSize: 12,
                        textDecoration: "none",
                        fontWeight: 600,
                      }}
                    >
                      Open match detail
                    </Link>
                  </div>
                </button>
              ))
            ) : (
              <div
                style={{
                  padding: 24,
                  textAlign: "center",
                  color: "var(--text-muted)",
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    color: "var(--text-muted)",
                    marginBottom: 8,
                  }}
                >
                  NO RESULTS
                </div>
                <h3 style={{ margin: 0, color: "var(--text)", fontSize: 14 }}>No matches found</h3>
                <p style={{ margin: "6px 0 0", fontSize: 12 }}>
                  Try adjusting the radius or lowering the score threshold.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right column - Detail */}
        <div
          style={{
            padding: "24px",
            borderRadius: "var(--radius-md)",
            background: "var(--surface)",
            border: "2px solid var(--border)",
            boxShadow: "var(--shadow-soft)",
            maxHeight: "calc(100vh - 220px)",
            overflowY: "auto",
          }}
        >
          <MatchDetail
            match={displayMatch}
            feedback={displayMatch ? feedbackByMatch[displayMatch.id] : null}
            onFeedbackSaved={(entry) => {
              setFeedback((current) => [...current.filter((item) => item.matchId !== entry.matchId), entry]);
            }}
          />
        </div>
      </div>
    </div>
  );
}
