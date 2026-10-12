import { requireUser } from "@/lib/session";
import { getFollowedMentions } from "@/lib/xdata";
import { isAddress } from "@/lib/solana";
import { parseJson } from "@/lib/db";

export const maxDuration = 60;

// Posts about a CA from accounts the signed-in user follows.
export async function GET(req: Request) {
  const { user, res } = await requireUser();
  if (!user) return res;
  const mint = new URL(req.url).searchParams.get("mint")?.trim() ?? "";
  if (!isAddress(mint)) return Response.json({ error: "Not a Solana address." }, { status: 400 });
  const handles = parseJson<{ following?: string[] }>(user.agent?.profileData, {}).following ?? [];
  if (!handles.length) return Response.json({ available: false, reason: "rebuild", posts: [] });
  try {
    const posts = await getFollowedMentions(mint, handles, user.id);
    if (posts === null) return Response.json({ available: false, reason: "provider", posts: [] });
    const accounts = [...new Set(posts.map((p) => p.author.username))];
    return Response.json({ available: true, scanned: handles.length, accounts, posts });
  } catch (e) {
    return Response.json({ available: false, reason: "error", error: (e as Error).message, posts: [] }, { status: 502 });
  }
}
