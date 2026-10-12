"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mascot } from "@/components/mascots/Mascot";
import { Logo } from "@/components/Logo";

const STEPS = [
  { id: "profile", label: "Reading your profile" },
  { id: "following", label: "Scanning who you follow" },
  { id: "posts", label: "Reading your recent posts" },
  { id: "interests", label: "Mapping your interests" },
  { id: "persona", label: "Picking a name and a hat" },
] as const;

type Status = {
  agent: {
    status: string;
    step: string;
    error: string | null;
    name: string | null;
    mascot: "cat" | "dog";
    persona: string | null;
    interests: { tags: { label: string; weight: number }[] } | null;
  } | null;
};

export function GenerateClient({ username, name, avatarUrl }: { username: string; name: string; avatarUrl: string | null }) {
  const router = useRouter();
  const [s, setS] = useState<Status["agent"]>(null);
  const [agentName, setAgentName] = useState("");
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (s?.status === "ready" && !agentName) setAgentName(s.name ?? "");
  }, [s?.status, s?.name, agentName]);

  async function finish(e: React.FormEvent) {
    e.preventDefault();
    const n = agentName.trim();
    if (n && n !== s?.name) {
      setSaving(true);
      const r = await fetch("/api/agent/name", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: n }) });
      const d = await r.json().catch(() => ({}));
      setSaving(false);
      if (!r.ok) return setNameErr(d.error ?? "Couldn't save the name.");
    }
    router.push("/dashboard");
  }
  const started = useRef(false);

  useEffect(() => {
    let stop = false;
    let lastStep = "";
    let stepSince = Date.now();
    const poll = async () => {
      if (!started.current) {
        started.current = true;
        await fetch("/api/agent/generate", { method: "POST" }).catch(() => {});
      }
      while (!stop) {
        const r = await fetch("/api/agent/status", { cache: "no-store" }).then((x) => x.json()).catch(() => null);
        if (r?.agent) {
          setS(r.agent);
          // A run killed by a timeout or restart stays "generating"; restart it once the step stalls.
          if (r.agent.step !== lastStep) {
            lastStep = r.agent.step;
            stepSince = Date.now();
          } else if (r.agent.status === "generating" && Date.now() - stepSince > 130_000) {
            stepSince = Date.now();
            await fetch("/api/agent/generate", { method: "POST" }).catch(() => {});
          }
        }
        if (r?.agent?.status === "ready" || r?.agent?.status === "failed") break;
        await new Promise((res) => setTimeout(res, 1500));
      }
    };
    poll();
    return () => {
      stop = true;
    };
  }, []);

  const current = STEPS.findIndex((x) => x.id === s?.step);
  const ready = s?.status === "ready";
  const failed = s?.status === "failed";

  async function retry() {
    await fetch("/api/agent/regenerate", { method: "POST" });
    window.location.reload();
  }

  return (
    <main className="terminal-floor flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <div className="flex items-center gap-3 text-sm">
          {avatarUrl && <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full border border-line" />}
          <span className="text-mute">@{username}</span>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 px-4 pb-16 sm:px-6 md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative mx-auto w-56 sm:w-72">
          <Mascot kind={ready ? s!.mascot : "cat"} busy={!ready && !failed} />
          {!ready && (
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-panel-2">
              <div className="dig-rail h-full transition-[width] duration-700" style={{ width: `${Math.max(8, ((current + 1) / STEPS.length) * 100)}%` }} />
            </div>
          )}
        </div>

        <div aria-live="polite">
          {!ready && !failed && (
            <>
              <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
                Building your agent, {name.split(" ")[0]}.
              </h1>
              <p className="mt-3 text-sm text-mute">Usually under a minute. Keep this tab open.</p>
              <ol className="mt-8 space-y-3 text-sm">
                {STEPS.map((step, i) => {
                  const done = i < current;
                  const active = i === current;
                  return (
                    <li key={step.id} className={`flex items-center gap-3 ${done ? "text-ink" : active ? "text-hat" : "text-mute/60"}`}>
                      <span className="w-5 text-center">{done ? "✓" : active ? "›" : "·"}</span>
                      {step.label}
                      {active && <span className="inline-block h-3.5 w-2 bg-hat animate-blink-caret" />}
                    </li>
                  );
                })}
              </ol>
            </>
          )}

          {failed && (
            <>
              <h1 className="font-display text-3xl font-extrabold">The dig hit a rock.</h1>
              <p className="mt-4 max-w-[52ch] rounded-xl border border-loss/40 bg-loss/10 p-4 text-sm leading-6 text-ink">{s?.error}</p>
              <button onClick={retry} className="mt-6 rounded-xl bg-hat px-5 py-3 font-display text-sm font-bold text-night">
                Try again
              </button>
            </>
          )}

          {ready && s && (
            <>
              <p className="text-sm text-gain">Agent online</p>
              <h1 className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">Name your agent.</h1>
              <p className="mt-4 max-w-[52ch] text-sm leading-7 text-mute">{s.persona}</p>
              {!!s.interests?.tags.length && (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {s.interests.tags.map((t) => (
                    <li key={t.label} className="rounded-full border border-line bg-panel px-3 py-1 text-xs">
                      {t.label} <span className="text-hat">{t.weight}</span>
                    </li>
                  ))}
                </ul>
              )}
              <form onSubmit={finish} className="mt-8 max-w-md">
                <label htmlFor="agent-name" className="text-xs text-mute">
                  Your agent&apos;s name (you can change it later in Settings)
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="agent-name"
                    value={agentName}
                    onChange={(e) => {
                      setAgentName(e.target.value.slice(0, 20));
                      setNameErr(null);
                    }}
                    maxLength={20}
                    autoFocus
                    className="min-w-0 flex-1 rounded-xl border border-line bg-night px-4 py-3 font-display text-lg font-bold outline-none focus:border-hat"
                  />
                  <button
                    disabled={saving || !agentName.trim()}
                    className="shrink-0 rounded-xl bg-hat px-5 py-3 font-display text-[15px] font-bold text-night shadow-[0_6px_0_var(--color-hat-deep)] disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Let's dig"}
                  </button>
                </div>
                {nameErr && (
                  <p role="alert" className="mt-2 text-xs text-loss">
                    {nameErr}
                  </p>
                )}
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
