import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

export async function GET() {
  const { user, res } = await requireUser();
  if (!user) return res;
  const [active, recent] = await Promise.all([
    db.assistantTask.findMany({ where: { userId: user.id, status: "active" }, orderBy: [{ runAt: "asc" }, { createdAt: "desc" }] }),
    db.assistantTask.findMany({ where: { userId: user.id, status: { not: "active" } }, orderBy: { createdAt: "desc" }, take: 15 }),
  ]);
  return Response.json({ active, recent });
}

// Body: { id } cancels one job, { id: "all" } cancels every active job
export async function PATCH(req: Request) {
  const { user, res } = await requireUser();
  if (!user) return res;
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return Response.json({ error: "Which job?" }, { status: 400 });
  const r = await db.assistantTask.updateMany({
    where: { userId: user.id, status: "active", ...(id === "all" ? {} : { id }) },
    data: { status: "cancelled" },
  });
  return Response.json({ cancelled: r.count });
}
