import { requireUser } from "@/lib/session";
import { listTracked, trackWallet, untrackWallet, updateWallet, walletFeed } from "@/lib/wallettrack";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, res } = await requireUser();
  if (!user) return res;
  const [wallets, trades] = await Promise.all([listTracked(user.id), walletFeed(user.id, 150)]);
  return Response.json({ wallets, trades });
}

export async function POST(req: Request) {
  const { user, res } = await requireUser();
  if (!user) return res;
  const { address, label, emoji } = (await req.json().catch(() => ({}))) as { address?: string; label?: string; emoji?: string };
  const r = await trackWallet(user.id, address ?? "", label, emoji);
  if ("error" in r) return Response.json(r, { status: 400 });
  return Response.json(r);
}

export async function PATCH(req: Request) {
  const { user, res } = await requireUser();
  if (!user) return res;
  const body = (await req.json().catch(() => ({}))) as { id?: string } & Parameters<typeof updateWallet>[2];
  if (!body.id) return Response.json({ error: "id required" }, { status: 400 });
  return Response.json(await updateWallet(user.id, body.id, body));
}

export async function DELETE(req: Request) {
  const { user, res } = await requireUser();
  if (!user) return res;
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  return Response.json(await untrackWallet(user.id, id));
}
