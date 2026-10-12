"use client";

import { useEffect, useState } from "react";
import { XGlyph } from "./XGlyph";
import { DigLoader } from "./DigLoader";

// The big hard-hat button on the landing page. On click it plays the dig
// loader while the browser heads off to X.
export function SignInButton({ signedIn, loginHref = "/api/auth/x/login" }: { signedIn: boolean; loginHref?: string }) {
  const [leaving, setLeaving] = useState(false);
  const href = signedIn ? "/dashboard" : loginHref;

  // Coming back with the browser Back button restores this page from cache: drop the loader.
  useEffect(() => {
    const reset = () => setLeaving(false);
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <>
      <a
        href={href}
        onClick={() => setLeaving(true)}
        className="big-cta group relative flex w-full max-w-[560px] items-center gap-5 overflow-hidden rounded-[22px] bg-hat px-6 py-5 text-night shadow-[0_10px_0_var(--color-hat-deep),0_24px_50px_-12px_rgba(255,197,49,0.45)] transition-transform duration-150 hover:-translate-y-1 active:translate-y-2 active:shadow-[0_3px_0_var(--color-hat-deep)] sm:px-8 sm:py-7"
      >
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-night text-hat sm:h-16 sm:w-16">
          {signedIn ? <span className="font-display text-2xl font-extrabold">›</span> : <XGlyph className="h-7 w-7" />}
        </span>
        <span className="min-w-0">
          <span className="block font-display text-[clamp(1.35rem,3.2vw,2rem)] font-extrabold leading-tight">
            {signedIn ? "Open dashboard" : "Sign in with X"}
          </span>
          <span className="mt-1 block text-[13px] font-medium text-night/70 sm:text-sm">
            {signedIn ? "Your agent is waiting for you" : "Spawn your agent in about a minute"}
          </span>
        </span>
        <span className="big-cta-shine" aria-hidden="true" />
      </a>
      {leaving && <DigLoader mode="connect" durationMs={2600} />}
    </>
  );
}
