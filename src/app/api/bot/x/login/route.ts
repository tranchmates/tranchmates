import { NextResponse } from "next/server";
import { authorizeUrl, BOT_SCOPES, createPkce } from "@/lib/x";
import { getUser, sign } from "@/lib/session";
import { isAdmin } from "@/lib/rewards";
import { env } from "@/lib/env";

// Admin only: connect the project's X account (with write access) for the reply bot.
// Sign in to X as the project account in this browser before clicking.
export async function GET() {
  const user = await getUser();
  if (!user || !isAdmin(user.username)) return NextResponse.redirect(`${env.appUrl()}/rewards`);
  const { verifier, challenge, state } = createPkce();
  const res = NextResponse.redirect(authorizeUrl(state, challenge, BOT_SCOPES));
  res.cookies.set("tm_oauth", sign({ verifier, state, bot: true, exp: Math.floor(Date.now() / 1000) + 600 }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}
