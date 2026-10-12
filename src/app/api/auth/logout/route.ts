import { NextResponse } from "next/server";
import { clearSession } from "@/lib/session";
import { env } from "@/lib/env";

export async function POST() {
  await clearSession();
  return NextResponse.redirect(`${env.appUrl()}/`, { status: 303 });
}
