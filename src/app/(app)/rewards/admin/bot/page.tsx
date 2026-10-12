import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/session";
import { isAdmin } from "@/lib/rewards";
import { BotClient } from "./BotClient";

export default async function ReplyBotPage() {
  const user = await getUser();
  if (!user || !isAdmin(user.username)) redirect("/rewards");
  return (
    <Suspense>
      <BotClient />
    </Suspense>
  );
}
