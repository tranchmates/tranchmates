"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SettingsClient({
  telegramChatId,
  telegramEnabled,
  digestHourUtc,
  agentName,
}: {
  agentName: string;
  telegramChatId: string;
  telegramEnabled: boolean;
  digestHourUtc: number | null;
}) {
  const router = useRouter();
  const [aName, setAName] = useState(agentName);
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/agent/name", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: aName }) });
    const d = await r.json().catch(() => ({}));
    setNameMsg(r.ok ? { ok: true, text: "Saved." } : { ok: false, text: d.error ?? "Couldn't save." });
    if (r.ok) router.refresh();
  }
  const [chatId, setChatId] = useState(telegramChatId);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [hour, setHour] = useState<number | null>(digestHourUtc);
  const [digestMsg, setDigestMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [sending, setSending] = useState(false);
  // show hours in the viewer's local time, store them in UTC
  const offsetH = -new Date().getTimezoneOffset() / 60;
  const localOf = (utc: number) => (((utc + offsetH) % 24) + 24) % 24;
  const utcOf = (local: number) => (((local - offsetH) % 24) + 24) % 24;

  async function saveHour(v: string) {
    const next = v === "off" ? null : Math.round(utcOf(Number(v)));
    setHour(next);
    const r = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ digestHourUtc: next }) });
    setDigestMsg(r.ok ? { ok: true, text: next === null ? "Morning digest off." : "Saved." } : { ok: false, text: (await r.json()).error });
  }

  async function sendNow() {
    setSending(true);
    setDigestMsg(null);
    const r = await fetch("/api/digest", { method: "POST" });
    const d = await r.json();
    setSending(false);
    setDigestMsg(
      r.ok
        ? { ok: true, text: `Sent: "${d.title}". ${d.telegram ? "Check Telegram and" : "Find it in"} Alerts → Digests.` }
        : { ok: false, text: d.error },
    );
  }

  async function saveTelegram(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telegramChatId: chatId }) });
    const d = await r.json();
    setMsg(r.ok ? { ok: true, text: chatId ? "Telegram alerts on." : "Telegram alerts off." } : { ok: false, text: d.error });
  }

  async function rebuild() {
    if (!confirm("Rebuild your agent from fresh X data? Chat history stays.")) return;
    await fetch("/api/agent/regenerate", { method: "POST" });
    router.push("/generate");
  }

  return (
    <>
      <section className="rounded-2xl border border-line bg-panel p-5">
        <h2 className="text-sm font-bold">Agent name</h2>
        <p className="mt-1 text-xs leading-5 text-mute">What your agent is called in the chat and on the tab.</p>
        <form onSubmit={saveName} className="mt-3 flex gap-2">
          <label htmlFor="agent-name" className="sr-only">Agent name</label>
          <input
            id="agent-name"
            value={aName}
            onChange={(e) => {
              setAName(e.target.value.slice(0, 20));
              setNameMsg(null);
            }}
            maxLength={20}
            className="min-w-0 flex-1 rounded-lg border border-line bg-night px-3 py-2 text-sm outline-none focus:border-hat"
          />
          <button disabled={!aName.trim() || aName.trim() === agentName} className="rounded-lg bg-hat px-4 py-2 text-xs font-bold text-night disabled:opacity-40">
            Save
          </button>
        </form>
        {nameMsg && <p className={`mt-2 text-xs ${nameMsg.ok ? "text-gain" : "text-loss"}`}>{nameMsg.text}</p>}
      </section>

      <section className="rounded-2xl border border-line bg-panel p-5">
        <h2 className="text-sm font-bold">Telegram alerts</h2>
        {telegramEnabled ? (
          <>
            <p className="mt-2 text-xs leading-6 text-mute">
              Start a chat with the bot, then paste your chat id (send /start to @userinfobot to see it). Alerts arrive in Telegram as well as here.
            </p>
            <form onSubmit={saveTelegram} className="mt-3 flex gap-2">
              <input
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="123456789"
                aria-label="Telegram chat id"
                className="flex-1 rounded-lg border border-line bg-night px-3 py-2 text-sm outline-none focus:border-hat"
              />
              <button className="rounded-lg bg-hat px-4 py-2 font-display text-xs font-bold text-night">Save</button>
            </form>
            {msg && <p className={`mt-2 text-xs ${msg.ok ? "text-gain" : "text-loss"}`}>{msg.text}</p>}
          </>
        ) : (
          <p className="mt-2 text-xs leading-6 text-mute">Not set up on this server yet (TELEGRAM_BOT_TOKEN is empty).</p>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-panel p-5">
        <h2 className="text-sm font-bold">Morning digest</h2>
        <p className="mt-2 text-xs leading-6 text-mute">
          Once a day your agent sums up how your watchlist moved and what it flagged overnight. It lands in Alerts, and in Telegram if linked above.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label htmlFor="digest-hour" className="text-xs text-mute">Send at</label>
          <select
            id="digest-hour"
            value={hour === null ? "off" : String(Math.round(localOf(hour)))}
            onChange={(e) => saveHour(e.target.value)}
            className="rounded-lg border border-line bg-night px-3 py-2 text-sm outline-none focus:border-hat"
          >
            <option value="off">Off</option>
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>{`${String(h).padStart(2, "0")}:00`}</option>
            ))}
          </select>
          <span className="text-xs text-mute">your time</span>
          <button onClick={sendNow} disabled={sending} className="ml-auto rounded-lg border border-line px-4 py-2 text-xs hover:border-hat disabled:opacity-50">
            {sending ? "Sending…" : "Send one now"}
          </button>
        </div>
        {digestMsg && <p className={`mt-2 text-xs ${digestMsg.ok ? "text-gain" : "text-loss"}`}>{digestMsg.text}</p>}
      </section>

      <section className="rounded-2xl border border-line bg-panel p-5">
        <h2 className="text-sm font-bold">Rebuild agent</h2>
        <p className="mt-2 text-xs leading-6 text-mute">Re-reads your X profile, follows and posts, and may switch your mascot if your interests changed.</p>
        <button onClick={rebuild} className="mt-3 rounded-lg border border-line px-4 py-2 text-xs hover:border-hat">Rebuild agent</button>
      </section>
    </>
  );
}
