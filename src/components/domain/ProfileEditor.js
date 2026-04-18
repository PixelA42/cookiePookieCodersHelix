"use client";

import { useMemo, useState } from "react";
import { Button, Card, Field, Input, Select, Textarea } from "@/components/ui/primitives";

const BASICS = {
  companyName: "",
  facilityName: "",
  role: "producer",
  location: "",
};

const PRODUCER_FIELDS = {
  supplyTemperature: "",
  outputCapacity: "",
  schedule: "",
  notes: "",
};

const CONSUMER_FIELDS = {
  requiredTemperature: "",
  flowRate: "",
  schedule: "",
  notes: "",
};

export const PROFILE_STEPS = [
  { id: "basics", title: "Facility basics" },
  { id: "capacity", title: "Heat profile" },
  { id: "review", title: "Review" },
];

function mergeInitialProfile(initialProfile) {
  if (!initialProfile) {
    return { ...BASICS, ...PRODUCER_FIELDS };
  }

  return {
    ...BASICS,
    ...(initialProfile.role === "consumer" ? CONSUMER_FIELDS : PRODUCER_FIELDS),
    ...initialProfile,
  };
}

export default function ProfileEditor({
  initialProfile,
  title,
  subtitle,
  submitLabel = "Save profile",
  onSubmit,
}) {
  const [profile, setProfile] = useState(() => mergeInitialProfile(initialProfile));
  const [stepIndex, setStepIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const step = PROFILE_STEPS[stepIndex];
  const isConsumer = profile.role === "consumer";
  const stepsComplete = useMemo(
    () => ({
      basics: Boolean(profile.companyName && profile.facilityName && profile.location),
      capacity: Boolean(
        isConsumer
          ? profile.requiredTemperature && profile.flowRate && profile.schedule
          : profile.supplyTemperature && profile.outputCapacity && profile.schedule
      ),
    }),
    [isConsumer, profile]
  );

  const updateField = (name, value) => {
    setProfile((current) => {
      if (name === "role") {
        return {
          ...current,
          role: value,
          ...(value === "consumer" ? CONSUMER_FIELDS : PRODUCER_FIELDS),
        };
      }
      return { ...current, [name]: value };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await onSubmit(profile);
    } catch (submissionError) {
      setError(submissionError.message || "Could not save profile");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "end", flexWrap: "wrap" }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            Setup flow
          </div>
          <h1 style={{ margin: 0, fontSize: 40, lineHeight: 1.1 }}>{title}</h1>
          <p style={{ marginBottom: 0, color: "var(--text-muted)", maxWidth: 700 }}>{subtitle}</p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {PROFILE_STEPS.map((item, index) => {
            const isActive = index === stepIndex;
            const completed = item.id === "review" ? stepsComplete.basics && stepsComplete.capacity : stepsComplete[item.id];
            return (
              <div
                key={item.id}
                className="card"
                style={{
                  padding: "10px 12px",
                  minWidth: 140,
                  borderColor: isActive ? "var(--primary)" : "var(--border)",
                  background: completed ? "var(--primary-soft)" : "rgba(255,255,255,0.8)",
                }}
              >
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Step {index + 1}</div>
                <strong>{item.title}</strong>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 18 }}>
        {step.id === "basics" ? (
          <Card strong style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <h2 style={{ margin: 0 }}>Tell us about the facility</h2>
              <p style={{ margin: 0, color: "var(--text-muted)" }}>
                Shared details that let us route you into the right producer or consumer workflow.
              </p>
            </div>
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
              <Field label="Company name">
                <Input value={profile.companyName} onChange={(event) => updateField("companyName", event.target.value)} />
              </Field>
              <Field label="Facility name">
                <Input value={profile.facilityName} onChange={(event) => updateField("facilityName", event.target.value)} />
              </Field>
              <Field label="Role">
                <Select value={profile.role} onChange={(event) => updateField("role", event.target.value)}>
                  <option value="producer">Producer</option>
                  <option value="consumer">Consumer</option>
                </Select>
              </Field>
              <Field label="Location">
                <Input value={profile.location} onChange={(event) => updateField("location", event.target.value)} />
              </Field>
            </div>
          </Card>
        ) : null}

        {step.id === "capacity" ? (
          <Card strong style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gap: 6 }}>
              <h2 style={{ margin: 0 }}>{isConsumer ? "Describe your heat demand" : "Describe your heat output"}</h2>
              <p style={{ margin: 0, color: "var(--text-muted)" }}>
                We use this to score temperature fit, practical capacity, and timing overlap.
              </p>
            </div>
            <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
              {isConsumer ? (
                <>
                  <Field label="Required temperature">
                    <Input
                      value={profile.requiredTemperature}
                      onChange={(event) => updateField("requiredTemperature", event.target.value)}
                      placeholder="e.g. 70 C"
                    />
                  </Field>
                  <Field label="Flow rate / demand">
                    <Input
                      value={profile.flowRate}
                      onChange={(event) => updateField("flowRate", event.target.value)}
                      placeholder="e.g. 2.4 MW"
                    />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Supply temperature">
                    <Input
                      value={profile.supplyTemperature}
                      onChange={(event) => updateField("supplyTemperature", event.target.value)}
                      placeholder="e.g. 82 C"
                    />
                  </Field>
                  <Field label="Output capacity">
                    <Input
                      value={profile.outputCapacity}
                      onChange={(event) => updateField("outputCapacity", event.target.value)}
                      placeholder="e.g. 3.1 MW"
                    />
                  </Field>
                </>
              )}
              <Field label="Schedule">
                <Input
                  value={profile.schedule}
                  onChange={(event) => updateField("schedule", event.target.value)}
                  placeholder="Weekdays 07:00 to 18:00"
                />
              </Field>
              <Field label="Notes">
                <Textarea value={profile.notes} onChange={(event) => updateField("notes", event.target.value)} />
              </Field>
            </div>
          </Card>
        ) : null}

        {step.id === "review" ? (
          <Card strong style={{ display: "grid", gap: 14 }}>
            <h2 style={{ margin: 0 }}>Review before saving</h2>
            <div className="grid-auto">
              <Card style={{ padding: 16 }}>
                <strong>Organization</strong>
                <p style={{ margin: "8px 0 0", color: "var(--text-muted)" }}>
                  {profile.companyName} · {profile.facilityName}
                </p>
              </Card>
              <Card style={{ padding: 16 }}>
                <strong>Role and location</strong>
                <p style={{ margin: "8px 0 0", color: "var(--text-muted)" }}>
                  {profile.role} · {profile.location}
                </p>
              </Card>
              <Card style={{ padding: 16 }}>
                <strong>Heat profile</strong>
                <p style={{ margin: "8px 0 0", color: "var(--text-muted)" }}>
                  {isConsumer
                    ? `${profile.requiredTemperature} / ${profile.flowRate}`
                    : `${profile.supplyTemperature} / ${profile.outputCapacity}`}
                </p>
              </Card>
            </div>
            <Card style={{ padding: 16 }}>
              <strong>Schedule and notes</strong>
              <p style={{ margin: "8px 0 0", color: "var(--text-muted)" }}>{profile.schedule || "No schedule provided yet."}</p>
              <p style={{ marginBottom: 0, color: "var(--text-muted)" }}>{profile.notes || "No additional notes."}</p>
            </Card>
          </Card>
        ) : null}

        {error ? <p style={{ margin: 0, color: "var(--bad)" }}>{error}</p> : null}

        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <Button type="button" variant="ghost" onClick={() => setStepIndex((current) => Math.max(0, current - 1))} disabled={stepIndex === 0 || busy}>
            Back
          </Button>
          <div style={{ display: "flex", gap: 12 }}>
            {stepIndex < PROFILE_STEPS.length - 1 ? (
              <Button type="button" onClick={() => setStepIndex((current) => Math.min(PROFILE_STEPS.length - 1, current + 1))}>
                Continue
              </Button>
            ) : (
              <Button type="submit" disabled={busy}>
                {busy ? "Saving..." : submitLabel}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
