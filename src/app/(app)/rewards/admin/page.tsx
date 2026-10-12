import { redirect } from "next/navigation";
import { getUser } from "@/lib/session";
import { isAdmin } from "@/lib/rewards";
import { AdminClient } from "./AdminClient";

export default async function RewardsAdminPage() {
  const user = await getUser();
  if (!user || !isAdmin(user.username)) redirect("/rewards");
  return <AdminClient />;
}
