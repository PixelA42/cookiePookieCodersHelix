"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Field, Input, Select, Textarea } from "@/components/ui/primitives";
import { feedbackApi, mapMatchDetailToView, matchesApi } from "@/lib/api/client";

function normalizeRating(value) {
  if (value === "not_useful") return "not-useful";
  return value || "";
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
        <button type="button" className="any-btn-primary" disabled={busy} onClick={() => submit("useful")}>Useful</button>
        <button type="button" className="any-btn-secondary" disabled={busy} onClick={() => submit("not-useful")}>Not useful</button>
      </div>
      <Field label="Reason (optional)">
        <Textarea value={reason} onChange={(event) => setReason(event.target.value)} style={{ minHeight: 88 }} />
      </Field>
      <button type="button" className="any-btn-secondary" disabled={busy || !rating} onClick={() => submit(rating)}>
        Save feedback note
      </button>
    </div>
  );
}

function MatchDetail({ match, feedback, onFeedbackSaved }) {
  if (!match) {
    return (
      <div className="any-empty" style={{ minHeight: 260 }}>
        <h2 style={{ margin: "0 0 8px", color: "#111" }}>No match selected</h2>
        <p style={{ margin: 0, maxWidth: 360, color: "#999" }}>
          Choose a ranked partner from the list to inspect temperature, distance, and schedule fit.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <section className="any-card">
        <p className="any-section-label" style={{ margin: 0 }}>Match detail</p>
        <h2 style={{ margin: "10px 0 0", fontSize: 28, fontFamily: '"Iowan Old Style", "Baskerville", serif' }}>{match.counterpartName}</h2>
        <p style={{ margin: "6px 0 0", color: "#999", fontSize: 14 }}>{match.summary}</p>
        <div style={{ marginTop: 10 }}>
          <span className="any-pill accent">{match.score}/100 fit</span>
        </div>
      </section>

      <section className="any-card">
        <p className="any-section-label" style={{ margin: 0 }}>Compatibility factors</p>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", marginTop: 10 }}>
          <div style={{ border: "0.5px solid #e0ddd6", borderRadius: 12, padding: 14 }}>
            <p className="any-section-label" style={{ margin: "0 0 6px" }}>Distance</p>
            <strong>{match.distanceKm != null ? `${match.distanceKm} km` : "-"}</strong>
          </div>
          <div style={{ border: "0.5px solid #e0ddd6", borderRadius: 12, padding: 14 }}>
            <p className="any-section-label" style={{ margin: "0 0 6px" }}>Temperature</p>
            <strong>{match.temperatureFit}</strong>
          </div>
          <div style={{ border: "0.5px solid #e0ddd6", borderRadius: 12, padding: 14 }}>
            <p className="any-section-label" style={{ margin: "0 0 6px" }}>Schedule</p>
            <strong>{match.scheduleOverlap}</strong>
          </div>
        </div>
      </section>

      <section className="any-card">
        <p className="any-section-label" style={{ margin: 0 }}>Why this pairing works</p>
        <ul style={{ margin: "10px 0 0", paddingLeft: 18, color: "#777", lineHeight: 1.6 }}>
          {(match.explanation || []).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="any-card">
        <p className="any-section-label" style={{ margin: 0 }}>Contact information</p>
        <div className="any-meta-row">
          <span className="any-meta-label">Location</span>
          <span className="any-meta-value">{match.location || "-"}</span>
        </div>
        <div className="any-meta-row">
          <span className="any-meta-label">Contact</span>
          <span className="any-meta-value">{match.contact || "-"}</span>
        </div>
      </section>

      <section className="any-card">
        <p className="any-section-label" style={{ margin: 0 }}>Feedback loop</p>
        <p style={{ margin: "8px 0 0", color: "#999", fontSize: 12 }}>
          Help improve recommendations with your feedback.
        </p>
        <div style={{ marginTop: 10 }}>
          <FeedbackButtons matchId={match.id} existingFeedback={feedback} onSaved={onFeedbackSaved} />
        </div>
      </section>
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
      setSelectedId((current) => (nextMatches.some((m) => m.id === current) ? current : nextMatches[0]?.id || ""));
      setFeedback(nextFeedback);
    });
  };

  useEffect(() => {
    reload();
  }, []);

  const visibleMatches = useMemo(() => {
    const r = Number(radius || 999);
    const filtered = matches.filter((item) => {
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
    if (detailOverlay && detailOverlay.id === selectedMatch.id) return { ...selectedMatch, ...detailOverlay };
    return selectedMatch;
  }, [selectedMatch, detailOverlay]);

  useEffect(() => {
    if (!activeId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear stale overlay when no active match is selected
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

  const feedbackByMatch = useMemo(() => Object.fromEntries(feedback.map((entry) => [entry.matchId, entry])), [feedback]);

  return (
    <div className="any-page" style={{ gap: 22 }}>
      <section className="any-card" style={{ display: "grid", gap: 10 }}>
        <p className="any-section-label" style={{ margin: 0 }}>{mapMode ? "Geographic view" : "Ranked opportunities"}</p>
        <h1 className="any-title" style={{ marginBottom: 4 }}>
          {mapMode ? "Map" : "Waste heat"}
          <br />
          <span className="any-title-accent">{mapMode ? "exploration" : "matches"}</span>
        </h1>
        <p className="any-subtitle" style={{ marginTop: 0, marginBottom: 0, maxWidth: 720 }}>
          {mapMode
            ? "Explore thermal partnerships by geographic location and distance feasibility."
            : "Review compatibility scores and submit feedback to improve future match quality."}
        </p>
        {!mapMode ? (
          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className="any-btn-primary"
              disabled={generating}
              onClick={async () => {
                setGenerating(true);
                try {
                  await matchesApi.generate(100);
                  reload();
                } finally {
                  setGenerating(false);
                }
              }}
            >
              {generating ? "Generating..." : "Generate / refresh matches"}
            </button>
            <Link href="/dashboard/home">
              <button type="button" className="any-btn-secondary">Open workspace home</button>
            </Link>
          </div>
        ) : null}
      </section>

      <section className="any-card" style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", maxWidth: 760 }}>
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
      </section>

      <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", alignItems: "start" }}>
        <section className="any-card" style={{ display: "grid", gap: 12 }}>
          {mapMode ? (
            <div
              style={{
                minHeight: 330,
                border: "0.5px solid #e0ddd6",
                borderRadius: 12,
                display: "grid",
                placeItems: "center",
                color: "#999",
                position: "relative",
              }}
            >
              <p style={{ margin: 0, textAlign: "center", maxWidth: 260 }}>
                Map preview area. Markers represent filtered candidate facilities.
              </p>
              {visibleMatches.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  style={{
                    position: "absolute",
                    left: `${20 + (index % 5) * 15}%`,
                    top: `${30 + Math.floor(index / 5) * 20}%`,
                    width: 18,
                    height: 18,
                    borderRadius: 999,
                    border: "2px solid #fff",
                    background: item.id === activeId ? "#e05b42" : "#222",
                    cursor: "pointer",
                  }}
                  title={item.counterpartName}
                />
              ))}
            </div>
          ) : null}

          <div style={{ display: "grid", gap: 10, maxHeight: mapMode ? "calc(100vh - 520px)" : "calc(100vh - 360px)", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <p className="any-section-label" style={{ margin: 0 }}>{visibleMatches.length} matches</p>
              {visibleMatches.length !== matches.length ? <span className="any-pill">Filtered</span> : null}
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
                    borderRadius: 10,
                    border: `0.5px solid ${item.id === activeId ? "#ebb0a5" : "#e0ddd6"}`,
                    background: item.id === activeId ? "#fff7f5" : "#fff",
                    cursor: "pointer",
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                    <strong style={{ fontSize: 13 }}>{item.counterpartName}</strong>
                    <span className="any-pill accent">{item.score}</span>
                  </div>
                  <p style={{ margin: 0, color: "#999", fontSize: 12 }}>{item.summary}</p>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span className="any-pill">{item.distanceKm != null ? `${item.distanceKm} km` : "Distance -"}</span>
                    <span className="any-pill accent">{item.temperatureFit}</span>
                    <span className="any-pill">{item.scheduleOverlap}</span>
                  </div>
                  <div>
                    <Link href={`/dashboard/matches/${item.id}`} style={{ color: "#c65440", fontSize: 12, fontWeight: 600 }}>
                      Open match detail
                    </Link>
                  </div>
                </button>
              ))
            ) : (
              <div className="any-empty">No matches found. Try adjusting radius or score threshold.</div>
            )}
          </div>
        </section>

        <section className="any-card" style={{ maxHeight: "calc(100vh - 220px)", overflowY: "auto" }}>
          <MatchDetail
            match={displayMatch}
            feedback={displayMatch ? feedbackByMatch[displayMatch.id] : null}
            onFeedbackSaved={(entry) => {
              setFeedback((current) => [...current.filter((item) => item.matchId !== entry.matchId), entry]);
            }}
          />
        </section>
      </div>
    </div>
  );
}
