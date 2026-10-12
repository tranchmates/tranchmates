"use client";

import { useState } from "react";

// Token logo with fallbacks: the metadata image (often an IPFS link that fails),
// then DEX Screener's icon CDN, then a lettered circle.
export function TokenIcon({ mint, src, symbol, className = "h-7 w-7" }: { mint: string; src?: string | null; symbol?: string; className?: string }) {
  const sources = [src, `https://dd.dexscreener.com/ds-data/tokens/solana/${mint}.png?size=lg`].filter(Boolean) as string[];
  const [i, setI] = useState(0);
  if (i >= sources.length) {
    return (
      <span className={`grid shrink-0 place-items-center rounded-full bg-panel-2 font-display text-[10px] font-bold text-mute ${className}`} aria-hidden="true">
        {(symbol ?? "?").replace("$", "").slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return <img src={sources[i]} alt="" onError={() => setI((n) => n + 1)} className={`shrink-0 rounded-full bg-panel-2 object-cover ${className}`} />;
}
