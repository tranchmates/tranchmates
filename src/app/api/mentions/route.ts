import { requireUser } from "@/lib/session";
import { getMintMentions } from "@/lib/xdata";
import { isAddress } from "@/lib/solana";

export async function GET(req: Request) {
  const { user, res } = await requireUser();
  if (!user) return res;
  const u = new URL(req.url);
  const mint = u.searchParams.get("mint")?.trim() ?? "";
  const sort = u.searchParams.get("sort") === "latest" ? "latest" : "top";
  if (!isAddress(mint)) return Response.json({ error: "Not a Solana address." }, { status: 400 });
  try {
    return Response.json({ mint, sort, posts: await getMintMentions(mint, sort) });
  } catch (e) {
    return Response.json({ error: (e as Error).message, posts: [] }, { status: 502 });
  }
}
