import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { encrypt, getUser, setSession, verify } from "@/lib/session";
import { isAdmin } from "@/lib/rewards";
import { exchangeCode, getMe, biggerAvatar } from "@/lib/x";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const fail = (reason: string) => NextResponse.redirect(`${env.appUrl()}/?error=${encodeURIComponent(reason)}`);

  if (url.searchParams.get("error")) return fail("X sign-in was cancelled.");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const saved = verify<{ verifier: string; state: string; bot?: boolean }>(req.cookies.get("tm_oauth")?.value);
  if (!code || !state || !saved || saved.state !== state) return fail("Sign-in expired. Try again.");

  // Reply bot: an admin connects the project account. Store its tokens, keep the admin's own session.
  if (saved.bot) {
    const back = (q: string) => {
      const r = NextResponse.redirect(`${env.appUrl()}/rewards/admin/bot?${q}`);
      r.cookies.delete("tm_oauth");
      return r;
    };
    const admin = await getUser();
    if (!admin || !isAdmin(admin.username)) return fail("Only admins can connect the bot account.");
    try {
      const t = await exchangeCode(code, saved.verifier);
      const me = await getMe(t.access_token);
      const data = {
        xId: me.id,
        username: me.username,
        accessToken: encrypt(t.access_token),
        refreshToken: t.refresh_token ? encrypt(t.refresh_token) : null,
        tokenExpiresAt: new Date(Date.now() + t.expires_in * 1000),
      };
      await db.botAccount.upsert({ where: { id: "x" }, create: { id: "x", ...data }, update: data });
      return back(`connected=${encodeURIComponent(me.username)}`);
    } catch (e) {
      console.error("bot connect failed", e);
      return back("error=1");
    }
  }

  try {
    const t = await exchangeCode(code, saved.verifier);
    const me = await getMe(t.access_token);
    const tokens = {
      accessToken: encrypt(t.access_token),
      refreshToken: t.refresh_token ? encrypt(t.refresh_token) : null,
      tokenExpiresAt: new Date(Date.now() + t.expires_in * 1000),
    };
    const profile = {
      username: me.username,
      name: me.name,
      avatarUrl: biggerAvatar(me.profile_image_url) ?? null,
      bio: me.description ?? null,
      followersCount: me.public_metrics?.followers_count ?? 0,
      followingCount: me.public_metrics?.following_count ?? 0,
    };
    const existing = await db.user.findUnique({ where: { xId: me.id }, select: { id: true } });
    let referredById: string | null = null;
    const ref = req.cookies.get("tm_ref")?.value;
    if (!existing && ref) {
      // ?ref= is the inviter's X username (old links used a generated code, still accepted)
      const rows = await db.$queryRaw<{ id: string }[]>`SELECT id FROM User WHERE lower(username) = ${ref.toLowerCase()} OR referralCode = ${ref} LIMIT 1`;
      referredById = rows[0]?.id ?? null;
    }
    const user = await db.user.upsert({
      where: { xId: me.id },
      create: { xId: me.id, ...profile, ...tokens, referredById },
      update: { ...profile, ...tokens },
    });
    const agent = await db.agent.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });
    await setSession(user.id);
    const res = NextResponse.redirect(`${env.appUrl()}${agent.status === "ready" ? "/dashboard" : "/generate"}`);
    res.cookies.delete("tm_oauth");
    res.cookies.delete("tm_ref");
    return res;
  } catch (e) {
    console.error("X callback failed", e);
    return fail("Could not finish X sign-in. Check the app keys and callback URL.");
  }
}
