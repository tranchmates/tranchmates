import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { chat } from "@/lib/agent";

export const maxDuration = 60;

export async function GET() {
  const { user, res } = await requireUser();
  if (!user) return res;
  const msgs = await db.message.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 40 });
  return Response.json({ messages: msgs.reverse() });
}

export async function POST(req: Request) {
  const { user, res } = await requireUser();
  if (!user) return res;
  const { text } = (await req.json().catch(() => ({}))) as { text?: string };
  if (!text?.trim()) return Response.json({ error: "Type a message or paste a contract address." }, { status: 400 });
  try {
    const reply = await chat(user.id, text.trim());
    return Response.json({ reply });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
