"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { TokenIcon } from "@/components/TokenIcon";
import { ago, short, usd } from "@/components/format";
import { WALLET_EMOJIS, scanRows, soldText, useWalletTracker, whoOf, type TrackedWallet } from "@/components/WalletTrackers";
import { QuickBuyButton } from "@/components/QuickBuyButton";
import { QUICK_BUY_PRESETS, getQuickBuy, onQuickBuyChange, setQuickBuy } from "@/components/quickBuy";

const MAX = 15;

async function api(method: "POST" | "PATCH" | "DELETE", body: unknown) {
  const r = await fetch("/api/assistant/wallets", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? "Something went wrong.");
  return d;
}

function EmojiPicker({ value, onPick, compact = false }: { value: string; onPick: (e: string) => void; compact?: boolean }) {
  return (
    <div className={`flex flex-wrap gap-1 ${compact ? "" : "rounded-lg border border-line bg-night p-1.5"}`} role="radiogroup" aria-label="Emoji">
      {WALLET_EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          role="radio"
          aria-checked={value === e}
          onClick={() => onPick(e)}
          className={`grid h-7 w-7 place-items-center rounded-md text-base ${value === e ? "bg-[#9fb4ff]/20 ring-1 ring-[#9fb4ff]" : "hover:bg-panel-2"}`}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${on ? "border-[#9fb4ff]/60 text-ink" : "border-line text-mute"}`}
    >
      <span className={`h-2 w-2 rounded-full ${on ? "bg-gain" : "bg-mute/40"}`} aria-hidden="true" />
      {label}
    </button>
  );
}

function WalletRow({ w, trades, onChanged }: { w: TrackedWallet; trades: number; onChanged: () => void }) {
  const [picking, setPicking] = useState(false);
  const [name, setName] = useState(w.label);
  const [minSol, setMinSol] = useState(String(w.minSol || ""));
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const patch = async (p: Partial<TrackedWallet>) => {
    await api("PATCH", { id: w.id, ...p }).catch(() => {});
    onChanged();
  };

  return (
    <li className="px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPicking((v) => !v)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-panel-2 text-xl ring-1 ring-line hover:ring-[#9fb4ff]"
          aria-label={`Change emoji for ${w.label}`}
          aria-expanded={picking}
        >
          {w.emoji}
        </button>
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor={`name-${w.id}`}>Name</label>
          <input
            id={`name-${w.id}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && name !== w.label && patch({ label: name })}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            maxLength={24}
            className="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 font-display text-[15px] font-bold outline-none hover:border-line focus:border-[#9fb4ff]"
          />
          <p className="flex items-center gap-2 px-1 text-[11px] text-mute">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(w.address).catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
              className="font-mono hover:text-ink"
              title="Copy address"
            >
              {copied ? "copied" : short(w.address)}
            </button>
            <a href={`https://solscan.io/account/${w.address}`} target="_blank" rel="noreferrer" className="hover:text-ink">
              Solscan
            </a>
            <span>· {trades} trades</span>
          </p>
        </div>
        {confirm ? (
          <span className="flex gap-2 text-[11px]">
            <button
              type="button"
              onClick={async () => {
                await api("DELETE", { id: w.id }).catch(() => {});
                onChanged();
              }}
              className="font-bold text-loss"
            >
              Remove
            </button>
            <button type="button" onClick={() => setConfirm(false)} className="text-mute">
              Keep
            </button>
          </span>
        ) : (
          <button type="button" onClick={() => setConfirm(true)} className="text-[11px] text-mute hover:text-loss" aria-label={`Stop tracking ${w.label}`}>
            Remove
          </button>
        )}
      </div>

      {picking && (
        <div className="mt-2">
          <EmojiPicker
            value={w.emoji}
            onPick={(e) => {
              setPicking(false);
              patch({ emoji: e });
            }}
          />
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pl-[52px]">
        <Toggle on={w.alerts} onChange={(v) => patch({ alerts: v })} label="Pop-ups" />
        <Toggle on={w.buys} onChange={(v) => patch({ buys: v })} label="Buys" />
        <Toggle on={w.sells} onChange={(v) => patch({ sells: v })} label="Sells" />
        <label className="flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-[11px] text-mute focus-within:border-[#9fb4ff]">
          Min
          <input
            value={minSol}
            onChange={(e) => setMinSol(e.target.value.replace(/[^0-9.]/g, ""))}
            onBlur={() => Number(minSol || 0) !== w.minSol && patch({ minSol: Number(minSol || 0) })}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
            inputMode="decimal"
            placeholder="0"
            aria-label="Minimum trade size in SOL"
            className="w-9 bg-transparent text-right text-ink outline-none"
          />
          SOL
        </label>
      </div>
    </li>
  );
}

function QuickBuySetting() {
  const [v, setV] = useState(0.1);
  const [custom, setCustom] = useState("");
  useEffect(() => {
    setV(getQuickBuy());
    return onQuickBuyChange(() => setV(getQuickBuy()));
  }, []);
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
      <span className="mr-1 text-mute">⚡ Quick buy</span>
      {QUICK_BUY_PRESETS.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => setQuickBuy(p)}
          aria-pressed={v === p}
          className={`rounded-full border px-2 py-0.5 tabular-nums ${v === p ? "border-gain text-gain" : "border-line text-mute hover:text-ink"}`}
        >
          {p}
        </button>
      ))}
      <label className="flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-mute focus-within:border-gain">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value.replace(/[^0-9.]/g, ""))}
          onBlur={() => {
            const n = Number(custom);
            if (n > 0 && n <= 100) setQuickBuy(n);
            setCustom("");
          }}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          placeholder={QUICK_BUY_PRESETS.includes(v) ? "other" : String(v)}
          inputMode="decimal"
          aria-label="Custom quick buy amount in SOL"
          className="w-10 bg-transparent text-ink outline-none placeholder:text-mute"
        />
        SOL
      </label>
    </div>
  );
}

export function WalletsClient() {
  const { wallets, trades, load } = useWalletTracker();
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState(WALLET_EMOJIS[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [walletFilter, setWalletFilter] = useState<string>("");
  const [side, setSide] = useState<"" | "buy" | "sell">("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await api("POST", { address, label, emoji });
      setAddress("");
      setLabel("");
      load();
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const shown = trades.filter((t) =>
    t.cluster ? !walletFilter && side !== "sell" : (!walletFilter || t.wallet === walletFilter) && (!side || t.side === side),
  );
  const withScan = scanRows(shown);
  const countOf = (addr: string) => trades.filter((t) => !t.cluster && t.wallet === addr).length;

  return (
    <div className="grid gap-4 xl:h-[calc(100dvh-106px)] xl:grid-cols-[440px_minmax(0,1fr)]">
      {/* manage */}
      <div className="flex min-h-0 flex-col gap-4">
        <form onSubmit={add} className="shrink-0 space-y-2.5 rounded-2xl border border-line bg-panel p-4">
          <div className="flex items-baseline justify-between">
            <h1 className="font-display text-lg font-bold">Wallet tracker</h1>
            <span className="text-[11px] text-mute">
              {wallets?.length ?? 0}/{MAX} wallets
            </span>
          </div>
          <label className="sr-only" htmlFor="w-address">Wallet address</label>
          <input
            id="w-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Wallet address"
            className="w-full rounded-lg border border-line bg-night px-3 py-2 font-mono text-xs outline-none focus:border-[#9fb4ff]"
          />
          <div className="flex gap-2">
            <span className="grid w-10 shrink-0 place-items-center rounded-lg border border-line bg-night text-lg" aria-hidden="true">
              {emoji}
            </span>
            <label className="sr-only" htmlFor="w-label">Name</label>
            <input
              id="w-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Name, e.g. Ansem"
              maxLength={24}
              className="min-w-0 flex-1 rounded-lg border border-line bg-night px-3 py-2 text-xs outline-none focus:border-[#9fb4ff]"
            />
            <button disabled={busy || !address.trim()} className="rounded-lg bg-suit px-4 text-xs font-bold ring-1 ring-[#9fb4ff]/40 disabled:opacity-40">
              {busy ? "Adding…" : "Track"}
            </button>
          </div>
          <EmojiPicker value={emoji} onPick={setEmoji} compact />
          <div className="border-t border-line pt-2.5">
            <QuickBuySetting />
          </div>
          {err && (
            <p role="alert" className="text-xs text-loss">
              {err}
            </p>
          )}
        </form>

        <section className="flex min-h-[240px] flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-panel xl:min-h-0">
          <header className="border-b border-line px-4 py-3">
            <h2 className="text-sm font-bold">Your wallets</h2>
          </header>
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
            {wallets === null ? (
              <p className="px-4 py-4 text-xs text-mute">Loading…</p>
            ) : wallets.length === 0 ? (
              <p className="px-4 py-4 text-xs text-mute">No wallets yet. Add one above.</p>
            ) : (
              <ul className="divide-y divide-line">
                {wallets.map((w) => (
                  <WalletRow key={`${w.id}-${w.label}-${w.minSol}`} w={w} trades={countOf(w.address)} onChanged={load} />
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      {/* feed */}
      <section className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-line bg-panel xl:min-h-0">
        <header className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
          <h2 className="mr-auto text-sm font-bold">Trades</h2>
          <div className="flex gap-1" role="tablist" aria-label="Side">
            {(["", "buy", "sell"] as const).map((s) => (
              <button
                key={s || "all"}
                role="tab"
                aria-selected={side === s}
                onClick={() => setSide(s)}
                className={`rounded-full px-2.5 py-0.5 text-[11px] ${side === s ? "bg-hat text-night" : "text-mute hover:text-ink"}`}
              >
                {s === "" ? "All" : s === "buy" ? "Buys" : "Sells"}
              </button>
            ))}
          </div>
          <label className="sr-only" htmlFor="w-filter">Wallet</label>
          <select
            id="w-filter"
            value={walletFilter}
            onChange={(e) => setWalletFilter(e.target.value)}
            className="rounded-lg border border-line bg-night px-2 py-1 text-xs outline-none focus:border-[#9fb4ff]"
          >
            <option value="">All wallets</option>
            {wallets?.map((w) => (
              <option key={w.id} value={w.address}>
                {w.emoji} {w.label}
              </option>
            ))}
          </select>
        </header>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
          {shown.length === 0 ? (
            <p className="px-4 py-5 text-xs text-mute">No trades yet.</p>
          ) : (
            <table className="w-full text-[13px]">
              <thead className="sticky top-0 bg-panel text-left text-[11px] text-mute">
                <tr className="border-b border-line">
                  <th className="px-4 py-2 font-normal">Wallet</th>
                  <th className="px-2 py-2 font-normal">Token</th>
                  <th className="px-2 py-2 text-right font-normal">Size</th>
                  <th className="hidden px-2 py-2 text-right font-normal sm:table-cell">MC</th>
                  <th className="px-2 py-2 text-right font-normal">Time</th>
                  <th className="px-4 py-2" aria-label="Actions" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shown.map((t) => {
                  if (t.cluster) {
                    return (
                      <tr key={t.id} className="bg-hat/[0.08] shadow-[inset_3px_0_0_var(--color-hat)]">
                        <td className="px-4 py-2.5">
                          <span className="flex items-center gap-2">
                            <span className="text-base" aria-hidden="true">🔥</span>
                            <span className="font-bold text-hat">{t.buyers?.length} wallets</span>
                            <span className="truncate text-[12px]" title={t.buyers?.map((b) => `${b.label} ${b.sol.toFixed(2)} SOL`).join(", ")}>
                              {t.buyers?.map((b) => b.emoji).join("")}
                            </span>
                          </span>
                        </td>
                        <td className="px-2 py-2.5">
                          <span className="flex items-center gap-2">
                            <TokenIcon mint={t.mint!} src={t.image} symbol={t.symbol} className="h-6 w-6" />
                            <span className="text-[11px] font-bold text-hat">CLUSTER</span>
                            <span className="truncate font-bold">${t.symbol}</span>
                          </span>
                        </td>
                        <td className="px-2 py-2.5 text-right tabular-nums text-gain">{(t.sol ?? 0).toFixed(2)} SOL</td>
                        <td className="hidden px-2 py-2.5 text-right tabular-nums text-mute sm:table-cell">{usd(t.mcap, 0)}</td>
                        <td className="px-2 py-2.5 text-right text-[11px] text-mute">{ago(t.createdAt)}</td>
                        <td className="px-4 py-2.5 text-right">
                          <span className="inline-flex gap-1.5">
                            <QuickBuyButton mint={t.mint!} symbol={t.symbol} />
                            <Link
                              href={`/dashboard?scan=${t.mint}`}
                              className="inline-block rounded-md bg-hat px-2 py-1 font-display text-[10px] font-bold text-night hover:brightness-110"
                            >
                              Scan CA
                            </Link>
                          </span>
                        </td>
                      </tr>
                    );
                  }
                  const buy = t.side === "buy";
                  const who = whoOf(t, wallets);
                  return (
                    <tr key={t.id} className={t.read ? "" : "bg-gain/[0.04]"}>
                      <td className="px-4 py-2">
                        <span className="flex items-center gap-2">
                          <span className="text-base" aria-hidden="true">{who.emoji}</span>
                          <span className="truncate font-bold">{who.name}</span>
                        </span>
                      </td>
                      <td className="px-2 py-2">
                        <span className="flex items-center gap-2">
                          <TokenIcon mint={t.mint!} src={t.image} symbol={t.symbol} className="h-6 w-6" />
                          <span className={`text-[11px] font-bold uppercase ${buy ? "text-gain" : "text-loss"}`}>{buy ? "BUY" : soldText(t.soldPct) === "sell" ? "SELL" : soldText(t.soldPct)}</span>
                          <span className="truncate font-bold">${t.symbol}</span>
                        </span>
                      </td>
                      <td className={`px-2 py-2 text-right tabular-nums ${buy ? "text-gain" : "text-loss"}`}>{(t.sol ?? 0).toFixed((t.sol ?? 0) < 1 ? 3 : 2)} SOL</td>
                      <td className="hidden px-2 py-2 text-right tabular-nums text-mute sm:table-cell">{usd(t.mcap, 0)}</td>
                      <td className="px-2 py-2 text-right text-[11px] text-mute">
                        {t.sig ? (
                          <a href={`https://solscan.io/tx/${t.sig}`} target="_blank" rel="noreferrer" className="hover:text-ink hover:underline">
                            {ago(t.createdAt)}
                          </a>
                        ) : (
                          ago(t.createdAt)
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        {withScan.has(t.id) && (
                        <span className="inline-flex gap-1.5">
                        <QuickBuyButton mint={t.mint!} symbol={t.symbol} />
                        <Link
                          href={`/dashboard?scan=${t.mint}`}
                          className="inline-block rounded-md bg-hat px-2 py-1 font-display text-[10px] font-bold text-night hover:brightness-110"
                        >
                          Scan CA
                        </Link>
                        </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
