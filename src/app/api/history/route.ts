import { requireUser } from "@/lib/session";
import { db, parseJson } from "@/lib/db";

type TokenMeta = { mint: string; symbol: string; image?: string; score?: number; risk?: { level: string; label: string } };
type PostMeta = { postId: string; author: string | null; text: string; tokens?: TokenMeta[] };

// What the user has looked up: tokens (from contract checks) and X posts/accounts.
export async function GET() {
  const { user, res } = await requireUser();
  if (!user) return res;
  const msgs = await db.message.findMany({
    where: { userId: user.id, role: "agent", meta: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 300,
    select: { meta: true, createdAt: true },
  });

  const tokens = new Map<string, TokenMeta & { at: Date; count: number }>();
  const x = new Map<string, { author: string; postId: string; text: string; at: Date; count: number }>();
  const addToken = (t: TokenMeta, at: Date) => {
    const cur = tokens.get(t.mint);
    if (cur) cur.count++;
    else tokens.set(t.mint, { mint: t.mint, symbol: t.symbol, image: t.image, score: t.score, risk: t.risk ? { level: t.risk.level, label: t.risk.label } : undefined, at, count: 1 });
  };

  for (const m of msgs) {
    const meta = parseJson<{ token?: TokenMeta & { error?: string }; post?: PostMeta & { error?: string } }>(m.meta, {});
    if (meta.token && !meta.token.error) addToken(meta.token, m.createdAt);
    if (meta.post && !meta.post.error) {
      const handle = meta.post.author ?? "unknown";
      const cur = x.get(handle);
      if (cur) cur.count++;
      else x.set(handle, { author: handle, postId: meta.post.postId, text: meta.post.text.slice(0, 120), at: m.createdAt, count: 1 });
      for (const t of meta.post.tokens ?? []) addToken(t, m.createdAt);
    }
  }

  return Response.json({
    tokens: [...tokens.values()].slice(0, 30),
    x: [...x.values()].slice(0, 30),
  });
}
