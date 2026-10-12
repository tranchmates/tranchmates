"use client";

import { useCallback, useEffect, useState } from "react";
import { WalletBar, type WalletRow } from "@/components/WalletBar";
import { usd, num, short } from "@/components/format";

type Holding = { mint: string; symbol: string; name: string; image?: string; amount: number; priceUsd: number | null; valueUsd: number | null };
type WalletPortfolio = {
  address: string;
  label: string | null;
  error?: string;
  solBalance?: number;
  solPriceUsd?: number | null;
  totalUsd?: number;
  tokens?: Holding[];
  nftCount?: number;
};

export default function PortfolioPage() {
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [data, setData] = useState<WalletPortfolio[] | null>(null);
  const [hideDust, setHideDust] = useState(true);

  const load = useCallback(async () => {
    setData(null);
    const [w, p] = await Promise.all([fetch("/api/wallets").then((r) => r.json()), fetch("/api/portfolio").then((r) => r.json())]);
    setWallets(w.wallets ?? []);
    setData(p.wallets ?? []);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const total = data?.reduce((s, w) => s + (w.totalUsd ?? 0), 0) ?? 0;

  // Merge holdings across wallets by mint.
  const merged = new Map<string, Holding>();
  let sol = 0;
  let solPrice: number | null = null;
  for (const w of data ?? []) {
    sol += w.solBalance ?? 0;
    solPrice = w.solPriceUsd ?? solPrice;
    for (const t of w.tokens ?? []) {
      const cur = merged.get(t.mint);
      merged.set(t.mint, cur ? { ...cur, amount: cur.amount + t.amount, valueUsd: (cur.valueUsd ?? 0) + (t.valueUsd ?? 0) } : t);
    }
  }
  const rows = [...merged.values()]
    .filter((t) => !hideDust || (t.valueUsd ?? 0) >= 1)
    .sort((a, b) => (b.valueUsd ?? -1) - (a.valueUsd ?? -1));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Portfolio</h1>
          <p className="mt-1 text-sm text-mute">Live balances from Solana mainnet. Prices from Helius and Jupiter.</p>
        </div>
        {data && data.length > 0 && (
          <div className="text-right">
            <p className="text-xs text-mute">Total value</p>
            <p className="font-display text-3xl font-extrabold">{usd(total)}</p>
          </div>
        )}
      </div>

      <WalletBar wallets={wallets} onChange={load} />

      {data === null ? (
        <p className="text-sm text-mute">Loading balances…</p>
      ) : wallets.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-6 py-10 text-center text-sm text-mute">
          Add a wallet address above to see holdings. Your agent can then answer questions about it.
        </p>
      ) : (
        <>
          {data.filter((w) => w.error).map((w) => (
            <p key={w.address} className="text-xs text-loss">{short(w.address)}: {w.error}</p>
          ))}
          <section className="overflow-hidden rounded-2xl border border-line bg-panel">
            <header className="flex items-center justify-between border-b border-line px-5 py-3">
              <h2 className="text-sm font-bold">Holdings</h2>
              <label className="flex items-center gap-2 text-xs text-mute">
                <input type="checkbox" checked={hideDust} onChange={(e) => setHideDust(e.target.checked)} className="accent-[#ffc531]" />
                Hide under $1
              </label>
            </header>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-left text-xs text-mute">
                  <tr>
                    <th className="px-5 py-2 font-normal">Token</th>
                    <th className="px-3 py-2 text-right font-normal">Amount</th>
                    <th className="px-3 py-2 text-right font-normal">Price</th>
                    <th className="px-5 py-2 text-right font-normal">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  <tr>
                    <td className="px-5 py-3 font-medium">SOL</td>
                    <td className="px-3 py-3 text-right">{num(sol)}</td>
                    <td className="px-3 py-3 text-right">{usd(solPrice)}</td>
                    <td className="px-5 py-3 text-right font-medium">{usd(solPrice != null ? sol * solPrice : null)}</td>
                  </tr>
                  {rows.map((t) => (
                    <tr key={t.mint}>
                      <td className="px-5 py-3">
                        <a href={`https://dexscreener.com/solana/${t.mint}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-hat">
                          {t.image ? <img src={t.image} alt="" className="h-6 w-6 rounded-full object-cover" /> : <span className="h-6 w-6 rounded-full bg-panel-2" />}
                          <span className="font-medium">{t.symbol}</span>
                          <span className="hidden truncate text-xs text-mute sm:inline">{t.name}</span>
                        </a>
                      </td>
                      <td className="px-3 py-3 text-right">{num(t.amount)}</td>
                      <td className="px-3 py-3 text-right">{usd(t.priceUsd, 6)}</td>
                      <td className="px-5 py-3 text-right font-medium">{usd(t.valueUsd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(data.reduce((s, w) => s + (w.nftCount ?? 0), 0) > 0) && (
              <p className="border-t border-line px-5 py-3 text-xs text-mute">
                Plus {data.reduce((s, w) => s + (w.nftCount ?? 0), 0)} NFTs (not valued).
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
