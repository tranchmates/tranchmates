import { requireUser } from "@/lib/session";
import { devCheck } from "@/lib/devcheck";
import { getMintBasics, isAddress } from "@/lib/solana";

export const maxDuration = 60;

export async function GET(req: Request) {
  const { user, res } = await requireUser();
  if (!user) return res;
  const mint = new URL(req.url).searchParams.get("mint")?.trim() ?? "";
  if (!isAddress(mint)) return Response.json({ error: "Not a Solana address." }, { status: 400 });
  try {
    const basics = await getMintBasics(mint);
    return Response.json(await devCheck(mint, basics?.supply));
  } catch (e) {
    console.error("[token/deep]", mint, (e as Error).message);
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
