import { requireUser } from "@/lib/session";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/rewards";
import { tweetIdOf } from "@/lib/xdata";
import { extractAddresses, isAddress } from "@/lib/solana";

// Admin API for the reply bot (/rewards/admin/bot).

async function admin() {
  const { user, res } = await requireUser();
  if (!user) return { ok: false, res } as const;
  if (!isAdmin(user.username)) return { ok: false, res: Response.json({ error: "Admins only." }, { status: 403 }) } as const;
  return { ok: true, res: null } as const;
}

export async function GET() {
  const a = await admin();
  if (!a.ok) return a.res;
  const bot = await db.botAccount.findUnique({ where: { id: "x" }, select: { username: true, updatedAt: true } });
  const campaigns = await db.replyCampaign.findMany({ orderBy: { createdAt: "desc" } });
  const hourAgo = new Date(Date.now() - 3_600_000);
  const rows = await Promise.all(
    campaigns.map(async (c) => {
      const [sent, skipped, failed, lastHour, recent] = await Promise.all([
        db.botReply.count({ where: { campaignId: c.id, status: "sent" } }),
        db.botReply.count({ where: { campaignId: c.id, status: "skipped" } }),
        db.botReply.count({ where: { campaignId: c.id, status: "failed" } }),
        db.botReply.count({ where: { campaignId: c.id, status: "sent", createdAt: { gte: hourAgo } } }),
        db.botReply.findMany({
          where: { campaignId: c.id, status: { in: ["sent", "failed"] } },
          orderBy: { createdAt: "desc" },
          take: 8,
          select: { author: true, mint: true, status: true, replyTweetId: true, note: true, createdAt: true },
        }),
      ]);
      return { ...c, sent, skipped, failed, lastHour, recent };
    }),
  );
  return Response.json({ bot, campaigns: rows });
}

export async function POST(req: Request) {
  const a = await admin();
  if (!a.ok) return a.res;
  const b = (await req.json().catch(() => ({}))) as { action?: string; url?: string; maxPerHour?: number; addTasks?: boolean; points?: number; text?: string };

  // preview the reply text for a CA without posting anything
  if (b.action === "preview") {
    const mint = extractAddresses(b.text ?? "").find(isAddress);
    if (!mint) return Response.json({ error: "No Solana address in that text." }, { status: 400 });
    const { verdictFor } = await import("@/lib/replybot");
    const v = await verdictFor(mint);
    return "error" in v ? Response.json({ error: v.error }, { status: 400 }) : Response.json({ text: v.text, length: v.text.length });
  }

  if (b.action === "disconnect") {
    await db.botAccount.deleteMany({});
    return Response.json({ ok: true });
  }

  // run one bot pass right now (same as the cron)
  if (b.action === "run") {
    const { runReplyBot } = await import("@/lib/replybot");
    return Response.json(await runReplyBot());
  }

  const tweetId = tweetIdOf(b.url ?? "");
  if (!tweetId) return Response.json({ error: "Paste the link to the X post." }, { status: 400 });
  const maxPerHour = Math.min(120, Math.max(1, Math.round(Number(b.maxPerHour) || 30)));
  const url = (b.url ?? "").trim();
  const campaign = await db.replyCampaign.upsert({
    where: { tweetId },
    create: { tweetId, url, maxPerHour },
    update: { active: true, maxPerHour },
  });
  if (b.addTasks) {
    const points = Math.min(1_000_000, Math.max(1, Math.round(Number(b.points) || 500)));
    for (const [type, title] of [
      ["reply", "Reply to our scan post with a CA"],
      ["quote", "Quote our scan post"],
    ] as const) {
      const exists = await db.rewardTask.findFirst({ where: { kind: "social", type, params: { contains: tweetId } } });
      if (!exists) {
        await db.rewardTask.create({
          data: { kind: "social", type, title, detail: "Our agent replies with a verdict.", points, params: JSON.stringify({ url, tweetId }) },
        });
      }
    }
  }
  return Response.json({ campaign });
}

export async function PATCH(req: Request) {
  const a = await admin();
  if (!a.ok) return a.res;
  const b = (await req.json().catch(() => ({}))) as { id?: string; active?: boolean; maxPerHour?: number; delete?: boolean };
  if (!b.id) return Response.json({ error: "Missing id." }, { status: 400 });
  if (b.delete) {
    await db.replyCampaign.delete({ where: { id: b.id } }).catch(() => null);
    return Response.json({ ok: true });
  }
  const data: { active?: boolean; maxPerHour?: number } = {};
  if (typeof b.active === "boolean") data.active = b.active;
  if (b.maxPerHour != null) data.maxPerHour = Math.min(120, Math.max(1, Math.round(Number(b.maxPerHour))));
  await db.replyCampaign.update({ where: { id: b.id }, data });
  return Response.json({ ok: true });
}
