import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { Mascot } from "@/components/mascots/Mascot";
import { getUser } from "@/lib/session";
import { FEATURES, HOW, LINKS, NEWS, PAWS, TRUST } from "@/content/about";
import { PawsCa } from "@/components/PawsCa";

export const metadata: Metadata = {
  title: "About trenchmates",
  description: "What trenchmates is, how it works, $PAWS, and the latest news.",
};

const fmtDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export default async function AboutPage() {
  const user = await getUser().catch(() => null);
  return (
    <main className="terminal-floor min-h-dvh">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo href={user ? "/dashboard" : "/"} />
        <nav className="flex items-center gap-5 text-sm" aria-label="About sections">
          <a href="#news" className="hidden text-mute hover:text-ink sm:inline">News</a>
          <a href="#features" className="hidden text-mute hover:text-ink sm:inline">Features</a>
          <a href="#paws" className="hidden text-mute hover:text-ink sm:inline">$PAWS</a>
          <Link href={user ? "/dashboard" : "/"} className="rounded-lg border border-line px-3 py-1.5 hover:border-hat">
            {user ? "Back to app" : "Open trenchmates"}
          </Link>
        </nav>
      </header>

      {/* intro */}
      <section className="mx-auto grid max-w-5xl items-end gap-8 px-4 pb-14 pt-8 sm:px-6 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs text-hat">› about</p>
          <h1 className="mt-2 font-display text-[clamp(2rem,5vw,3.4rem)] font-extrabold leading-[1.05] tracking-tight">
            trench<span className="text-hat">mates</span>
          </h1>
          <p className="mt-5 max-w-[56ch] text-[15px] leading-7 text-mute">
            A Solana trench agent built from your X. It reads what you follow and post, then helps you check contracts,
            follow the wallets that matter and trade from one screen. Two mascots, one job: keep you out of rugs and early on
            the good ones.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2 text-xs">
            <li><a href={LINKS.site} className="inline-block rounded-full border border-line px-3 py-1.5 hover:border-hat"><span aria-hidden="true">🌐</span> trenchmates.xyz</a></li>
            <li><a href={LINKS.x} target="_blank" rel="noreferrer" className="inline-block rounded-full border border-line px-3 py-1.5 hover:border-hat">X {LINKS.xHandle}</a></li>
            <li><a href={LINKS.telegram} target="_blank" rel="noreferrer" className="inline-block rounded-full border border-line px-3 py-1.5 hover:border-hat" aria-label={`Telegram ${LINKS.telegramHandle}`}><span aria-hidden="true">✈️</span> {LINKS.telegramHandle}</a></li>
          </ul>
        </div>
        <div className="hidden items-end gap-2 md:flex" aria-hidden="true">
          <Mascot kind="dog" className="w-28" />
          <Mascot kind="cat" className="w-32" />
        </div>
      </section>

      {/* news */}
      <section id="news" className="border-y border-line bg-panel/60">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <h2 className="font-display text-2xl font-bold">News</h2>
          <ol className="mt-6 space-y-3">
            {NEWS.map((n, i) => (
              <li key={i} className="grid gap-1 rounded-xl border border-line bg-night/60 px-5 py-4 sm:grid-cols-[120px_1fr] sm:gap-6">
                <time dateTime={n.date} className="text-xs text-mute sm:pt-0.5">{fmtDate(n.date)}</time>
                <div>
                  <h3 className="font-display text-[15px] font-bold">{n.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-mute">{n.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* how */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <h2 className="font-display text-2xl font-bold">How it works</h2>
        <ol className="mt-6 grid gap-3 md:grid-cols-3">
          {HOW.map((h, i) => (
            <li key={h.step} className="rounded-xl border border-line bg-panel p-5">
              <p className="font-display text-xs font-bold text-hat">0{i + 1}</p>
              <h3 className="mt-2 font-display text-[15px] font-bold">{h.step}</h3>
              <p className="mt-2 text-sm leading-6 text-mute">{h.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* features */}
      <section id="features" className="mx-auto max-w-5xl px-4 pb-14 sm:px-6">
        <h2 className="font-display text-2xl font-bold">What&apos;s inside</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <article key={f.name} className="rounded-xl border border-line bg-panel p-5">
              <h3 className="font-display text-[15px] font-bold">
                {f.name}
                {f.who && <span className="ml-2 font-mono text-xs font-normal text-mute">{f.who}</span>}
              </h3>
              <p className="mt-2 text-sm leading-6 text-mute">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* $PAWS */}
      <section id="paws" className="mx-auto max-w-5xl px-4 pb-14 sm:px-6">
        <div className="rounded-2xl border border-hat/50 bg-hat/[0.06] p-6 sm:p-8">
          <h2 className="font-display text-2xl font-bold text-hat">{PAWS.title}</h2>
          <PawsCa className="mt-4" />
          <ul className="mt-4 space-y-2 text-sm leading-6">
            {PAWS.lines.map((l) => (
              <li key={l} className="flex gap-3"><span className="text-hat" aria-hidden="true">›</span><span>{l}</span></li>
            ))}
          </ul>
        </div>
      </section>

      {/* trust */}
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <h2 className="font-display text-2xl font-bold">Your keys, your call</h2>
        <ul className="mt-5 space-y-2 text-sm leading-6 text-mute">
          {TRUST.map((t) => (
            <li key={t} className="flex gap-3"><span className="text-gain" aria-hidden="true">✓</span><span>{t}</span></li>
          ))}
        </ul>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-mute sm:px-6">
          <span>trenchmates · {LINKS.site.replace("https://", "")}</span>
          <span className="flex gap-4">
            <a href={LINKS.x} target="_blank" rel="noreferrer" className="hover:text-ink">X</a>
            <a href={LINKS.telegram} target="_blank" rel="noreferrer" className="hover:text-ink">Telegram</a>
          </span>
        </div>
      </footer>
    </main>
  );
}
