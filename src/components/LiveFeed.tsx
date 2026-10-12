"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ago } from "./format";

export type AlertRow = {
  id: string;
  kind: string;
  title: string;
  body: string;
  url: string | null;
  read: boolean;
  createdAt: string;
};

export const KIND_TONE: Record<string, string> = {
  volume: "text-gain",
  announcement: "text-hat",
  new_token: "text-[#9fb4ff]",
  analysis: "text-ink",
  system: "text-mute",
  digest: "text-hat",
  assistant: "text-[#9fb4ff]",
  wallet: "text-gain",
};
export const KIND_LABEL: Record<string, string> = {
  volume: "volume",
  announcement: "post",
  new_token: "new",
  analysis: "check",
  system: "note",
  digest: "digest",
  assistant: "job",
  wallet: "wallet",
};

export function LiveFeed() {
  const [alerts, setAlerts] = useState<AlertRow[] | null>(null);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/alerts", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => alive && setAlerts(d.alerts?.slice(0, 30) ?? []))
        .catch(() => {});
    load();
    const t = setInterval(load, 30_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <section className="flex max-h-[60dvh] flex-col overflow-hidden rounded-2xl border border-line bg-panel xl:h-full xl:max-h-none">
      <header className="flex items-center justify-between border-b border-line px-5 py-3">
        <h2 className="text-sm font-bold">Live feed</h2>
        <Link href="/alerts" className="text-xs text-mute hover:text-ink">All alerts</Link>
      </header>
      {alerts === null ? (
        <p className="px-5 py-6 text-xs text-mute">Loading…</p>
      ) : alerts.length === 0 ? (
        <p className="px-5 py-6 text-xs leading-6 text-mute">
          Quiet so far. Add tokens or project accounts on the <Link href="/watchlist" className="text-hat underline">Watchlist</Link> and
          alerts land here.
        </p>
      ) : (
        <ul className="scroll-thin min-h-0 flex-1 divide-y divide-line overflow-y-auto">
          {alerts.map((a) => (
            <li key={a.id} className="grid grid-cols-[44px_1fr_auto] gap-3 px-5 py-3">
              <span className={`text-[11px] ${KIND_TONE[a.kind] ?? "text-mute"}`}>{KIND_LABEL[a.kind] ?? a.kind}</span>
              <div className="min-w-0">
                {a.url ? (
                  <a href={a.url} target="_blank" rel="noreferrer" className={`block truncate text-[13px] hover:underline ${a.read ? "text-mute" : ""}`}>{a.title}</a>
                ) : (
                  <p className={`truncate text-[13px] ${a.read ? "text-mute" : ""}`}>{a.title}</p>
                )}
                <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-mute">{a.body}</p>
              </div>
              <span className="text-[11px] text-mute">{ago(a.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
