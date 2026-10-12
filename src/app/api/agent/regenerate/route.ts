import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

// Resets the agent so /generate builds it again from fresh X data.
export async function POST() {
  const { user, res } = await requireUser();
  if (!user) return res;
  const a = user.agent;
  if (a?.status === "generating" && Date.now() - a.updatedAt.getTime() < 120_000) {
    return Response.json({ error: "Your agent is being built right now. Give it a minute." }, { status: 409 });
  }
  await db.agent.update({ where: { userId: user.id }, data: { status: "pending", step: "queued", error: null } });
  return Response.json({ ok: true });
}
