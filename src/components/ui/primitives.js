"use client";

export function Button({ children, variant = "primary", ...props }) {
  const styles = {
    primary: {
      background: "var(--primary)",
      color: "white",
      border: "1px solid var(--primary)",
    },
    ghost: {
      background: "transparent",
      color: "var(--text)",
      border: "1px solid var(--border)",
    },
    soft: {
      background: "var(--primary-soft)",
      color: "var(--primary)",
      border: "1px solid var(--primary-soft)",
    },
    danger: {
      background: "#fff3f3",
      color: "var(--bad)",
      border: "1px solid #ffd7d7",
    },
  };

  return (
    <button
      {...props}
      style={{
        padding: "10px 14px",
        borderRadius: "10px",
        fontWeight: 600,
        cursor: "pointer",
        transition: "transform 120ms ease, box-shadow 120ms ease, background 120ms ease",
        ...styles[variant],
        ...(props.disabled
          ? {
              opacity: 0.6,
              cursor: "not-allowed",
            }
          : {}),
      }}
    >
      {children}
    </button>
  );
}

export function Input(props) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: "10px",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        color: "var(--text)",
      }}
    />
  );
}

export function Select(props) {
  return (
    <select
      {...props}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: "10px",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        color: "var(--text)",
      }}
    />
  );
}

export function Textarea(props) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%",
        minHeight: 110,
        padding: "10px 12px",
        borderRadius: "10px",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        color: "var(--text)",
        resize: "vertical",
        ...props.style,
      }}
    />
  );
}

export function Card({ children, style, strong = false }) {
  return (
    <div className={`card${strong ? " card-strong" : ""}`} style={{ padding: "20px", ...style }}>
      {children}
    </div>
  );
}

export function Badge({ children, tone = "neutral" }) {
  const tones = {
    neutral: { background: "var(--surface-soft)", color: "var(--text-muted)" },
    good: { background: "#e8f8ef", color: "var(--good)" },
    bad: { background: "#feeaea", color: "var(--bad)" },
    primary: { background: "var(--primary-soft)", color: "var(--primary)" },
  };

  return (
    <span
      style={{
        padding: "4px 8px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 600,
        ...tones[tone],
      }}
    >
      {children}
    </span>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={{ fontSize: 14, fontWeight: 600 }}>{label}</span>
      {children}
      {hint ? <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{hint}</span> : null}
    </label>
  );
}

export function Divider() {
  return <div style={{ height: 1, background: "var(--border)", width: "100%" }} />;
}
