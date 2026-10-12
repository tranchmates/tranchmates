import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { assistantChat } from "@/lib/assistant";

export const maxDuration = 60;

export async function GET() {
  const { user, res } = await requireUser();
  if (!user) return res;
  const msgs = await db.assistantMessage.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
  return Response.json({ messages: msgs.reverse() });
}

// Body: { text, tzOffsetMin } — tzOffsetMin is minutes ahead of UTC (e.g. 480 for UTC+8)
export async function POST(req: Request) {
  const { user, res } = await requireUser();
  if (!user) return res;
  const b = (await req.json().catch(() => ({}))) as { text?: string; tzOffsetMin?: number };
  if (!b.text?.trim()) return Response.json({ error: "Tell me what to do." }, { status: 400 });
  const tz = Number.isFinite(b.tzOffsetMin) ? Math.max(-840, Math.min(840, Number(b.tzOffsetMin))) : 0;
  const r = await assistantChat(user.id, b.text.trim(), tz);
  return Response.json(r);
}
