import { after } from "next/server";
import { requireUser } from "@/lib/session";
import { generateAgent } from "@/lib/agent";
import { db } from "@/lib/db";

export const maxDuration = 120;

// Starts generation in the background; the client polls /api/agent/status.
export async function POST() {
  const { user, res } = await requireUser();
  if (!user) return res;
  const a = user.agent;
  if (a?.status === "ready") return Response.json({ started: false });
  // A run is already digging (e.g. React dev double effect or a second tab).
  if (a?.status === "generating" && Date.now() - a.updatedAt.getTime() < 120_000) return Response.json({ started: false });

  await db.agent.upsert({
    where: { userId: user.id },
    create: { userId: user.id, status: "generating", step: "queued" },
    update: { status: "generating", step: "queued", error: null },
  });
  after(() => generateAgent(user.id));
  return Response.json({ started: true });
}
