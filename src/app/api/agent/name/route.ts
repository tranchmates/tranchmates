import { requireUser } from "@/lib/session";
import { renameAgent } from "@/lib/agent";

export async function POST(req: Request) {
  const { user, res } = await requireUser();
  if (!user) return res;
  const { name } = (await req.json().catch(() => ({}))) as { name?: string };
  const r = await renameAgent(user.id, String(name ?? ""));
  if ("error" in r) return Response.json(r, { status: 400 });
  return Response.json(r);
}
