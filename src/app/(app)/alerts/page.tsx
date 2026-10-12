"use client";

import { useEffect, useState } from "react";
import { ago } from "@/components/format";
import { KIND_LABEL, KIND_TONE, type AlertRow } from "@/components/LiveFeed";

const FILTERS = [
  { id: "", label: "All" },
  { id: "volume", label: "Volume" },
  { id: "announcement", label: "Announcements" },
  { id: "new_token", label: "New tokens" },
  { id: "digest", label: "Digests" },
  { id: "assistant", label: "Assistant" },
  { id: "wallet", label: "Wallets" },
];

export default function AlertsPage() {
  const [kind, setKind] = useState("");
  const [alerts, setAlerts] = useState<AlertRow[] | null>(null);

  useEffect(() => {
    setAlerts(null);
    fetch(`/api/alerts${kind ? `?kind=${kind}` : ""}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAlerts(d.alerts ?? []));
  }, [kind]);

  async function markAll() {
    await fetch("/api/alerts", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    setAlerts((a) => a?.map((x) => ({ ...x, read: true })) ?? null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-2xl font-bold">Alerts</h1>
        <button onClick={markAll} className="text-xs text-mute hover:text-ink">Mark all as read</button>
      </div>
      <div className="flex flex-wrap gap-2" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            role="tab"
            aria-selected={kind === f.id}
            onClick={() => setKind(f.id)}
            className={`rounded-full border px-3 py-1 text-xs ${kind === f.id ? "border-hat text-hat" : "border-line text-mute hover:text-ink"}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      {alerts === null ? (
        <p className="text-sm text-mute">Loading…</p>
      ) : alerts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-mute">
          No alerts here yet. They appear as your agent spots moves on your watchlist.
        </p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-panel">
          {alerts.map((a) => (
            <li key={a.id} className={`grid grid-cols-[64px_1fr_auto] gap-4 px-5 py-4 ${a.read ? "" : "bg-hat/[0.04]"}`}>
              <span className={`text-xs ${KIND_TONE[a.kind] ?? "text-mute"}`}>{KIND_LABEL[a.kind] ?? a.kind}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{a.title}</p>
                <p className="mt-1 whitespace-pre-line text-[13px] leading-6 text-mute">{a.body}</p>
                {a.url && (
                  <a href={a.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-hat hover:underline">Open source</a>
                )}
              </div>
              <span className="text-xs text-mute">{ago(a.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
