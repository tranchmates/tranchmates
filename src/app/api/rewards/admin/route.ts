import { requireUser } from "@/lib/session";
import { db, parseJson } from "@/lib/db";
import { isAdmin, validateTask, type TaskInput } from "@/lib/rewards";
import { tweetIdOf } from "@/lib/xdata";

async function admin() {
  const { user, res } = await requireUser();
  if (!user) return { user: null, res } as const;
  if (!isAdmin(user.username)) return { user: null, res: Response.json({ error: "Admins only." }, { status: 403 }) } as const;
  return { user, res: null } as const;
}

export async function GET() {
  const { user, res } = await admin();
  if (!user) return res;
  const tasks = await db.rewardTask.findMany({ orderBy: [{ kind: "asc" }, { active: "desc" }, { createdAt: "desc" }] });
  const claims = await db.rewardEvent.groupBy({ by: ["kind"], _count: true }).catch(() => []);
  // per-task claim counts (keys look like task:<id> or task:<id>:<date>)
  const counts: Record<string, number> = {};
  for (const t of tasks) counts[t.id] = await db.rewardEvent.count({ where: { key: { startsWith: `task:${t.id}` } } });
  return Response.json({ tasks: tasks.map((t) => ({ ...t, params: parseJson(t.params, {}), claims: counts[t.id] ?? 0 })), totals: claims });
}

export async function POST(req: Request) {
  const { user, res } = await admin();
  if (!user) return res;
  const b = (await req.json().catch(() => ({}))) as TaskInput & { params?: { url?: string; tweetId?: string; handle?: string; need?: number; terms?: string } };
  const params = { ...(b.params ?? {}) };
  if (params.url && !params.tweetId) params.tweetId = tweetIdOf(params.url) ?? undefined;
  if (params.handle) params.handle = params.handle.replace(/^@/, "").trim();
  if (params.need != null) params.need = Number(params.need);
  const input: TaskInput = { ...b, points: Number(b.points), params, date: b.kind === "daily" ? b.date || null : null };
  const err = validateTask(input);
  if (err) return Response.json({ error: err }, { status: 400 });
  const task = await db.rewardTask.create({
    data: {
      kind: input.kind,
      type: input.type,
      title: input.title.trim(),
      detail: input.detail?.trim() || null,
      points: input.points,
      params: JSON.stringify(params),
      date: input.date ?? null,
    },
  });
  return Response.json({ task });
}

// Body: { id, active?: boolean, delete?: true }
export async function PATCH(req: Request) {
  const { user, res } = await admin();
  if (!user) return res;
  const b = (await req.json().catch(() => ({}))) as { id?: string; active?: boolean; delete?: boolean };
  if (!b.id) return Response.json({ error: "Which task?" }, { status: 400 });
  if (b.delete) {
    await db.rewardTask.delete({ where: { id: b.id } }).catch(() => null);
    return Response.json({ ok: true });
  }
  const task = await db.rewardTask.update({ where: { id: b.id }, data: { active: Boolean(b.active) } });
  return Response.json({ task });
}
