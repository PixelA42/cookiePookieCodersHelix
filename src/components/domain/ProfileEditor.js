"use client";

import { useMemo, useState } from "react";
import { Badge, Field, Input, Select, Textarea } from "@/components/ui/primitives";

const BASICS = { companyName: "", facilityName: "", role: "producer", location: "", latitude: "", longitude: "" };
const PRODUCER_FIELDS = { producerHeatGrade: "high", producerTemperatureC: "", producerVolumeM3h: "", producerHeatSchedule: "", notes: "" };
const CONSUMER_FIELDS = { consumerThermalDemandM3h: "", consumerMinTemperatureC: "", consumerSeasonalNeeds: "", consumerHeatSchedule: "", notes: "" };

export const PROFILE_STEPS = [
  { id: "basics", title: "Facility & geolocation", icon: "A" },
  { id: "capacity", title: "Thermal profile", icon: "B" },
  { id: "review", title: "Review", icon: "C" },
];

function normalizeRole(role) {
  if (role === "producer" || role === "consumer") return role;
  if (role === "heat-source") return "producer";
  if (role === "heat-sink") return "consumer";
  return "producer";
}

function mergeInitialProfile(initialProfile) {
  if (!initialProfile) return { ...BASICS, ...PRODUCER_FIELDS };
  const role = normalizeRole(initialProfile.role);
  return { ...BASICS, ...(role === "consumer" ? CONSUMER_FIELDS : PRODUCER_FIELDS), ...initialProfile, role };
}

export default function ProfileEditor({ initialProfile, title, subtitle, titleAccent = "", submitLabel = "Save profile", onSubmit }) {
  const [profile, setProfile] = useState(() => mergeInitialProfile(initialProfile));
  const [stepIndex, setStepIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [geoBusy, setGeoBusy] = useState(false);

  const step = PROFILE_STEPS[stepIndex];
  const isConsumer = normalizeRole(profile.role) === "consumer";

  const stepsComplete = useMemo(
    () => ({
      basics: Boolean(profile.companyName && profile.facilityName && profile.location && profile.latitude !== "" && profile.longitude !== ""),
      capacity: Boolean(
        isConsumer
          ? profile.consumerThermalDemandM3h && profile.consumerMinTemperatureC && profile.consumerSeasonalNeeds && profile.consumerHeatSchedule
          : profile.producerHeatGrade && profile.producerTemperatureC && profile.producerVolumeM3h && profile.producerHeatSchedule
      ),
    }),
    [isConsumer, profile]
  );

  const updateField = (name, value) => {
    setProfile((current) => {
      if (name === "role") {
        const role = normalizeRole(value);
        return { ...current, role, ...(role === "consumer" ? CONSUMER_FIELDS : PRODUCER_FIELDS) };
      }
      return { ...current, [name]: value };
    });
  };

  const fillCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
      return;
    }
    setGeoBusy(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setProfile((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
          location: current.location || `Approximate coordinates ${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)}`,
        }));
        setGeoBusy(false);
      },
      () => {
        setError("Could not fetch your current coordinates. You can still enter them manually.");
        setGeoBusy(false);
      }
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit({ ...profile, role: normalizeRole(profile.role) });
    } catch (submissionError) {
      setError(submissionError.message || "Could not save profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="any-page" style={{ maxWidth: 1080, gap: 20 }}>
      <div className="any-card" style={{ display: "grid", gap: 12 }}>
        <h1 className="any-title">
          {title}
          {titleAccent ? (
            <>
              <br />
              <span className="any-title-accent">{titleAccent}</span>
            </>
          ) : null}
        </h1>
        <p className="any-subtitle" style={{ marginTop: 0 }}>{subtitle}</p>
        <p className="any-section-label" style={{ marginTop: 4 }}>Setup flow</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {PROFILE_STEPS.map((item, idx) => {
            const active = idx === stepIndex;
            const complete = idx < stepIndex || (item.id === "basics" && stepsComplete.basics) || (item.id === "capacity" && stepsComplete.capacity);
            return (
              <span
                key={item.id}
                className={`any-pill${active ? " accent" : ""}`}
              >
                <span>{complete ? "Done" : item.icon}</span>
                <span>{item.title}</span>
              </span>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        {step.id === "basics" ? (
          <div className="any-card" style={{ display: "grid", gap: 20 }}>
            <p className="any-section-label" style={{ margin: 0 }}>Facility basics</p>
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <Field label="Organization name"><Input value={profile.companyName} onChange={(event) => updateField("companyName", event.target.value)} /></Field>
              <Field label="Facility name"><Input value={profile.facilityName} onChange={(event) => updateField("facilityName", event.target.value)} /></Field>
              <Field label="Facility role"><Select value={profile.role} onChange={(event) => updateField("role", event.target.value)}><option value="producer">Producer</option><option value="consumer">Consumer</option></Select></Field>
              <Field label="Location label"><Input value={profile.location} onChange={(event) => updateField("location", event.target.value)} /></Field>
              <Field label="Latitude"><Input value={profile.latitude} onChange={(event) => updateField("latitude", event.target.value)} /></Field>
              <Field label="Longitude"><Input value={profile.longitude} onChange={(event) => updateField("longitude", event.target.value)} /></Field>
            </div>
            <button type="button" className="any-btn-secondary" onClick={fillCurrentLocation} disabled={geoBusy}>{geoBusy ? "Detecting..." : "Use current location"}</button>
          </div>
        ) : null}

        {step.id === "capacity" ? (
          <div className="any-card" style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            <p className="any-section-label" style={{ margin: 0, gridColumn: "1 / -1" }}>Thermal profile</p>
            {isConsumer ? (
              <>
                <Field label="Thermal demand (m3/h)"><Input value={profile.consumerThermalDemandM3h} onChange={(event) => updateField("consumerThermalDemandM3h", event.target.value)} /></Field>
                <Field label="Minimum required temperature (C)"><Input value={profile.consumerMinTemperatureC} onChange={(event) => updateField("consumerMinTemperatureC", event.target.value)} /></Field>
                <Field label="Seasonal needs"><Input value={profile.consumerSeasonalNeeds} onChange={(event) => updateField("consumerSeasonalNeeds", event.target.value)} /></Field>
                <Field label="Heat schedule"><Input value={profile.consumerHeatSchedule} onChange={(event) => updateField("consumerHeatSchedule", event.target.value)} /></Field>
              </>
            ) : (
              <>
                <Field label="Heat grade"><Select value={profile.producerHeatGrade} onChange={(event) => updateField("producerHeatGrade", event.target.value)}><option value="high">High</option><option value="low">Low</option></Select></Field>
                <Field label="Heat temperature (C)"><Input value={profile.producerTemperatureC} onChange={(event) => updateField("producerTemperatureC", event.target.value)} /></Field>
                <Field label="Heat volume (m3/h)"><Input value={profile.producerVolumeM3h} onChange={(event) => updateField("producerVolumeM3h", event.target.value)} /></Field>
                <Field label="Heat schedule"><Input value={profile.producerHeatSchedule} onChange={(event) => updateField("producerHeatSchedule", event.target.value)} /></Field>
              </>
            )}
            <Field label="Additional notes (optional)"><Textarea value={profile.notes} onChange={(event) => updateField("notes", event.target.value)} style={{ minHeight: 90 }} /></Field>
          </div>
        ) : null}

        {step.id === "review" ? (
          <div className="any-card" style={{ display: "grid", gap: 14 }}>
            <p className="any-section-label" style={{ margin: 0 }}>Review</p>
            <Badge tone="neutral" style={{ width: "fit-content", border: "0.5px solid #ebb0a5", background: "#fff7f5", color: "#c65440" }}>{isConsumer ? "Consumer profile" : "Producer profile"}</Badge>
            <p style={{ margin: 0, color: "#888" }}>{profile.facilityName} at {profile.location}</p>
          </div>
        ) : null}

        {error ? <div style={{ padding: "12px 16px", borderRadius: 10, background: "#feeaea", border: "1px solid #ffd7d7", color: "var(--bad)", fontSize: 13 }}>{error}</div> : null}

        <div className="any-card" style={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <button type="button" className="any-btn-secondary" onClick={() => setStepIndex((current) => Math.max(0, current - 1))} disabled={stepIndex === 0 || busy}>Back</button>
          <div style={{ display: "flex", gap: 12 }}>
            {stepIndex < PROFILE_STEPS.length - 1 ? (
              <button type="button" className="any-btn-secondary" onClick={() => setStepIndex((current) => Math.min(PROFILE_STEPS.length - 1, current + 1))}>Continue</button>
            ) : (
              <button type="submit" className="any-btn-primary" disabled={busy}>{busy ? "Saving..." : submitLabel}</button>
            )}
          </div>
          </div>
        </div>
      </form>
    </div>
  );
}
