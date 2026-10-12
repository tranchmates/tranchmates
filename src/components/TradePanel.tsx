"use client";

import { useEffect, useState } from "react";
import { availableWallets, connect, connectedWallet, disconnect, onWalletChange, reconnect, signBase64, type WalletName } from "./wallet";
import { num, short } from "./format";
import { tradeDone } from "./tokenFocus";

type Quote = { requestId: string; transaction: string; outAmount?: string; inAmount?: string; siteFeeBps: number; feeBps?: number; router?: string };

const BUY_PRESETS = [0.1, 0.25, 0.5, 1];
const SELL_PRESETS = [10, 25, 50, 100];

// Buy/sell through Jupiter with the user's own wallet. Lives under a token card.
export function TradePanel({
  mint,
  symbol,
  priceUsd,
  initialSide = "buy",
}: {
  mint: string;
  symbol: string;
  priceUsd: number | null;
  initialSide?: "buy" | "sell";
}) {
  const [wallet, setWallet] = useState(connectedWallet());
  const [side, setSide] = useState<"buy" | "sell">(initialSide);
  const [amount, setAmount] = useState("0.1");
  const [bal, setBal] = useState<{ sol: number; token: number } | null>(null);
  const [state, setState] = useState<{ kind: "idle" | "quoting" | "signing" | "sending" | "done" | "error"; msg?: string; sig?: string }>({ kind: "idle" });
  const [wallets, setWallets] = useState<WalletName[]>([]);
  const [feeBps, setFeeBps] = useState(0);

  useEffect(() => {
    setWallets(availableWallets().map((w) => w.name));
    fetch("/api/swap/order").then((r) => r.json()).then((d) => setFeeBps(d.siteFeeBps ?? 0)).catch(() => {});
    reconnect();
    return onWalletChange(() => setWallet(connectedWallet()));
  }, []);

  useEffect(() => {
    if (!wallet) return setBal(null);
    fetch(`/api/swap/balance?owner=${wallet.address}&mint=${mint}`)
      .then((r) => r.json())
      .then((d) => !d.error && setBal(d))
      .catch(() => {});
  }, [wallet, mint, state.kind === "done"]);

  // Buy amount is SOL; sell amount is a % of what the wallet holds (like Axiom).
  useEffect(() => {
    setAmount(side === "buy" ? "0.1" : "100");
  }, [side]);

  const input = Number(amount);
  const sellTokens = bal?.token ? (bal.token * Math.min(100, Math.max(0, input))) / 100 : 0;
  const value = side === "buy" ? input : sellTokens;

  async function go() {
    if (!wallet || !(value > 0)) return;
    try {
      setState({ kind: "quoting" });
      const r = await fetch("/api/swap/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mint, side, amount: value, taker: wallet.address }),
      });
      const q = (await r.json()) as Quote & { error?: string };
      if (!r.ok) throw new Error(q.error ?? "Couldn't get a quote.");

      setState({ kind: "signing", msg: "Confirm in your wallet" });
      const signed = await signBase64(q.transaction);

      setState({ kind: "sending", msg: "Sending to Solana" });
      const ex = await fetch("/api/swap/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signedTransaction: signed, requestId: q.requestId, mint, side, wallet: wallet.address }),
      });
      const d = await ex.json();
      if (!ex.ok) throw new Error(d.error ?? "Swap failed.");
      setState({ kind: "done", sig: d.signature, msg: side === "buy" ? `Bought $${symbol}` : `Sold $${symbol}` });
      // Positions books site trades instantly; refresh again later so on-chain history catches up.
      tradeDone();
      setTimeout(tradeDone, 20_000);
      setTimeout(tradeDone, 60_000);
    } catch (e) {
      const m = (e as Error).message ?? "";
      setState({ kind: "error", msg: /reject|denied|cancel/i.test(m) ? "You cancelled the transaction in your wallet." : m });
    }
  }

  const busy = state.kind === "quoting" || state.kind === "signing" || state.kind === "sending";
  const estUsd = priceUsd ? (side === "sell" ? sellTokens * priceUsd : null) : null;
  const canGo = !busy && value > 0 && (side === "buy" ? !bal || input <= bal.sol : sellTokens > 0);

  const buy = side === "buy";
  const presets = buy ? BUY_PRESETS.map((p) => ({ v: String(p), label: String(p) })) : SELL_PRESETS.map((p) => ({ v: String(p), label: `${p}%` }));

  return (
    <div className="space-y-2.5 border-t border-line bg-panel-2/40 p-3 text-xs">
      {!wallet ? (
        <div className="space-y-2">
          <p className="text-mute">Connect a wallet to trade</p>
          {wallets.length ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(90px,1fr))] gap-1.5">
              {wallets.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => connect(w).catch((e) => setState({ kind: "error", msg: (e as Error).message }))}
                  className="rounded-lg border border-line bg-night py-2 font-bold hover:border-hat"
                >
                  {w}
                </button>
              ))}
            </div>
          ) : (
            <p>
              No Solana wallet found. Install{" "}
              <a href="https://phantom.com" target="_blank" rel="noreferrer" className="text-hat underline">Phantom</a>.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Buy / Sell */}
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-night p-1" role="tablist" aria-label="Trade side">
            {(["buy", "sell"] as const).map((sd) => (
              <button
                key={sd}
                role="tab"
                aria-selected={side === sd}
                onClick={() => setSide(sd)}
                className={`rounded-md py-1.5 text-[13px] font-bold transition-colors ${
                  side === sd ? (sd === "buy" ? "bg-gain text-night" : "bg-loss text-night") : "text-mute hover:text-ink"
                }`}
              >
                {sd === "buy" ? "Buy" : "Sell"}
              </button>
            ))}
          </div>

          {/* Amount */}
          <label className="flex items-center gap-2 rounded-lg border border-line bg-night px-3 py-2 focus-within:border-hat">
            <span className="text-[10px] text-mute">AMOUNT</span>
            <input
              id={`trade-amount-${mint}-${side}`}
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(",", ".").replace(/[^\d.]/g, ""))}
              aria-label={buy ? "Amount in SOL" : "Percent of your position to sell"}
              className="min-w-0 flex-1 bg-transparent text-right text-sm font-bold outline-none"
            />
            <span className="text-mute">{buy ? "SOL" : "%"}</span>
          </label>

          {/* Presets */}
          <div className="grid grid-cols-4 gap-1">
            {presets.map((p) => (
              <button
                key={p.v}
                type="button"
                onClick={() => setAmount(p.v)}
                className={`rounded-md border py-1.5 font-bold ${
                  amount === p.v ? (buy ? "border-gain text-gain" : "border-loss text-loss") : "border-line text-mute hover:text-ink"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* What you'll do */}
          <p className="flex justify-between gap-2 text-[11px] text-mute">
            <span className="truncate">
              {buy ? `Balance ${bal ? num(bal.sol) : "…"} SOL` : `${num(sellTokens)} $${symbol}${estUsd != null ? ` ≈ $${num(estUsd)}` : ""}`}
            </span>
            <span className="shrink-0">{feeBps > 0 ? `fee ${feeBps / 100}%` : "via Jupiter"}</span>
          </p>

          <button
            type="button"
            disabled={!canGo}
            onClick={go}
            className={`w-full rounded-lg py-2.5 font-display text-[13px] font-bold text-night disabled:opacity-40 ${buy ? "bg-gain" : "bg-loss"}`}
          >
            {busy ? state.msg ?? "Getting quote…" : buy ? `Buy $${symbol} · ${amount || 0} SOL` : `Sell ${amount || 0}% of $${symbol}`}
          </button>

          <p className="flex items-center justify-between text-[11px] text-mute">
            <span className="truncate">
              {wallet.name} {short(wallet.address)}
            </span>
            <button type="button" onClick={() => disconnect()} className="hover:text-ink">
              Disconnect
            </button>
          </p>
        </>
      )}

      {state.kind === "done" && (
        <p className="text-gain" role="status">
          {state.msg}.{" "}
          {state.sig && (
            <a href={`https://solscan.io/tx/${state.sig}`} target="_blank" rel="noreferrer" className="underline">
              View on Solscan
            </a>
          )}
        </p>
      )}
      {state.kind === "error" && (
        <p className="text-loss" role="alert">
          {state.msg}
        </p>
      )}
    </div>
  );
}
