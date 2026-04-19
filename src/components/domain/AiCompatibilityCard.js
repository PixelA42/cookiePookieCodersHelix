"use client";

import { useMemo, useState } from "react";

export default function AiCompatibilityCard() {
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const payload = {
    distance_km: 5.2,
    producer_temp_c: 85.0,
    consumer_min_temp_c: 40.0,
    volume_match_ratio: 0.8,
    schedule_overlap_ratio: 1.0,
  };

  const badgeClasses = useMemo(() => {
    if (score == null) return "bg-gray-100 text-gray-700 border-gray-200";
    if (score > 80) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (score > 50) return "bg-amber-100 text-amber-700 border-amber-200";
    return "bg-rose-100 text-rose-700 border-rose-200";
  }, [score]);

  const badgeLabel = useMemo(() => {
    if (score == null) return "Not calculated";
    if (score > 80) return "High Compatibility";
    if (score > 50) return "Moderate Compatibility";
    return "Low Compatibility";
  }, [score]);

  const calculateScore = async () => {
    setLoading(true);
    setError("");
    setStatus("");
    setScore(null);
    setBreakdown(null);

    try {
      const response = await fetch("http://localhost:8000/api/v1/calculate-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const data = await response.json();
      setStatus(data.status || "");

      if (typeof data.compatibility_score !== "number") {
        throw new Error("Invalid response from backend");
      }
      setScore(data.compatibility_score);
      setBreakdown({
        proximity_score: data.proximity_score,
        temperature_fit_score: data.temperature_fit_score,
        volume_fit_score: data.volume_fit_score,
        schedule_fit_score: data.schedule_fit_score,
      });
    } catch (err) {
      setError(err?.message || "Failed to calculate score");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full max-w-3xl rounded-2xl border border-gray-200 bg-white p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-semibold text-gray-900">AI Compatibility</h2>
        <p className="mt-1 text-sm text-gray-500">Calculate a test compatibility score from your FastAPI model endpoint.</p>
      </div>

      <button
        type="button"
        onClick={calculateScore}
        disabled={loading}
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Calculating..." : "Calculate AI Compatibility"}
      </button>

      <div className="mt-5 rounded-xl border border-gray-200 p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Compatibility Score</p>

        {loading ? <p className="mt-3 text-sm text-gray-600">Fetching score from backend...</p> : null}

        {!loading && error ? (
          <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}

        {!loading && !error && score != null ? (
          <>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-5xl font-extrabold leading-none text-gray-900">{score.toFixed(1)}</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClasses}`}>{badgeLabel}</span>
            </div>

            {breakdown ? (
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">
                  <span className="text-gray-500">Proximity</span>
                  <div className="font-semibold text-gray-900">{typeof breakdown.proximity_score === "number" ? breakdown.proximity_score.toFixed(1) : "-"}</div>
                </div>
                <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">
                  <span className="text-gray-500">Temperature Fit</span>
                  <div className="font-semibold text-gray-900">{typeof breakdown.temperature_fit_score === "number" ? breakdown.temperature_fit_score.toFixed(1) : "-"}</div>
                </div>
                <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">
                  <span className="text-gray-500">Volume Fit</span>
                  <div className="font-semibold text-gray-900">{typeof breakdown.volume_fit_score === "number" ? breakdown.volume_fit_score.toFixed(1) : "-"}</div>
                </div>
                <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">
                  <span className="text-gray-500">Schedule Fit</span>
                  <div className="font-semibold text-gray-900">{typeof breakdown.schedule_fit_score === "number" ? breakdown.schedule_fit_score.toFixed(1) : "-"}</div>
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        {!loading && !error && score == null ? <p className="mt-3 text-sm text-gray-500">Click to calculate.</p> : null}
        {!loading && !error && status ? <p className="mt-3 text-xs text-gray-500">Status: {status}</p> : null}
      </div>
    </section>
  );
}