"use client";

export function Button({ children, variant = "primary", shape = "rounded", style, ...props }) {
  const styles = {
    primary: {
      background: "#181d27",
      color: "#f7f9fc",
      border: "1px solid #181d27",
    },
    ghost: {
      background: "#f8fafd",
      color: "#2a3140",
      border: "1px solid #dbe1eb",
    },
    soft: {
      background: "#eef1f6",
      color: "#2d3648",
      border: "1px solid #d7dde8",
    },
    danger: {
      background: "#fff5f5",
      color: "#ba2f3f",
      border: "1px solid #ffdce2",
    },
  };

  const radius = shape === "sharp" ? "var(--radius-sharp)" : "10px";

  return (
    <button
      {...props}
      style={{
        padding: "10px 14px",
        borderRadius: radius,
        fontWeight: 600,
        cursor: "pointer",
        transition: "transform 120ms ease, box-shadow 120ms ease, background 120ms ease",
        boxShadow: props.disabled ? "none" : "0 3px 10px rgba(20, 33, 58, 0.06)",
        ...styles[variant],
        ...(props.disabled
          ? {
              opacity: 0.6,
              cursor: "not-allowed",
              boxShadow: "none",
            }
          : {}),
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function inputRadius(shape) {
  return shape === "sharp" ? "var(--radius-sharp)" : "10px";
}

export function Input({ shape = "rounded", style, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: inputRadius(shape),
        border: "1px solid #d8dee8",
        background: "#fff",
        color: "var(--text)",
        ...style,
      }}
    />
  );
}

export function Select({ shape = "rounded", style, ...props }) {
  return (
    <select
      {...props}
      style={{
        width: "100%",
        padding: "10px 12px",
        borderRadius: inputRadius(shape),
        border: "1px solid #d8dee8",
        background: "#fff",
        color: "var(--text)",
        ...style,
      }}
    />
  );
}

export function Textarea({ shape = "rounded", style, ...props }) {
  return (
    <textarea
      {...props}
      style={{
        width: "100%",
        minHeight: 110,
        padding: "10px 12px",
        borderRadius: inputRadius(shape),
        border: "1px solid #d8dee8",
        background: "#fff",
        color: "var(--text)",
        resize: "vertical",
        ...style,
      }}
    />
  );
}

export function Card({ children, style, strong = false, variant = "default" }) {
  const className = `card${strong ? " card-strong" : ""}`;

  return (
    <div className={className} style={{ padding: "20px", ...style }}>
      {children}
    </div>
  );
}

export function Badge({ children, tone = "neutral", shape = "pill", style, ...props }) {
  const tones = {
    neutral: { background: "var(--surface-soft)", color: "var(--text-muted)" },
    good: { background: "#e8f8ef", color: "var(--good)" },
    bad: { background: "#feeaea", color: "var(--bad)" },
    primary: { background: "var(--primary-soft)", color: "var(--primary)" },
  };

  const borderRadius = shape === "tag" ? "var(--radius-sharp)" : "999px";
  const border =
    shape === "tag"
      ? {
          border: "1px solid var(--border-strong)",
          boxShadow: "2px 2px 0 rgba(19, 23, 34, 0.06)",
        }
      : {};

  return (
    <span
      {...props}
      style={{
        padding: shape === "tag" ? "4px 10px" : "4px 8px",
        borderRadius,
        fontSize: "12px",
        fontWeight: 600,
        ...tones[tone],
        ...border,
        ...style,
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

export function Divider({ style, ...props }) {
  return <div {...props} style={{ height: 1, background: "var(--border)", width: "100%", ...style }} />;
}
