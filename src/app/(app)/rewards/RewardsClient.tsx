"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Mascot } from "@/components/mascots/Mascot";
import { ago, num } from "@/components/format";

type Task = {
  id: string;
  kind: "daily" | "social";
  type: string;
  title: string;
  detail: string;
  points: number;
  done: boolean;
  claimable: boolean;
  progress?: { have: number; need: number };
  action?: { label: string; href: string };
  verify: boolean;
};
type Tier = { id: string; sol: number; points: number; done: boolean; claimable: boolean };
type Data = {
  admin: boolean;
  balance: number;
  rank: number;
  streak: number;
  daily: Task[];
  social: Task[];
  trading: { volumeTodaySol: number; tiers: Tier[] };
  referral: { code: string; link: string; invitedCount: number; perInvite: number; forFriend: number };
  leaderboard: { rank: number; username: string; avatarUrl: string | null; points: number; me: boolean }[];
  history: { id: string; kind: string; points: number; at: string; meta: { title?: string; sol?: number; username?: string } | null }[];
  error?: string;
};

const ICON: Record<string, string> = {
  checkin: "☀",
  scan: "⌕",
  watch: "◉",
  chat: "✎",
  trade: "⇄",
  post: "✍",
  link: "↗",
  follow: "+",
  repost: "⟲",
  reply: "↩",
  quote: "❝",
};
const KIND: Record<string, string> = {
  checkin: "Check-in",
  daily: "Daily task",
  social: "Social task",
  trade_tier: "Trading tier",
  referral: "Friend joined",
  referred: "Joined with invite",
};

export function RewardsClient() {
  const [d, setD] = useState<Data | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<{ id: string; ok: boolean; text: string } | null>(null);
  const [side, setSide] = useState<"board" | "history">("board");
  const [copied, setCopied] = useState(false);

  const load = useCallback(() => fetch("/api/rewards").then((r) => r.json()).then(setD).catch(() => {}), []);
  useEffect(() => {
    load();
  }, [load]);

  async function claim(id: string) {
    setBusy(id);
    setNote(null);
    const r = await fetch("/api/rewards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task: id }) });
    const j = await r.json();
    setBusy(null);
    setNote({ id, ok: Boolean(j.ok), text: j.ok ? `+${num(j.points)} $PAWS` : j.error });
    if (j.ok) load();
  }

  async function copy() {
    if (!d) return;
    try {
      await navigator.clipboard.writeText(d.referral.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked: the link stays selectable
    }
  }

  if (!d) return <p className="text-sm text-mute">Loading rewards…</p>;
  if (d.error) return <p className="text-sm text-loss">{d.error}</p>;

  const dailyDone = d.daily.filter((t) => t.done).length;
  const socialDone = d.social.filter((t) => t.done).length;

  const ClaimBtn = ({ id, done, claimable, verify }: { id: string; done: boolean; claimable: boolean; verify?: boolean }) => (
    <button
      type="button"
      disabled={done || busy === id || !claimable}
      onClick={() => claim(id)}
      className={`min-w-[72px] shrink-0 rounded-lg px-3 py-1.5 font-display text-[11px] font-bold ${done ? "bg-panel-2 text-gain" : "bg-hat text-night disabled:opacity-35"}`}
    >
      {done ? "✓ Done" : busy === id ? (verify ? "Checking…" : "…") : "Claim"}
    </button>
  );

  const TaskRow = ({ t }: { t: Task }) => (
    <li className="px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm ${
            t.done ? "border-gain bg-gain/15 text-gain" : t.claimable ? "border-hat text-hat" : "border-line text-mute"
          }`}
          aria-hidden="true"
        >
          {t.done ? "✓" : ICON[t.type] ?? "•"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold">{t.title}</p>
          {t.detail && <p className="truncate text-[11px] text-mute">{t.detail}</p>}
        </div>
        <span className="shrink-0 font-display text-xs font-bold text-hat">+{num(t.points)} <span className="text-[0.85em]">$PAWS</span></span>
      </div>
      <div className="mt-2 flex items-center gap-2 pl-11">
        {t.progress && !t.done ? (
          <span className="flex flex-1 items-center gap-2">
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-2">
              <span className="block h-full rounded-full bg-hat" style={{ width: `${(t.progress.have / t.progress.need) * 100}%` }} />
            </span>
            <span className="text-[10px] text-mute">
              {num(t.progress.have)}/{num(t.progress.need)}
            </span>
          </span>
        ) : (
          <span className="flex-1 text-[10px] text-mute">{t.verify && !t.done ? "checked on X when you claim" : ""}</span>
        )}
        {t.action && !t.done && (
          <a
            href={t.action.href}
            target={t.action.href.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            className="shrink-0 rounded-lg border border-line px-2.5 py-1.5 text-[11px] hover:border-hat"
          >
            {t.action.label}
          </a>
        )}
        <ClaimBtn id={t.id} done={t.done} claimable={t.claimable} verify={t.verify} />
      </div>
      {note?.id === t.id && <p className={`mt-1.5 pl-11 text-[11px] ${note.ok ? "text-gain" : "text-loss"}`}>{note.text}</p>}
    </li>
  );

  const Panel = ({ title, aside, children, className = "" }: { title: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) => (
    <section className={`flex min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-panel ${className}`}>
      <header className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-bold">{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  );

  return (
    // Desktop: four columns that exactly fill the screen; lists scroll inside their panel.
    <div className="grid gap-4 lg:grid-cols-2 xl:h-[calc(100dvh-106px)] xl:grid-cols-[300px_minmax(0,1fr)_minmax(0,1fr)_300px]">
      {/* 1: balance, trading, invite */}
      <div className="flex min-h-0 flex-col gap-4">
        <section className="relative shrink-0 overflow-hidden rounded-2xl border border-hat/40 bg-linear-to-br from-hat/20 via-panel to-panel p-4">
          <div className="flex items-end gap-3">
            <Mascot kind="cat" className="w-16 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-mute">Your rewards</p>
              <p className="font-display text-3xl font-extrabold leading-none text-hat">{num(d.balance)}</p>
              <p className="font-display text-sm font-bold">$PAWS</p>
            </div>
            {d.admin && (
              <Link href="/rewards/admin" className="ml-auto self-start rounded-md border border-line px-2 py-1 text-[10px] text-mute hover:border-hat hover:text-ink">
                Manage tasks
              </Link>
            )}
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-1.5 text-center text-[11px]">
            <div className="rounded-lg bg-night/70 py-1.5">
              <dt className="text-mute">Rank</dt>
              <dd className="font-bold">#{d.rank}</dd>
            </div>
            <div className="rounded-lg bg-night/70 py-1.5">
              <dt className="text-mute">Streak</dt>
              <dd className="font-bold">{d.streak}d</dd>
            </div>
            <div className="rounded-lg bg-night/70 py-1.5">
              <dt className="text-mute">Invited</dt>
              <dd className="font-bold">{d.referral.invitedCount}</dd>
            </div>
          </dl>
        </section>

        <Panel title="Trading" aside={<span className="text-[11px] text-mute">{num(d.trading.volumeTodaySol)} SOL today</span>} className="shrink-0">
          <ul className="divide-y divide-line">
            {d.trading.tiers.map((t) => {
              const pct = t.claimable ? 100 : Math.min(100, (d.trading.volumeTodaySol / t.sol) * 100);
              return (
                <li key={t.id} className="px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold">
                        Trade {t.sol} SOL
                        {!t.done && !t.claimable && (
                          <span className="ml-1.5 text-[10px] font-normal text-mute">{num(Math.max(0, t.sol - d.trading.volumeTodaySol))} to go</span>
                        )}
                      </p>
                      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-panel-2">
                        <span className={`block h-full rounded-full ${t.done ? "bg-gain" : "bg-hat"}`} style={{ width: `${t.done ? 100 : pct}%` }} />
                      </span>
                    </div>
                    <span className="shrink-0 font-display text-xs font-bold text-hat">+{num(t.points)} <span className="text-[0.85em]">$PAWS</span></span>
                    <ClaimBtn id={t.id} done={t.done} claimable={t.claimable} />
                  </div>
                  {note?.id === t.id && <p className={`mt-1 text-[11px] ${note.ok ? "text-gain" : "text-loss"}`}>{note.text}</p>}
                </li>
              );
            })}
          </ul>
          <p className="border-t border-line px-4 py-2 text-[10px] text-mute">Volume of swaps made on MemePaws today (UTC). Each tier once a day.</p>
        </Panel>

        <Panel title="Invite friends" aside={<span className="font-display text-xs font-bold text-hat">+{num(d.referral.perInvite)} <span className="text-[0.85em]">$PAWS</span></span>} className="shrink-0">
          <div className="space-y-2 px-4 py-3">
            <p className="text-[11px] text-mute">
              You get +{num(d.referral.perInvite)} $PAWS when their agent is ready, they get +{num(d.referral.forFriend)} $PAWS.
            </p>
            <div className="flex gap-2">
              <input
                id="ref-link"
                readOnly
                value={d.referral.link}
                onFocus={(e) => e.currentTarget.select()}
                aria-label="Your invite link"
                className="min-w-0 flex-1 rounded-lg border border-line bg-night px-2.5 py-1.5 text-[11px] outline-none focus:border-hat"
              />
              <button type="button" onClick={copy} className="rounded-lg bg-hat px-3 font-display text-[11px] font-bold text-night">
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </Panel>
      </div>

      {/* 2: daily */}
      <Panel title="Daily tasks" aside={<span className="text-[11px] text-mute">{dailyDone}/{d.daily.length} · resets 00:00 UTC</span>}>
        <ul className="scroll-thin min-h-0 flex-1 divide-y divide-line overflow-y-auto">
          {d.daily.map((t) => (
            <TaskRow key={t.id} t={t} />
          ))}
        </ul>
      </Panel>

      {/* 3: social */}
      <Panel title="Social tasks" aside={<span className="text-[11px] text-mute">{socialDone}/{d.social.length} done</span>}>
        {d.social.length === 0 ? (
          <p className="px-4 py-5 text-xs leading-6 text-mute">New tasks show up here with each new post from the team. Check back soon.</p>
        ) : (
          <ul className="scroll-thin min-h-0 flex-1 divide-y divide-line overflow-y-auto">
            {d.social.map((t) => (
              <TaskRow key={t.id} t={t} />
            ))}
          </ul>
        )}
      </Panel>

      {/* 4: leaderboard / history */}
      <Panel
        title={side === "board" ? "Leaderboard" : "Your rewards"}
        aside={
          <div className="flex gap-1" role="tablist" aria-label="Leaderboard or history">
            {(["board", "history"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={side === s}
                onClick={() => setSide(s)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] ${side === s ? "bg-hat text-night" : "text-mute hover:text-ink"}`}
              >
                {s === "board" ? "Top" : "History"}
              </button>
            ))}
          </div>
        }
      >
        {side === "board" ? (
          d.leaderboard.length === 0 ? (
            <p className="px-4 py-5 text-xs text-mute">Nobody on the board yet. Claim your check-in to be first.</p>
          ) : (
            <ol className="scroll-thin min-h-0 flex-1 divide-y divide-line overflow-y-auto">
              {d.leaderboard.map((r) => (
                <li key={r.rank} className={`flex items-center gap-2.5 px-4 py-2 text-[13px] ${r.me ? "bg-hat/10" : ""}`}>
                  <span className={`w-5 text-right font-display text-xs font-bold ${r.rank <= 3 ? "text-hat" : "text-mute"}`}>{r.rank}</span>
                  {r.avatarUrl ? <img src={r.avatarUrl} alt="" className="h-6 w-6 rounded-full" /> : <span className="h-6 w-6 rounded-full bg-panel-2" />}
                  <span className="min-w-0 flex-1 truncate">
                    @{r.username}
                    {r.me && <span className="ml-1 text-[10px] text-hat">you</span>}
                  </span>
                  <span className="font-bold">{num(r.points)} <span className="text-[0.85em]">$PAWS</span></span>
                </li>
              ))}
            </ol>
          )
        ) : d.history.length === 0 ? (
          <p className="px-4 py-5 text-xs text-mute">Your earned $PAWS will be listed here.</p>
        ) : (
          <ul className="scroll-thin min-h-0 flex-1 divide-y divide-line overflow-y-auto">
            {d.history.map((h) => (
              <li key={h.id} className="flex items-center gap-2.5 px-4 py-2 text-[12px]">
                <span className="min-w-0 flex-1 truncate">
                  {h.meta?.title ?? KIND[h.kind] ?? h.kind}
                  {h.kind === "trade_tier" && h.meta?.sol != null && <span className="text-mute"> · {h.meta.sol} SOL</span>}
                  {h.kind === "referral" && h.meta?.username && <span className="text-mute"> · @{h.meta.username}</span>}
                </span>
                <span className="font-bold text-gain">+{num(h.points)} <span className="text-[0.85em]">$PAWS</span></span>
                <span className="w-7 text-right text-[10px] text-mute">{ago(h.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
