"use client";

import { useEffect, useState } from "react";
import { Badge, Button } from "@/components/ui/primitives";
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
    return <p style={{ margin: 0, color: "var(--text-muted)" }}>Loading connections...</p>;
  }

  return (
    <div style={{ display: "grid", gap: 22, maxWidth: 980 }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 10, borderLeft: "3px solid var(--primary)", paddingLeft: 10 }}>
          Connections
        </div>
        <h1 style={{ margin: 0, marginBottom: 8, fontSize: "clamp(28px, 6vw, 40px)" }}>Facility connection requests</h1>
        <p style={{ margin: 0, color: "var(--text-muted)", maxWidth: 760 }}>
          Track requests initiated from match detail pages and update statuses as your engineering conversations evolve.
        </p>
      </div>

      {!items.length ? (
        <div style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)", padding: 20, color: "var(--text-muted)" }}>
          No connection requests yet.
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((item) => (
            <div key={item.id} style={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--surface)", padding: 16, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <strong>{item.counterpart_organization_name}</strong>
                <Badge tone={tone(item.status)}>{item.status}</Badge>
              </div>
              <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13 }}>
                Match ID: {item.match_id}
              </p>
              {item.message ? <p style={{ margin: 0, fontSize: 13 }}>{item.message}</p> : null}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button
                  type="button"
                  variant="soft"
                  onClick={async () => {
                    await connectionsApi.updateStatus(item.id, "accepted");
                    reload();
                  }}
                >
                  Mark accepted
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={async () => {
                    await connectionsApi.updateStatus(item.id, "rejected");
                    reload();
                  }}
                >
                  Mark rejected
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  onClick={async () => {
                    await connectionsApi.updateStatus(item.id, "pending");
                    reload();
                  }}
                >
                  Re-open as pending
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
