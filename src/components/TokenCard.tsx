"use client";

import { useEffect, useState } from "react";
import { usd, pct, age, short } from "./format";
import { ChartButton } from "./ChartButton";
import { focusToken } from "./tokenFocus";
import { DeepCheck } from "./DeepCheck";
import { TradePanel } from "./TradePanel";
import { TokenIcon } from "./TokenIcon";
import { RISK_STYLE, riskOf, isDanger } from "./riskStyle";
import { computeRisk, type Risk } from "@/lib/risk";

export type TokenReport = {
  mint: string;
  name: string;
  symbol: string;
  image?: string;
  priceUsd: number | null;
  marketCap: number | null;
  liquidityUsd: number | null;
  volume: { m5: number; h1: number; h6: number; h24: number };
  change: { m5: number; h1: number; h6: number; h24: number };
  txns24: { buys: number; sells: number };
  ageHours: number | null;
  dex: string | null;
  pairUrl: string | null;
  top10Pct: number | null;
  mintAuthority?: string | null;
  freezeAuthority?: string | null;
  socials: { label: string; url: string }[];
  flags: { level: "danger" | "warn" | "ok"; text: string }[];
  score: number;
  risk?: Risk;
};

const FLAG_TONE = { danger: "text-loss", warn: "text-hat", ok: "text-gain" } as const;
const FLAG_MARK = { danger: "✕", warn: "!", ok: "✓" } as const;

export function TokenCard({
  t,
  onWatch,
  auto = false,
  deep,
}: {
  t: TokenReport;
  onWatch?: (mint: string) => void;
  auto?: boolean;
  deep?: { dev?: unknown; social?: unknown };
}) {
  // The freshly scanned card (auto) shows the trade panel right away; older cards open it on demand.
  const [trade, setTrade] = useState(auto);
  useEffect(() => setTrade(auto), [auto]); // a newer scan takes over the open panel
  const [devData, setDevData] = useState<Parameters<typeof computeRisk>[1]>(null);
  const [socialData, setSocialData] = useState<Parameters<typeof computeRisk>[2]>(null);
  // Server scans arrive fully scored. Otherwise re-score here once the dev check lands.
  const risk =
    t.risk && !t.risk.partial
      ? t.risk
      : t.mintAuthority !== undefined
        ? computeRisk({ ...t, mintAuthority: t.mintAuthority ?? null, freezeAuthority: t.freezeAuthority ?? null }, devData, socialData)
        : riskOf(t);
  const rs = RISK_STYLE[risk.level];
  const worst = risk.reasons.find((r) => r.kind === "bad");
  const stats: [string, string, string?][] = [
    ["Price", usd(t.priceUsd, 6)],
    ["Mcap", usd(t.marketCap)],
    ["Liquidity", usd(t.liquidityUsd)],
    ["Vol 1h", usd(t.volume.h1)],
    ["Vol 24h", usd(t.volume.h24)],
    ["Age", age(t.ageHours)],
    ["1h", pct(t.change.h1), t.change.h1 >= 0 ? "text-gain" : "text-loss"],
    ["24h", pct(t.change.h24), t.change.h24 >= 0 ? "text-gain" : "text-loss"],
  ];
  return (
    <div className={`mt-3 overflow-hidden rounded-xl border bg-night ${rs.card}`}>
      {isDanger(risk.level) && (
        <div role="alert" className={`flex items-center gap-2 px-4 py-2 text-xs font-bold ${risk.level === "scam" ? "bg-loss text-white" : "bg-loss/15 text-loss"}`}>
          <span aria-hidden="true">⚠</span>
          <span>{risk.label}{worst ? `: ${worst.text}` : ""}</span>
        </div>
      )}
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <TokenIcon mint={t.mint} src={t.image} symbol={t.symbol} className="h-9 w-9" />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => focusToken(t.mint, t.symbol)}
            title="Show X posts about this token"
            className="block max-w-full truncate text-left text-sm font-bold hover:text-hat"
          >
            ${t.symbol} <span className="font-normal text-mute">{t.name}</span>
          </button>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(t.mint)}
            className="text-xs text-mute hover:text-ink"
            title="Copy address"
          >
            {short(t.mint)} · copy
          </button>
        </div>
        <div
          className={`min-w-[78px] rounded-lg border px-2.5 py-1.5 text-center ${rs.badge}`}
          title={`Risk score ${risk.score}/100${risk.partial ? " (without dev and launch data)" : ""}. Heuristic, not financial advice.`}
        >
          <p className="font-display text-xl font-extrabold leading-none">{risk.score}</p>
          <p className="mt-0.5 text-[10px] font-bold">{risk.label}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-px bg-line text-xs @xl:grid-cols-4">
        {stats.map(([k, v, tone]) => (
          <div key={k} className="bg-night px-3 py-2">
            <dt className="text-mute">{k}</dt>
            <dd className={`mt-0.5 font-medium ${tone ?? ""}`}>{v}</dd>
          </div>
        ))}
      </dl>
      {risk.reasons.length > 0 ? (
        <ul className="space-y-1.5 px-4 py-3 text-xs">
          {risk.reasons.map((r) => (
            <li key={r.text} className="flex gap-2">
              <span className={`w-3 shrink-0 text-center ${r.kind === "good" ? "text-gain" : r.impact >= 20 ? "text-loss" : "text-hat"}`}>
                {r.kind === "good" ? "✓" : r.impact >= 20 ? "✕" : "!"}
              </span>
              <span className={r.kind === "bad" && r.impact >= 30 ? "font-bold text-loss" : ""}>{r.text}</span>
            </li>
          ))}
          {risk.partial && <li className="pl-5 text-mute">Dev and launch data not in yet: the score may drop.</li>}
        </ul>
      ) : (
      <ul className="space-y-1.5 px-4 py-3 text-xs">
        {t.flags.map((f) => (
          <li key={f.text} className="flex gap-2">
            <span className={`w-3 shrink-0 text-center ${FLAG_TONE[f.level]}`}>{FLAG_MARK[f.level]}</span>
            <span>{f.text}</span>
          </li>
        ))}
      </ul>
      )}
      <DeepCheck
        mint={t.mint}
        auto={auto}
        initialDev={deep?.dev as never}
        initialSocial={deep?.social as never}
        onDev={setDevData}
        onSocial={setSocialData}
      />
      <div className="flex flex-wrap items-center gap-3 border-t border-line px-4 py-2.5 text-xs">
        <a href={`https://solscan.io/token/${t.mint}`} target="_blank" rel="noreferrer" className="text-mute hover:text-ink">Solscan</a>
        {t.socials.slice(0, 3).map((s) => (
          <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="text-mute hover:text-ink">{s.label}</a>
        ))}
        {t.pairUrl && <ChartButton pairUrl={t.pairUrl} symbol={t.symbol} />}
        {!auto && (
          <button
            type="button"
            onClick={() => setTrade((v) => !v)}
            aria-expanded={trade}
            className={`${t.pairUrl ? "" : "ml-auto "}rounded-md bg-hat px-2.5 py-1 font-bold text-night hover:brightness-110`}
          >
            {trade ? "Close" : "Trade"}
          </button>
        )}
        {onWatch && (
          <button type="button" onClick={() => onWatch(t.mint)} className="rounded-md border border-hat/50 px-2.5 py-1 text-hat hover:bg-hat/10">
            Watch volume
          </button>
        )}
      </div>
      {trade && <TradePanel mint={t.mint} symbol={t.symbol} priceUsd={t.priceUsd} />}
    </div>
  );
}
