"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  kind: "daily" | "social";
  type: string;
  title: string;
  detail: string | null;
  points: number;
  params: { need?: number; handle?: string; url?: string; tweetId?: string; terms?: string };
  date: string | null;
  active: boolean;
  claims: number;
};

const TYPES = {
  daily: [
    { v: "scan", label: "Scan N tokens", needs: "need" },
    { v: "watch", label: "Add N to watchlist", needs: "need" },
    { v: "chat", label: "Send N messages to the agent", needs: "need" },
    { v: "trade", label: "Trade N SOL on the site", needs: "need" },
    { v: "post", label: "Post on X with a @handle / $ticker", needs: "terms" },
    { v: "link", label: "Visit a link (not verified)", needs: "url" },
  ],
  social: [
    { v: "follow", label: "Follow an X account", needs: "handle" },
    { v: "repost", label: "Repost a post", needs: "url" },
    { v: "reply", label: "Reply to a post", needs: "url" },
    { v: "quote", label: "Quote a post", needs: "url" },
    { v: "post", label: "Post with a @handle / $ticker", needs: "terms" },
    { v: "link", label: "Visit a link (not verified)", needs: "url" },
  ],
} as const;

const today = () => new Date().toISOString().slice(0, 10);

export function AdminClient() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [kind, setKind] = useState<"daily" | "social">("social");
  const [type, setType] = useState<string>("repost");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [points, setPoints] = useState("500");
  const [value, setValue] = useState("");
  const [everyDay, setEveryDay] = useState(false);
  const [date, setDate] = useState(today());
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(() => fetch("/api/rewards/admin").then((r) => r.json()).then((d) => setRows(d.tasks ?? [])), []);
  useEffect(() => {
    load();
  }, [load]);

  const typeDef = TYPES[kind].find((t) => t.v === type) ?? TYPES[kind][0];

  function pickKind(k: "daily" | "social") {
    setKind(k);
    setType(TYPES[k][0].v);
    setValue("");
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const params: Record<string, unknown> = {};
    if (typeDef.needs === "need") params.need = Number(value);
    if (typeDef.needs === "handle") params.handle = value;
    if (typeDef.needs === "url") params.url = value;
    if (typeDef.needs === "terms") params.terms = value;
    const r = await fetch("/api/rewards/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, type: typeDef.v, title, detail, points: Number(points), params, date: kind === "daily" && !everyDay ? date : null }),
    });
    const d = await r.json();
    if (!r.ok) return setMsg({ ok: false, text: d.error });
    setMsg({ ok: true, text: `Added "${d.task.title}".` });
    setTitle("");
    setDetail("");
    setValue("");
    load();
  }

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch("/api/rewards/admin", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) });
    load();
  }

  const placeholder =
    typeDef.needs === "need" ? (type === "trade" ? "0.5" : "3") : typeDef.needs === "handle" ? "memepaws" : typeDef.needs === "terms" ? "@memepaws $PAWS" : "https://x.com/memepaws/status/…";

  const list = (k: "daily" | "social") => (rows ?? []).filter((r) => r.kind === k);

  return (
    <div className="grid gap-4 xl:h-[calc(100dvh-106px)] xl:grid-cols-[380px_minmax(0,1fr)_minmax(0,1fr)]">
      <form onSubmit={create} className="flex min-h-0 flex-col gap-3 overflow-y-auto rounded-2xl border border-line bg-panel p-4 text-sm">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-lg font-bold">New task</h1>
          <span className="flex gap-3 text-xs">
            <Link href="/rewards/admin/bot" className="text-hat hover:underline">Reply bot</Link>
            <Link href="/rewards" className="text-mute hover:text-ink">Back to Rewards</Link>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-lg bg-night p-1" role="tablist">
          {(["social", "daily"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={kind === k}
              onClick={() => pickKind(k)}
              className={`rounded-md py-1.5 text-xs font-bold ${kind === k ? "bg-hat text-night" : "text-mute"}`}
            >
              {k === "social" ? "Social" : "Daily"}
            </button>
          ))}
        </div>

        <label className="space-y-1">
          <span className="text-xs text-mute">What the user does</span>
          <select id="task-type" value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-line bg-night px-3 py-2 outline-none focus:border-hat">
            {TYPES[kind].map((t) => (
              <option key={t.v} value={t.v}>{t.label}</option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-xs text-mute">
            {typeDef.needs === "need" ? (type === "trade" ? "SOL needed" : "How many") : typeDef.needs === "handle" ? "X handle" : typeDef.needs === "terms" ? "Post must include" : "Link"}
          </span>
          <input id="task-value" value={value} onChange={(e) => setValue(e.target.value)} placeholder={placeholder} className="w-full rounded-lg border border-line bg-night px-3 py-2 outline-none focus:border-hat" />
        </label>

        <label className="space-y-1">
          <span className="text-xs text-mute">Title users see</span>
          <input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Repost our launch post" className="w-full rounded-lg border border-line bg-night px-3 py-2 outline-none focus:border-hat" />
        </label>

        <label className="space-y-1">
          <span className="text-xs text-mute">Short note (optional)</span>
          <input id="task-detail" value={detail} onChange={(e) => setDetail(e.target.value)} placeholder="Takes 5 seconds" className="w-full rounded-lg border border-line bg-night px-3 py-2 outline-none focus:border-hat" />
        </label>

        <label className="space-y-1">
          <span className="text-xs text-mute">$PAWS reward</span>
          <input id="task-points" inputMode="numeric" value={points} onChange={(e) => setPoints(e.target.value.replace(/\D/g, ""))} className="w-full rounded-lg border border-line bg-night px-3 py-2 outline-none focus:border-hat" />
        </label>

        {kind === "daily" && (
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs">
              <input id="task-every-day" type="checkbox" checked={everyDay} onChange={(e) => setEveryDay(e.target.checked)} className="accent-[#ffc531]" />
              Every day (otherwise just one date)
            </label>
            {!everyDay && (
              <input id="task-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-lg border border-line bg-night px-3 py-2 outline-none focus:border-hat" />
            )}
            <p className="text-[11px] text-mute">If no daily tasks are set for a day, users get the defaults: scan 3 tokens and watch 1.</p>
          </div>
        )}

        <button className="mt-1 rounded-lg bg-hat py-2.5 font-display text-sm font-bold text-night">Add task</button>
        {msg && <p className={`text-xs ${msg.ok ? "text-gain" : "text-loss"}`}>{msg.text}</p>}
      </form>

      {(["social", "daily"] as const).map((k) => (
        <section key={k} className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-panel">
          <header className="border-b border-line px-4 py-3 text-sm font-bold">{k === "social" ? "Social tasks" : "Daily tasks"}</header>
          {!rows ? (
            <p className="px-4 py-4 text-xs text-mute">Loading…</p>
          ) : list(k).length === 0 ? (
            <p className="px-4 py-4 text-xs text-mute">None yet.</p>
          ) : (
            <ul className="scroll-thin min-h-0 flex-1 divide-y divide-line overflow-y-auto">
              {list(k).map((r) => (
                <li key={r.id} className={`px-4 py-3 text-xs ${r.active ? "" : "opacity-50"}`}>
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-[13px] font-bold">{r.title}</p>
                    <span className="font-display font-bold text-hat">+{r.points.toLocaleString("en-US")} $PAWS</span>
                  </div>
                  <p className="mt-0.5 truncate text-mute">
                    {r.type}
                    {r.params.need ? ` · ${r.params.need}` : ""}
                    {r.params.handle ? ` · @${r.params.handle}` : ""}
                    {r.params.terms ? ` · ${r.params.terms}` : ""}
                    {r.params.url ? ` · ${r.params.url}` : ""}
                    {k === "daily" ? ` · ${r.date ?? "every day"}` : ""}
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-mute">{r.claims} claimed</span>
                    <button type="button" onClick={() => patch(r.id, { active: !r.active })} className="ml-auto hover:text-hat">
                      {r.active ? "Turn off" : "Turn on"}
                    </button>
                    <button type="button" onClick={() => patch(r.id, { delete: true })} className="text-loss hover:underline">
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
