import { requireUser } from "@/lib/session";
import { db, parseJson } from "@/lib/db";

export async function GET(req: Request) {
  const { user, res } = await requireUser();
  if (!user) return res;
  const kind = new URL(req.url).searchParams.get("kind");
  const alerts = await db.alert.findMany({
    where: { userId: user.id, ...(kind ? { kind: { in: kind.split(",") } } : {}) },
    orderBy: { createdAt: "desc" },
    take: 60,
  });
  const unread = await db.alert.count({ where: { userId: user.id, read: false } });
  return Response.json({ unread, alerts: alerts.map((a) => ({ ...a, meta: parseJson(a.meta, null) })) });
}

// Mark all (or one) as read.
export async function POST(req: Request) {
  const { user, res } = await requireUser();
  if (!user) return res;
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  await db.alert.updateMany({ where: { userId: user.id, ...(id ? { id } : {}) }, data: { read: true } });
  return Response.json({ ok: true });
}
