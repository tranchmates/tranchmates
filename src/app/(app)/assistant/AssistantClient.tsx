"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mascot } from "@/components/mascots/Mascot";
import { ago } from "@/components/format";
import { currentFocus } from "@/components/tokenFocus";
import Link from "next/link";

type Msg = { id: string; role: "user" | "assistant"; content: string; meta: string | null; createdAt: string };
type Job = {
  id: string;
  kind: "report" | "alert" | "reminder";
  title: string;
  runAt: string | null;
  intervalMin: number | null;
  remaining: number | null;
  status: string;
  firedCount: number;
  lastRunAt: string | null;
  createdAt: string;
};

const EXAMPLES = [
  "Send me the mcap of this CA in 5 minutes",
  "Update me on this token every 10 minutes, 6 times",
  "Tell me when this CA's mcap goes above 1M",
  "Track wallet <address> as Ansem",
  "Alert me if the price drops below 0.002",
  "Remind me at 18:00 to take profit",
  "What jobs do I have?",
];

const KIND_ICON = { report: "📊", alert: "🔔", reminder: "⏰" } as const;

type Activity = { id: string; title: string; body: string; url: string | null; read: boolean; createdAt: string; meta: { mint?: string } | null };

function untilText(iso: string | null) {
  if (!iso) return "when the level is hit";
  const s = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  if (s <= 0) return "any second";
  if (s < 60) return `in ${s}s`;
  if (s < 3600) return `in ${Math.floor(s / 60)}m ${s % 60}s`;
  return `in ${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

export function AssistantClient({ name }: { name: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [jobs, setJobs] = useState<{ active: Job[]; recent: Job[] } | null>(null);
  const [activity, setActivity] = useState<Activity[] | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [, tick] = useState(0);
  const [notif, setNotif] = useState<NotificationPermission | "unsupported">("default");
  const scroller = useRef<HTMLDivElement>(null);

  const loadJobs = useCallback(() => fetch("/api/assistant/tasks").then((r) => r.json()).then(setJobs).catch(() => {}), []);
  const loadActivity = useCallback(
    () => fetch("/api/alerts?kind=assistant", { cache: "no-store" }).then((r) => r.json()).then((d) => setActivity(d.alerts ?? [])).catch(() => {}),
    [],
  );
  const loadMsgs = useCallback(() => fetch("/api/assistant/chat").then((r) => r.json()).then((d) => setMsgs(d.messages ?? [])).catch(() => {}), []);

  useEffect(() => {
    loadMsgs();
    loadJobs();
    loadActivity();
    setNotif(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
    // countdowns + pick up jobs that fired
    const a = setInterval(() => tick((n) => n + 1), 1000);
    const b = setInterval(() => {
      loadJobs();
      loadMsgs();
      loadActivity();
    }, 20_000);
    return () => {
      clearInterval(a);
      clearInterval(b);
    };
  }, [loadJobs, loadMsgs, loadActivity]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  async function send(body: string) {
    const t = body.trim();
    if (!t || busy) return;
    setBusy(true);
    setText("");
    setMsgs((m) => [...m, { id: `tmp-${Date.now()}`, role: "user", content: t, meta: null, createdAt: new Date().toISOString() }]);
    // the token open on MemePaws in this tab session, as a hint for "this CA"
    const focus = currentFocus();
    const withHint = focus && !/[1-9A-HJ-NP-Za-km-z]{32,44}/.test(t) ? `${t}\n(token in focus on MemePaws: $${focus.symbol} ${focus.mint})` : t;
    try {
      const r = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: withHint, tzOffsetMin: -new Date().getTimezoneOffset() }),
      });
      const d = await r.json();
      if (d.message) setMsgs((m) => [...m, d.message]);
      if (d.changed) loadJobs();
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id: string) {
    await fetch("/api/assistant/tasks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    loadJobs();
  }

  async function enableNotifications() {
    if (typeof Notification === "undefined") return;
    setNotif(await Notification.requestPermission());
  }

  return (
    <div className="grid gap-4 xl:h-[calc(100dvh-106px)] xl:grid-cols-[minmax(0,1fr)_380px]">
      {/* chat */}
      <section className="flex h-[calc(100dvh-170px)] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-line bg-panel md:h-[calc(100dvh-110px)] xl:h-full xl:min-h-0">
        <header className="flex items-center gap-3 border-b border-line bg-linear-to-r from-suit/60 to-transparent px-4 py-2.5">
          <div className="h-11 w-11 overflow-hidden rounded-full bg-night">
            <Mascot kind="dog" busy={busy} className="w-16 -translate-x-2.5 -translate-y-0.5" />
          </div>
          <div>
            <p className="font-display text-sm font-bold">{name}</p>
            <p className="text-xs text-mute">{busy ? "taking notes…" : "your assistant · give me any job"}</p>
          </div>
        </header>

        <div ref={scroller} className="scroll-thin flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite">
          {msgs.length === 0 && (
            <div className="mx-auto flex max-w-md flex-col items-center gap-3 pt-6 text-center">
              <Mascot kind="dog" className="w-32" />
              <p className="font-display text-lg font-bold">Good day. {name}, at your service.</p>
              <p className="text-sm leading-6 text-mute">
                Give me jobs in plain words. I watch the token you scanned last on MemePaws, send updates on time, ping you when levels are hit and follow the wallets you care about.
              </p>
            </div>
          )}
          {msgs.map((m) => {
            const mine = m.role === "user";
            const fired = !mine && m.meta?.includes('"fired"');
            const shown = mine ? m.content.replace(/\n\(token in focus on MemePaws:[^)]*\)$/, "") : m.content;
            return (
              <div key={m.id} className={`min-w-0 ${mine ? "ml-auto w-fit max-w-[85%]" : "max-w-[90%]"}`}>
                <p className={`mb-1 text-[11px] ${mine ? "text-right text-mute" : "text-[#9fb4ff]"}`}>
                  {mine ? "you" : name} · {ago(m.createdAt)}
                </p>
                <div
                  className={`whitespace-pre-wrap [overflow-wrap:anywhere] rounded-xl px-4 py-3 text-sm leading-6 ${
                    mine ? "bg-panel-2" : fired ? "border border-hat/50 bg-hat/[0.06]" : "border border-line bg-night"
                  }`}
                >
                  {shown}
                </div>
              </div>
            );
          })}
          {busy && <p className="text-sm text-[#9fb4ff]">{name} is writing it down…</p>}
        </div>

        <div className="border-t border-line p-3">
          <div className="mb-2 flex flex-wrap gap-2">
            {EXAMPLES.slice(0, 4).map((e) => (
              <button
                key={e}
                type="button"
                disabled={busy}
                onClick={() => setText(e)}
                className="rounded-full border border-line px-3 py-1 text-xs text-mute hover:border-[#9fb4ff] hover:text-ink disabled:opacity-40"
              >
                {e}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
            className="flex items-end gap-2 rounded-xl border border-line bg-night px-3 py-2 focus-within:border-[#9fb4ff]"
          >
            <textarea
              id="assistant-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(text);
                }
              }}
              rows={1}
              placeholder={`Ask ${name} to do something…`}
              aria-label={`Message ${name}`}
              className="max-h-32 flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-mute/70"
            />
            <button disabled={busy || !text.trim()} className="rounded-lg bg-suit px-4 py-1.5 font-display text-xs font-bold text-ink ring-1 ring-[#9fb4ff]/40 disabled:opacity-40">
              Send
            </button>
          </form>
        </div>
      </section>

      {/* jobs */}
      <aside className="flex min-h-0 flex-col gap-4">
        <section className="flex min-h-[200px] flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-panel xl:min-h-0">
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="text-sm font-bold">Jobs</h2>
            {!!jobs?.active.length && (
              <button type="button" onClick={() => cancel("all")} className="text-[11px] text-mute hover:text-loss">
                Cancel all
              </button>
            )}
          </header>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
            {!jobs ? (
              <p className="px-4 py-4 text-xs text-mute">Loading…</p>
            ) : jobs.active.length === 0 ? (
              <p className="px-4 py-5 text-xs leading-6 text-mute">No active jobs. Try “send me the mcap of this CA in 5 minutes”.</p>
            ) : (
              <ul className="divide-y divide-line">
                {jobs.active.map((j) => (
                  <li key={j.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-lg" aria-hidden="true">{KIND_ICON[j.kind]}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-bold">{j.title}</p>
                      <p className="text-[11px] text-mute">
                        {j.kind === "alert" ? "checking every minute" : untilText(j.runAt)}
                        {j.kind === "report" && j.intervalMin ? ` · ${j.remaining} left` : ""}
                      </p>
                    </div>
                    <button type="button" onClick={() => cancel(j.id)} className="text-[11px] text-mute hover:text-loss" aria-label={`Cancel ${j.title}`}>
                      Cancel
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!!jobs?.recent.length && (
              <>
                <p className="border-t border-line px-4 pb-1 pt-3 text-[11px] text-mute">Finished</p>
                <ul className="divide-y divide-line opacity-70">
                  {jobs.recent.map((j) => (
                    <li key={j.id} className="flex items-center gap-3 px-4 py-2 text-[12px]">
                      <span aria-hidden="true">{KIND_ICON[j.kind]}</span>
                      <span className="min-w-0 flex-1 truncate">{j.title}</span>
                      <span className={`text-[10px] ${j.status === "done" ? "text-gain" : "text-mute"}`}>{j.status === "done" ? "done" : "cancelled"}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>

        <section className="flex min-h-[320px] flex-[1.4] flex-col overflow-hidden rounded-2xl border border-line bg-panel xl:min-h-0">
          <header className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
            <h2 className="text-sm font-bold">Activity</h2>
            {notif === "default" ? (
              <button type="button" onClick={enableNotifications} className="text-[11px] text-[#9fb4ff] hover:underline">
                Enable browser pings
              </button>
            ) : (
              <span className="text-[11px] text-mute">{notif === "granted" ? "Browser pings on" : "Pop-ups on every page"}</span>
            )}
          </header>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
            {activity === null ? (
              <p className="px-4 py-4 text-xs text-mute">Loading…</p>
            ) : activity.length === 0 ? (
              <p className="px-4 py-5 text-xs leading-6 text-mute">Nothing delivered yet. Every report, alert and reminder {name} sends shows up here.</p>
            ) : (
              <ul className="divide-y divide-line">
                {activity.map((a) => (
                  <li key={a.id} className={`px-4 py-3 ${a.read ? "" : "bg-[#9fb4ff]/[0.05]"}`}>
                    <div className="flex items-baseline gap-2">
                      <p className="min-w-0 flex-1 truncate text-[13px] font-bold">{a.title}</p>
                      <span className="shrink-0 text-[10px] text-mute">{ago(a.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-3 text-xs leading-5 text-mute">{a.body}</p>
                    {(a.meta?.mint || a.url) && (
                      <div className="mt-1.5 flex gap-3 text-[11px]">
                        {a.meta?.mint && (
                          <Link href={`/dashboard?scan=${a.meta.mint}`} className="font-bold text-hat hover:underline">Scan CA</Link>
                        )}
                        {a.url && (
                          <a href={a.url} target="_blank" rel="noreferrer" className="text-mute hover:text-ink">Chart</a>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
