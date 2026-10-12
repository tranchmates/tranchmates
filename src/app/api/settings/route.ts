import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const { user, res } = await requireUser();
  if (!user) return res;
  const b = (await req.json().catch(() => ({}))) as { telegramChatId?: string; digestHourUtc?: number | null };
  const data: { telegramChatId?: string | null; digestHourUtc?: number | null } = {};
  if (b.telegramChatId !== undefined) {
    const id = b.telegramChatId.trim();
    if (id && !/^-?\d{5,20}$/.test(id)) return Response.json({ error: "Telegram chat id is a number, e.g. 123456789." }, { status: 400 });
    data.telegramChatId = id || null;
  }
  if (b.digestHourUtc !== undefined) {
    if (b.digestHourUtc !== null && !(Number.isInteger(b.digestHourUtc) && b.digestHourUtc >= 0 && b.digestHourUtc <= 23)) {
      return Response.json({ error: "Pick an hour between 0 and 23." }, { status: 400 });
    }
    data.digestHourUtc = b.digestHourUtc;
  }
  await db.user.update({ where: { id: user.id }, data });
  return Response.json({ ok: true });
}
