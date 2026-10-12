"use client";

import { useCallback, useEffect, useState } from "react";
import { WalletBar, type WalletRow } from "@/components/WalletBar";
import { usd, num, short } from "@/components/format";

type Claim = { mint: string; symbol: string; project: string; amount: number; claimedAt: string; signature: string; valueNowUsd: number | null };
type WalletDrops = { wallet: string; label: string | null; claims: Claim[]; scannedTx?: number; complete?: boolean; error?: string };
type Tracked = { mint: string; symbol: string; project: string; date: string };

export default function AirdropsPage() {
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [data, setData] = useState<WalletDrops[] | null>(null);
  const [tracked, setTracked] = useState<Tracked[]>([]);

  const load = useCallback(async () => {
    setData(null);
    const w = await fetch("/api/wallets").then((r) => r.json());
    setWallets(w.wallets ?? []);
    const d = await fetch("/api/airdrops").then((r) => r.json());
    setData(d.wallets ?? []);
    setTracked(d.tracked ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const claims = (data ?? []).flatMap((w) => w.claims.map((c) => ({ ...c, wallet: w.wallet })));
  const total = claims.reduce((s, c) => s + (c.valueNowUsd ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Airdrops</h1>
          <p className="mt-1 max-w-[60ch] text-sm text-mute">
            Past drops your wallets received, found in on-chain history. Valued at today&apos;s price.
          </p>
        </div>
        {claims.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-mute">Worth today</p>
            <p className="font-display text-3xl font-extrabold text-hat">{usd(total)}</p>
          </div>
        )}
      </div>

      <WalletBar wallets={wallets} onChange={load} />

      {data === null ? (
        <p className="text-sm text-mute">Digging through history… big wallets take up to a minute.</p>
      ) : wallets.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-mute">Add a wallet to scan its airdrop history.</p>
      ) : (
        <>
          {data.filter((w) => w.error).map((w) => (
            <p key={w.wallet} className="text-xs text-loss">{short(w.wallet)}: {w.error}</p>
          ))}
          {data.filter((w) => w.complete === false).map((w) => (
            <p key={w.wallet} className="text-xs text-hat">
              {short(w.wallet)}: very active wallet, scanned the latest {num(w.scannedTx ?? 0)} transactions. Older drops may be missing.
            </p>
          ))}
          {claims.length === 0 ? (
            <p className="rounded-2xl border border-line bg-panel px-6 py-10 text-center text-sm text-mute">No tracked airdrops found in these wallets.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {claims.map((c) => (
                <li key={`${c.wallet}-${c.mint}`} className="rounded-2xl border border-line bg-panel p-5">
                  <div className="flex items-baseline justify-between">
                    <p className="font-display text-xl font-bold">${c.symbol}</p>
                    <p className="text-xs text-mute">{new Date(c.claimedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                  <p className="text-xs text-mute">{c.project}</p>
                  <p className="mt-4 text-sm">{num(c.amount)} {c.symbol}</p>
                  <p className="font-display text-2xl font-bold text-hat">{usd(c.valueNowUsd)}</p>
                  <div className="mt-3 flex justify-between text-xs text-mute">
                    <span>{short(c.wallet)}</span>
                    <a href={`https://solscan.io/tx/${c.signature}`} target="_blank" rel="noreferrer" className="hover:text-ink">Transaction</a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tracked.length > 0 && (
        <p className="text-xs leading-6 text-mute">Tracked drops: {tracked.map((t) => `${t.symbol} (${t.project})`).join(", ")}.</p>
      )}
    </div>
  );
}
