"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ago, short, usd } from "@/components/format";
import { requestChat } from "@/components/tokenFocus";
import { QuickBuyButton } from "@/components/QuickBuyButton";

export type TrackedWallet = {
  id: string;
  address: string;
  label: string;
  emoji: string;
  alerts: boolean;
  buys: boolean;
  sells: boolean;
  minSol: number;
  lastCheckedAt: string | null;
  createdAt: string;
};
export type WalletTradeRow = {
  id: string;
  createdAt: string;
  read: boolean;
  sig?: string;
  mint?: string;
  side?: "buy" | "sell";
  sol?: number;
  tokens?: number;
  wallet?: string;
  label?: string;
  emoji?: string;
  symbol?: string;
  mcap?: number | null;
  image?: string | null;
  soldPct?: number | null;
  // cluster signal rows
  cluster?: boolean;
  minutes?: number;
  buyers?: { emoji: string; label: string; sol: number }[];
};

export function soldText(pct?: number | null) {
  if (pct == null) return "sell";
  if (pct >= 0.97) return "sold all";
  return `sold ${Math.max(1, Math.round(pct * 100))}%`;
}

export const WALLET_EMOJIS = ["🐳", "🦈", "🧠", "👑", "🐸", "🦍", "🤡", "💎", "🔥", "🎯", "👻", "🐂", "🐻", "🥷", "🤖", "💩", "🦊", "🐙", "🚀", "👤"];

export function useWalletTracker(take?: number) {
  const [wallets, setWallets] = useState<TrackedWallet[] | null>(null);
  const [trades, setTrades] = useState<WalletTradeRow[]>([]);
  const load = useCallback(
    () =>
      fetch("/api/assistant/wallets", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => {
          setWallets(d.wallets ?? []);
          setTrades((d.trades ?? []).filter((t: WalletTradeRow) => t.mint).slice(0, take));
        })
        .catch(() => {}),
    [take],
  );
  useEffect(() => {
    load();
    const t = setInterval(load, 15_000);
    return () => clearInterval(t);
  }, [load]);
  return { wallets, trades, load, setWallets };
}

const SCAN_GAP_MS = 20 * 60_000;
/** Rows that get a "Scan CA" button: the newest trade of each token, then again only if the
 *  same token shows up 20+ minutes apart. Trades must be newest first. */
export function scanRows(trades: WalletTradeRow[]) {
  const shownAt = new Map<string, number>();
  const ids = new Set<string>();
  for (const t of trades) {
    if (!t.mint) continue;
    const at = new Date(t.createdAt).getTime();
    const last = shownAt.get(t.mint);
    if (last == null || last - at >= SCAN_GAP_MS) {
      ids.add(t.id);
      shownAt.set(t.mint, at);
    }
  }
  return ids;
}

/** Who made a trade: the wallet's current emoji and name, falling back to what the trade recorded. */
export function whoOf(t: WalletTradeRow, wallets: TrackedWallet[] | null) {
  const w = wallets?.find((x) => x.address === t.wallet);
  return { emoji: w?.emoji ?? t.emoji ?? "👤", name: w?.label ?? t.label ?? short(t.wallet ?? "") };
}

// Compact feed for the MemePaws page; managing wallets lives on /wallets.
export function WalletTrackers() {
  const { wallets, trades } = useWalletTracker(60);
  const withScan = scanRows(trades);

  return (
    <section className="flex min-h-[320px] flex-col overflow-hidden rounded-2xl border border-line bg-panel xl:h-full xl:min-h-0">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <h2 className="text-sm font-bold">Wallet tracker</h2>
        <Link href="/wallets" className="rounded-lg border border-line px-2.5 py-1 text-xs hover:border-[#9fb4ff]">
          Manage
        </Link>
      </header>

      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        {wallets === null ? (
          <p className="px-4 py-4 text-xs text-mute">Loading…</p>
        ) : wallets.length === 0 ? (
          <div className="px-4 py-4 text-xs text-mute">
            <p>Follow any wallet: every buy and sell lands here.</p>
            <Link href="/wallets" className="mt-3 inline-block rounded-lg border border-line px-3 py-1.5 text-ink hover:border-[#9fb4ff]">
              Track a wallet
            </Link>
          </div>
        ) : trades.length === 0 ? (
          <p className="px-4 py-4 text-xs text-mute">No trades yet.</p>
        ) : (
          <ul className="divide-y divide-line">
            {trades.map((t) => {
              if (t.cluster) {
                return (
                  <li key={t.id} className="flex items-center gap-2.5 border-l-2 border-hat bg-hat/[0.08] px-4 py-2">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-hat/20 text-lg" aria-hidden="true">🔥</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-bold">
                        {t.buyers?.length} wallets · <span className="text-hat">${t.symbol}</span>
                      </p>
                      <p className="truncate text-[11px] text-mute">
                        {t.buyers?.map((b) => b.emoji).join("")} · {(t.sol ?? 0).toFixed(2)} SOL · {t.minutes}m · {ago(t.createdAt)}
                      </p>
                    </div>
                    <QuickBuyButton mint={t.mint!} symbol={t.symbol} />
                    <button
                      type="button"
                      onClick={() => requestChat(`Check this CA: ${t.mint}`)}
                      className="shrink-0 rounded-md bg-hat px-2 py-1 font-display text-[10px] font-bold text-night hover:brightness-110"
                      aria-label={`Scan $${t.symbol}`}
                    >
                      Scan
                    </button>
                  </li>
                );
              }
              const buy = t.side === "buy";
              const who = whoOf(t, wallets);
              return (
                <li key={t.id} className={`flex items-center gap-2.5 px-4 py-2 ${t.read ? "" : "bg-gain/[0.04]"}`}>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-panel-2 text-lg" aria-hidden="true">
                    {who.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px]">
                      <span className="font-bold">{who.name}</span> <span className={buy ? "text-gain" : "text-loss"}>{buy ? "buy" : soldText(t.soldPct)}</span>{" "}
                      <span className="font-bold">${t.symbol}</span>
                    </p>
                    <p className="truncate text-[11px] text-mute">
                      <span className={buy ? "text-gain" : "text-loss"}>{(t.sol ?? 0).toFixed((t.sol ?? 0) < 1 ? 3 : 2)} SOL</span>
                      {" · "}
                      {usd(t.mcap, 0)}
                      {" · "}
                      {ago(t.createdAt)}
                    </p>
                  </div>
                  {withScan.has(t.id) && <QuickBuyButton mint={t.mint!} symbol={t.symbol} />}
                  {withScan.has(t.id) && (
                  <button
                    type="button"
                    onClick={() => requestChat(`Check this CA: ${t.mint}`)}
                    className="shrink-0 rounded-md bg-hat px-2 py-1 font-display text-[10px] font-bold text-night hover:brightness-110"
                    aria-label={`Scan $${t.symbol}`}
                    title={short(t.mint!)}
                  >
                    Scan
                  </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
