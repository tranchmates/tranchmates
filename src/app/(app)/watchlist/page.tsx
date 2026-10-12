"use client";

import { useEffect, useState } from "react";
import { usd, ago, short } from "@/components/format";

type Item = {
  id: string;
  kind: "token" | "account";
  value: string;
  label: string | null;
  snapshot: { h1?: number; h24?: number; price?: string; at?: number } | null;
  lastAlertAt: string | null;
};

export default function WatchlistPage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [target, setTarget] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => fetch("/api/watchlist").then((r) => r.json()).then((d) => setItems(d.items ?? []));
  useEffect(() => {
    load();
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const r = await fetch("/api/watchlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target }) });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(d.error);
    setTarget("");
    load();
  }

  async function remove(id: string) {
    await fetch("/api/watchlist", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  const tokens = items?.filter((i) => i.kind === "token") ?? [];
  const accounts = items?.filter((i) => i.kind === "account") ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Watchlist</h1>
        <p className="mt-1 max-w-[64ch] text-sm text-mute">
          Tokens are checked every few minutes for volume spikes and sharp moves. Project accounts are read for launches, snapshots, claims and other announcements.
        </p>
      </div>

      <form onSubmit={add} className="flex flex-col gap-2 rounded-2xl border border-line bg-panel p-4 sm:flex-row">
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Token address or @project"
          aria-label="Token address or X handle"
          className="flex-1 rounded-lg border border-line bg-night px-3 py-2 text-sm outline-none focus:border-hat"
        />
        <button disabled={busy || !target.trim()} className="rounded-lg bg-hat px-4 py-2 font-display text-xs font-bold text-night disabled:opacity-40">
          {busy ? "Adding…" : "Watch"}
        </button>
      </form>
      {err && <p role="alert" className="text-xs text-loss">{err}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-panel">
          <h2 className="border-b border-line px-5 py-3 text-sm font-bold">Tokens</h2>
          {tokens.length === 0 ? (
            <p className="px-5 py-6 text-xs text-mute">No tokens yet. Paste a contract address above.</p>
          ) : (
            <ul className="divide-y divide-line">
              {tokens.map((t) => (
                <li key={t.id} className="flex items-center gap-4 px-5 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <a href={`https://dexscreener.com/solana/${t.value}`} target="_blank" rel="noreferrer" className="font-medium hover:text-hat">{t.label ?? short(t.value)}</a>
                    <p className="text-xs text-mute">{short(t.value)}</p>
                  </div>
                  <div className="text-right text-xs">
                    <p>{t.snapshot?.h1 != null ? `${usd(t.snapshot.h1)} 1h` : "waiting for first check"}</p>
                    <p className="text-mute">{t.lastAlertAt ? `last alert ${ago(t.lastAlertAt)} ago` : "no alerts yet"}</p>
                  </div>
                  <button onClick={() => remove(t.id)} aria-label={`Stop watching ${t.label ?? t.value}`} className="text-mute hover:text-loss">✕</button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-panel">
          <h2 className="border-b border-line px-5 py-3 text-sm font-bold">Project accounts</h2>
          {accounts.length === 0 ? (
            <p className="px-5 py-6 text-xs text-mute">No accounts yet. Add a project&apos;s @handle above.</p>
          ) : (
            <ul className="divide-y divide-line">
              {accounts.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <a href={`https://x.com/${a.label?.replace("@", "")}`} target="_blank" rel="noreferrer" className="hover:text-hat">{a.label}</a>
                  <button onClick={() => remove(a.id)} aria-label={`Stop watching ${a.label}`} className="text-mute hover:text-loss">✕</button>
                </li>
              ))}
            </ul>
          )}
          <p className="border-t border-line px-5 py-3 text-xs leading-5 text-mute">
            Each new post read from X is billed to the app (about $0.005). Only new posts since the last check are read.
          </p>
        </section>
      </div>
    </div>
  );
}
