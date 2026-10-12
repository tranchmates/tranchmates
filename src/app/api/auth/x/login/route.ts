import { NextResponse } from "next/server";
import { authorizeUrl, createPkce } from "@/lib/x";
import { sign } from "@/lib/session";

export async function GET(req: Request) {
  const { verifier, challenge, state } = createPkce();
  const res = NextResponse.redirect(authorizeUrl(state, challenge));
  res.cookies.set("tm_oauth", sign({ verifier, state, exp: Math.floor(Date.now() / 1000) + 600 }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  const ref = new URL(req.url).searchParams.get("ref");
  if (ref && /^[a-z0-9_]{1,20}$/i.test(ref)) {
    res.cookies.set("tm_ref", ref.toLowerCase(), { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  }
  return res;
}
