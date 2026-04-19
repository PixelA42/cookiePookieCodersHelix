"use client";

import { useMemo, useState } from "react";
import { getToken } from "@/lib/auth";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1").replace(/\/$/, "");
const DEFAULT_PAYLOAD = {
  distance_km: 5.2,
  producer_temp_c: 85.0,
  consumer_min_temp_c: 40.0,
  volume_match_ratio: 0.8,
  schedule_overlap_ratio: 1.0,
};

export default function AiCompatibilityCard() {
  const [loading, setLoading] = useState(false);
  const [score, setScore] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [comparisonContext, setComparisonContext] = useState("Click calculate to score against your nearest real counterpart.");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const applyScores = (data) => {
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
      const token = getToken();
      if (token) {
        const nearestResponse = await fetch(`${API_BASE}/calculate-score/nearest-context`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (nearestResponse.ok) {
          const nearestData = await nearestResponse.json();
          applyScores(nearestData);
          setComparisonContext(
            `Compared against nearest ${nearestData.counterpart_role} in ${nearestData.counterpart_city_zone}: ${nearestData.counterpart_label} (${Number(nearestData.distance_km || 0).toFixed(1)} km).`
          );
          return;
        }
      }

      const response = await fetch(`${API_BASE}/calculate-score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(DEFAULT_PAYLOAD),
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      const fallbackData = await response.json();
      applyScores(fallbackData);
      setComparisonContext("Used fallback sample values because nearest real counterpart context was unavailable.");
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
        <p className="mt-2 text-xs text-gray-500">{comparisonContext}</p>
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