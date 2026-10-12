import { requireUser } from "@/lib/session";
import { sendDigest } from "@/lib/digest";

export const maxDuration = 60;

// "Send digest now" from Settings.
export async function POST() {
  const { user, res } = await requireUser();
  if (!user) return res;
  try {
    const d = await sendDigest(user.id);
    return Response.json({ ok: true, title: d.title, body: d.body, telegram: Boolean(user.telegramChatId && process.env.TELEGRAM_BOT_TOKEN) });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }
}
