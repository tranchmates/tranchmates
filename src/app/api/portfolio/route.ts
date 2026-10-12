import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { getPortfolio } from "@/lib/solana";

export async function GET() {
  const { user, res } = await requireUser();
  if (!user) return res;
  const wallets = await db.wallet.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
  const results = await Promise.all(
    wallets.map(async (w) => {
      try {
        return { ...(await getPortfolio(w.address)), label: w.label };
      } catch (e) {
        return { address: w.address, label: w.label, error: (e as Error).message };
      }
    }),
  );
  return Response.json({ wallets: results });
}
