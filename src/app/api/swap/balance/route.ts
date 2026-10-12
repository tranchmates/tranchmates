import { requireUser } from "@/lib/session";
import { getPortfolio, isAddress } from "@/lib/solana";

// SOL and token balance of the connected wallet, for the trade panel presets.
export async function GET(req: Request) {
  const { user, res } = await requireUser();
  if (!user) return res;
  const u = new URL(req.url);
  const owner = u.searchParams.get("owner") ?? "";
  const mint = u.searchParams.get("mint") ?? "";
  if (!isAddress(owner) || !isAddress(mint)) return Response.json({ error: "Bad address." }, { status: 400 });
  try {
    const p = await getPortfolio(owner);
    const t = p.tokens.find((x) => x.mint === mint);
    return Response.json({ sol: p.solBalance, token: t?.amount ?? 0 });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
