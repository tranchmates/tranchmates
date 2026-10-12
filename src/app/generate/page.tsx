import { redirect } from "next/navigation";
import { getUser } from "@/lib/session";
import { GenerateClient } from "./GenerateClient";

export const dynamic = "force-dynamic";

export default async function GeneratePage() {
  const user = await getUser();
  if (!user) redirect("/");
  if (user.agent?.status === "ready") redirect("/dashboard");
  return <GenerateClient username={user.username} name={user.name} avatarUrl={user.avatarUrl} />;
}
