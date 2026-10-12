"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Recent = { author: string; mint: string | null; status: string; replyTweetId: string | null; note: string | null; createdAt: string };
type Campaign = {
  id: string;
  tweetId: string;
  url: string;
  active: boolean;
  maxPerHour: number;
  lastCheckedAt: string | null;
  lastError: string | null;
  sent: number;
  skipped: number;
  failed: number;
  lastHour: number;
  recent: Recent[];
};

const ago = (iso: string | null) => {
  if (!iso) return "never";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  return s < 60 ? `${Math.floor(s)}s ago` : s < 3600 ? `${Math.floor(s / 60)}m ago` : `${Math.floor(s / 3600)}h ago`;
};

export function BotClient() {
  const sp = useSearchParams();
  const [bot, setBot] = useState<{ username: string } | null | undefined>(undefined);
  const [rows, setRows] = useState<Campaign[]>([]);
  const [url, setUrl] = useState("");
  const [perHour, setPerHour] = useState("30");
  const [addTasks, setAddTasks] = useState(true);
  const [points, setPoints] = useState("500");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(
    sp.get("connected") ? { ok: true, text: `Connected @${sp.get("connected")}.` } : sp.get("error") ? { ok: false, text: "Couldn't connect the account. Check that the X app has Read and write permission." } : null,
  );
  const [preview, setPreview] = useState("");
  const [previewOut, setPreviewOut] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () =>
      fetch("/api/bot", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          setBot(d.bot ?? null);
          setRows(d.campaigns ?? []);
        }),
    [],
  );
  useEffect(() => {
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, [load]);

  async function post(body: Record<string, unknown>) {
    const r = await fetch("/api/bot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { ok: r.ok, d: await r.json() };
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const { ok, d } = await post({ url, maxPerHour: Number(perHour), addTasks, points: Number(points) });
    if (!ok) return setMsg({ ok: false, text: d.error });
    setMsg({ ok: true, text: addTasks ? "Bot is on for this post. Reply and quote tasks added to Rewards." : "Bot is on for this post." });
    setUrl("");
    load();
  }

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch("/api/bot", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) });
    load();
  }

  async function runNow() {
    setBusy(true);
    const { d } = await post({ action: "run" });
    setBusy(false);
    setMsg({ ok: !d.error, text: d.error ? `Run: ${d.error}` : `Run done: ${d.posted ?? 0} replies posted.` });
    load();
  }

  async function doPreview() {
    setPreviewOut("Scanning…");
    const { ok, d } = await post({ action: "preview", text: preview });
    setPreviewOut(ok ? `${d.text}\n\n(${d.length} chars)` : `Error: ${d.error}`);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[400px_minmax(0,1fr)]">
      <div className="space-y-4">
        <section className="space-y-3 rounded-2xl border border-line bg-panel p-4 text-sm">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-lg font-bold">Reply bot</h1>
            <Link href="/rewards/admin" className="text-xs text-mute hover:text-ink">Back to tasks</Link>
          </div>
          <p className="text-xs text-mute">
            Every reply with a Solana CA under the posts below gets a scan verdict from the project account. Checked every minute.
          </p>
          <div className="rounded-xl border border-line bg-night p-3">
            <p className="text-xs text-mute">Posting as</p>
            {bot === undefined ? (
              <p className="mt-1 text-xs text-mute">Loading…</p>
            ) : bot ? (
              <div className="mt-1 flex items-center justify-between">
                <span className="font-bold">@{bot.username}</span>
                <span className="flex gap-3 text-xs">
                  <a href="/api/bot/x/login" className="hover:text-hat">Reconnect</a>
                  <button type="button" onClick={() => post({ action: "disconnect" }).then(load)} className="text-loss hover:underline">Disconnect</button>
                </span>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <p className="text-xs">Not connected. In this browser, switch X to the project account first, then:</p>
                <a href="/api/bot/x/login" className="block rounded-lg bg-hat py-2 text-center font-display text-sm font-bold text-night">Connect project X account</a>
              </div>
            )}
          </div>
        </section>

        <form onSubmit={create} className="space-y-3 rounded-2xl border border-line bg-panel p-4 text-sm">
          <h2 className="font-bold">Turn the bot on for a post</h2>
          <input id="bot-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://x.com/trenchmates_sol/status/…" className="w-full rounded-lg border border-line bg-night px-3 py-2 outline-none focus:border-hat" />
          <label className="flex items-center justify-between gap-3 text-xs">
            <span className="text-mute">Max replies per hour</span>
            <input id="bot-per-hour" inputMode="numeric" value={perHour} onChange={(e) => setPerHour(e.target.value.replace(/\D/g, ""))} className="w-20 rounded-lg border border-line bg-night px-2 py-1 text-right outline-none focus:border-hat" />
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input id="bot-add-tasks" type="checkbox" checked={addTasks} onChange={(e) => setAddTasks(e.target.checked)} className="accent-[#ffc531]" />
            Also add &quot;reply&quot; and &quot;quote&quot; social tasks for this post
          </label>
          {addTasks && (
            <label className="flex items-center justify-between gap-3 text-xs">
              <span className="text-mute">$PAWS for each task</span>
              <input id="bot-points" inputMode="numeric" value={points} onChange={(e) => setPoints(e.target.value.replace(/\D/g, ""))} className="w-24 rounded-lg border border-line bg-night px-2 py-1 text-right outline-none focus:border-hat" />
            </label>
          )}
          <button className="w-full rounded-lg bg-hat py-2.5 font-display text-sm font-bold text-night">Start replying</button>
          {msg && <p className={`text-xs ${msg.ok ? "text-gain" : "text-loss"}`}>{msg.text}</p>}
        </form>

        <section className="space-y-2 rounded-2xl border border-line bg-panel p-4 text-sm">
          <h2 className="font-bold">Preview a reply</h2>
          <p className="text-xs text-mute">Paste a CA to see exactly what the bot would post. Nothing is posted.</p>
          <div className="flex gap-2">
            <input id="bot-preview" value={preview} onChange={(e) => setPreview(e.target.value)} placeholder="Contract address" className="min-w-0 flex-1 rounded-lg border border-line bg-night px-3 py-2 outline-none focus:border-hat" />
            <button type="button" onClick={doPreview} className="rounded-lg border border-line px-3 text-xs hover:border-hat">Preview</button>
          </div>
          {previewOut && <pre className="whitespace-pre-wrap rounded-lg bg-night p-3 font-mono text-xs">{previewOut}</pre>}
        </section>
      </div>

      <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-line bg-panel">
        <header className="flex items-center justify-between border-b border-line px-4 py-3 text-sm">
          <span className="font-bold">Posts</span>
          <button type="button" disabled={busy} onClick={runNow} className="rounded-lg border border-line px-3 py-1 text-xs hover:border-hat disabled:opacity-50">
            {busy ? "Running…" : "Run now"}
          </button>
        </header>
        {rows.length === 0 ? (
          <p className="px-4 py-4 text-xs text-mute">No posts yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((c) => (
              <li key={c.id} className={`space-y-2 px-4 py-3 text-xs ${c.active ? "" : "opacity-60"}`}>
                <div className="flex items-center gap-3">
                  <a href={c.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-bold hover:text-hat">{c.url}</a>
                  <span className={c.active ? "text-gain" : "text-mute"}>{c.active ? "on" : "paused"}</span>
                </div>
                <p className="text-mute">
                  <span className="text-ink">{c.sent}</span> replied · {c.skipped} skipped · <span className={c.failed ? "text-loss" : ""}>{c.failed} failed</span> · {c.lastHour}/{c.maxPerHour} this hour · checked {ago(c.lastCheckedAt)}
                </p>
                {c.lastError && <p className="text-loss">{c.lastError}</p>}
                {c.recent.length > 0 && (
                  <ul className="space-y-1 rounded-lg bg-night p-2">
                    {c.recent.map((r, i) => (
                      <li key={i} className="flex gap-2 truncate">
                        <span className={r.status === "sent" ? "text-gain" : "text-loss"}>{r.status}</span>
                        <span>@{r.author}</span>
                        <span className="truncate text-mute">{r.mint ? `${r.mint.slice(0, 4)}…${r.mint.slice(-4)}` : ""}</span>
                        {r.replyTweetId && (
                          <a href={`https://x.com/i/status/${r.replyTweetId}`} target="_blank" rel="noreferrer" className="ml-auto text-hat hover:underline">view</a>
                        )}
                        {r.status === "failed" && r.note && <span className="ml-auto truncate text-loss">{r.note}</span>}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex gap-3">
                  <button type="button" onClick={() => patch(c.id, { active: !c.active })} className="hover:text-hat">{c.active ? "Pause" : "Resume"}</button>
                  <button type="button" onClick={() => patch(c.id, { delete: true })} className="text-loss hover:underline">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
