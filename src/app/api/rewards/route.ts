import { requireUser } from "@/lib/session";
import { claim, getRewards } from "@/lib/rewards";

export const maxDuration = 30;

export async function GET() {
  const { user, res } = await requireUser();
  if (!user) return res;
  try {
    return Response.json(await getRewards(user.id));
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }
}

// Body: { task: "checkin" | "tier:0.5" | <task id> }
export async function POST(req: Request) {
  const { user, res } = await requireUser();
  if (!user) return res;
  const { task } = (await req.json().catch(() => ({}))) as { task?: string };
  if (!task) return Response.json({ error: "Which task?" }, { status: 400 });
  const r = await claim(user.id, task);
  return Response.json(r, { status: r.ok ? 200 : 400 });
}
