import { requireUser } from "@/lib/session";
import { getOrder } from "@/lib/jupiter";
import { getMintBasics, isAddress, SOL_MINT } from "@/lib/solana";
import { env } from "@/lib/env";

// Body: { mint, side: "buy" | "sell", amount: number (SOL for buy, tokens for sell), taker }
export async function POST(req: Request) {
  const { user, res } = await requireUser();
  if (!user) return res;
  const b = (await req.json().catch(() => ({}))) as { mint?: string; side?: string; amount?: number; taker?: string };
  if (!b.mint || !isAddress(b.mint) || !b.taker || !isAddress(b.taker)) return Response.json({ error: "Connect a wallet first." }, { status: 400 });
  if (!b.amount || !(b.amount > 0)) return Response.json({ error: "Enter an amount." }, { status: 400 });

  try {
    let inputMint: string, outputMint: string, raw: bigint;
    if (b.side === "sell") {
      const basics = await getMintBasics(b.mint);
      if (!basics) return Response.json({ error: "Couldn't read this token's decimals." }, { status: 502 });
      inputMint = b.mint;
      outputMint = SOL_MINT;
      raw = BigInt(Math.floor(b.amount * 10 ** basics.decimals));
    } else {
      inputMint = SOL_MINT;
      outputMint = b.mint;
      raw = BigInt(Math.floor(b.amount * 1e9));
    }
    const o = await getOrder({ inputMint, outputMint, amount: raw.toString(), taker: b.taker });
    if (!o.transaction) return Response.json({ error: o.errorMessage ?? "No route for this swap right now." }, { status: 422 });
    return Response.json({
      ...o,
      siteFeeBps: env.jupReferralAccount() ? env.jupReferralFeeBps() : 0,
    });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}

// Fee disclosure for the trade panel.
export async function GET() {
  return Response.json({ siteFeeBps: env.jupReferralAccount() ? env.jupReferralFeeBps() : 0 });
}
