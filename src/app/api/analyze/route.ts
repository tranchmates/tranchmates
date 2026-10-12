import { requireUser } from "@/lib/session";
import { analyzePost, analyzeToken } from "@/lib/analyze";
import { parsePostUrl } from "@/lib/x";

export async function POST(req: Request) {
  const { user, res } = await requireUser();
  if (!user) return res;
  const { input } = (await req.json().catch(() => ({}))) as { input?: string };
  if (!input?.trim()) return Response.json({ error: "Paste a contract address or an X post link." }, { status: 400 });
  try {
    const out = parsePostUrl(input) ? { post: await analyzePost(input) } : { token: await analyzeToken(input) };
    return Response.json(out);
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
