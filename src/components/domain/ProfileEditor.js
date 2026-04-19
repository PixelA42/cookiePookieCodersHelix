"use client";

import { useMemo, useState } from "react";
import { Badge, Button, Divider, Field, Input, Select, Textarea } from "@/components/ui/primitives";

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

export default function ProfileEditor({ initialProfile, title, subtitle, submitLabel = "Save profile", onSubmit }) {
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
    <div style={{ display: "grid", gap: 32, maxWidth: 980 }}>
      <div style={{ display: "grid", gap: 12 }}>
        <div className="eyebrow" style={{ marginBottom: 0, display: "inline-flex", width: "fit-content", borderLeft: "3px solid var(--primary)", paddingLeft: 10 }}>Setup flow</div>
        <h1 style={{ margin: 0, fontSize: "clamp(28px, 6vw, 40px)", lineHeight: 1.1 }}>{title}</h1>
        <p style={{ marginBottom: 0, color: "var(--text-muted)", maxWidth: 760, fontSize: 15 }}>{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 24 }}>
        {step.id === "basics" ? (
          <div style={{ display: "grid", gap: 20 }}>
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
              <Field label="Organization name"><Input value={profile.companyName} onChange={(event) => updateField("companyName", event.target.value)} /></Field>
              <Field label="Facility name"><Input value={profile.facilityName} onChange={(event) => updateField("facilityName", event.target.value)} /></Field>
              <Field label="Facility role"><Select value={profile.role} onChange={(event) => updateField("role", event.target.value)}><option value="producer">Producer</option><option value="consumer">Consumer</option></Select></Field>
              <Field label="Location label"><Input value={profile.location} onChange={(event) => updateField("location", event.target.value)} /></Field>
              <Field label="Latitude"><Input value={profile.latitude} onChange={(event) => updateField("latitude", event.target.value)} /></Field>
              <Field label="Longitude"><Input value={profile.longitude} onChange={(event) => updateField("longitude", event.target.value)} /></Field>
            </div>
            <Button type="button" variant="soft" onClick={fillCurrentLocation} disabled={geoBusy}>{geoBusy ? "Detecting..." : "Use current location"}</Button>
          </div>
        ) : null}

        {step.id === "capacity" ? (
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
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
          <div style={{ display: "grid", gap: 14 }}>
            <Badge tone="primary">{isConsumer ? "Consumer profile" : "Producer profile"}</Badge>
            <p style={{ margin: 0, color: "var(--text-muted)" }}>{profile.facilityName} at {profile.location}</p>
          </div>
        ) : null}

        {error ? <div style={{ padding: "12px 16px", borderRadius: 10, background: "#feeaea", border: "1px solid #ffd7d7", color: "var(--bad)", fontSize: 13 }}>{error}</div> : null}

        <Divider />
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <Button type="button" variant="ghost" onClick={() => setStepIndex((current) => Math.max(0, current - 1))} disabled={stepIndex === 0 || busy}>Back</Button>
          <div style={{ display: "flex", gap: 12 }}>
            {stepIndex < PROFILE_STEPS.length - 1 ? (
              <Button type="button" onClick={() => setStepIndex((current) => Math.min(PROFILE_STEPS.length - 1, current + 1))}>Continue</Button>
            ) : (
              <Button type="submit" disabled={busy}>{busy ? "Saving..." : submitLabel}</Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
