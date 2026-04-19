"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/primitives";
import { connectionsApi } from "@/lib/api/client";

function tone(status) {
  if (status === "accepted") return "good";
  if (status === "rejected") return "bad";
  return "neutral";
}

export default function ConnectionsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = () => {
    setLoading(true);
    connectionsApi
      .list()
      .then((rows) => setItems(rows))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;
    connectionsApi
      .list()
      .then((rows) => {
        if (!active) return;
        setItems(rows);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p style={{ margin: 0, color: "#999" }}>Loading connections...</p>;
  }

  return (
    <div className="any-page">
      <div>
        <h1 className="any-title">
          Connection
          <br />
          <span className="any-title-accent">requests</span>
        </h1>
        <p className="any-subtitle" style={{ maxWidth: 760 }}>
          Track requests initiated from match detail pages and update statuses as your engineering conversations evolve.
        </p>
      </div>

      {!items.length ? (
        <div className="any-empty">
          No connection requests yet.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((item) => (
            <div key={item.id} className="any-card any-card-tight" style={{ display: "grid", gap: 10 }}>
              <p className="any-section-label" style={{ margin: 0 }}>Connection record</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <strong>{item.counterpart_organization_name}</strong>
                <Badge tone={tone(item.status)} style={{ border: "0.5px solid #e0ddd6", background: "#fff", color: "#555" }}>{item.status}</Badge>
              </div>
              <div className="any-meta-row">
                <span className="any-meta-label">Match ID</span>
                <span className="any-meta-value">{item.match_id}</span>
              </div>
              {item.message ? <p style={{ margin: 0, fontSize: 13, color: "#555" }}>{item.message}</p> : null}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="any-btn-secondary"
                  onClick={async () => {
                    await connectionsApi.updateStatus(item.id, "accepted");
                    reload();
                  }}
                >
                  Mark accepted
                </button>
                <button
                  type="button"
                  className="any-btn-secondary"
                  onClick={async () => {
                    await connectionsApi.updateStatus(item.id, "rejected");
                    reload();
                  }}
                >
                  Mark rejected
                </button>
                <button
                  type="button"
                  className="any-btn-primary"
                  onClick={async () => {
                    await connectionsApi.updateStatus(item.id, "pending");
                    reload();
                  }}
                >
                  Re-open as pending
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
