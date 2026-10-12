import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getAirdropHistory, KNOWN_AIRDROPS } from "@/lib/airdrops";

export const maxDuration = 120;

export async function GET() {
  const { user, res } = await requireUser();
  if (!user) return res;
  const wallets = await db.wallet.findMany({ where: { userId: user.id } });
  const results = await Promise.all(
    wallets.map(async (w) => {
      try {
        return { wallet: w.address, label: w.label, ...(await getAirdropHistory(w.address)) };
      } catch (e) {
        return { wallet: w.address, label: w.label, error: (e as Error).message, claims: [] };
      }
    }),
  );
  return Response.json({ wallets: results, tracked: KNOWN_AIRDROPS });
}
