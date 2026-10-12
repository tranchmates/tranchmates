import { requireUser } from "@/lib/session";
import { executeOrder } from "@/lib/jupiter";
import { recordSiteTrade } from "@/lib/pnl";
import { rewardTrade } from "@/lib/rewards";
import { getMintBasics, isAddress } from "@/lib/solana";

export async function POST(req: Request) {
  const { user, res } = await requireUser();
  if (!user) return res;
  const b = (await req.json().catch(() => ({}))) as {
    signedTransaction?: string;
    requestId?: string;
    mint?: string;
    side?: "buy" | "sell";
    wallet?: string;
  };
  if (!b.signedTransaction || !b.requestId) return Response.json({ error: "Missing signed transaction." }, { status: 400 });
  try {
    const r = await executeOrder(b.signedTransaction, b.requestId);
    if (r.status !== "Success") return Response.json({ error: r.error ?? "Swap failed on-chain.", signature: r.signature }, { status: 422 });

    // Book it into Positions right away (Helius history takes a little while to catch up).
    if (r.signature && b.mint && isAddress(b.mint) && b.wallet && isAddress(b.wallet) && (b.side === "buy" || b.side === "sell")) {
      const x = r as unknown as { inputAmountResult?: string; outputAmountResult?: string; totalInputAmount?: string; totalOutputAmount?: string };
      const inRaw = Number(x.inputAmountResult ?? x.totalInputAmount ?? 0);
      const outRaw = Number(x.outputAmountResult ?? x.totalOutputAmount ?? 0);
      const dec = (await getMintBasics(b.mint).catch(() => null))?.decimals;
      if (dec != null && inRaw > 0 && outRaw > 0) {
        const trade = {
          wallet: b.wallet,
          signature: r.signature,
          mint: b.mint,
          side: b.side,
          tokenAmount: (b.side === "buy" ? outRaw : inRaw) / 10 ** dec,
          solAmount: (b.side === "buy" ? inRaw : outRaw) / 1e9,
        };
        recordSiteTrade({ ...trade, at: Date.now() });
        await rewardTrade(user.id, trade).catch(() => {});
      }
    }
    return Response.json(r);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
