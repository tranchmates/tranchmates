import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/session";
import { db } from "@/lib/db";
import { Logo } from "@/components/Logo";
import { AppTabs } from "@/components/AppTabs";
import { AssistantToasts } from "@/components/AssistantToasts";
import { ASSISTANT_NAME } from "@/lib/assistant";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/");
  if (user.agent?.status !== "ready") redirect("/generate");
  const unread = await db.alert.count({ where: { userId: user.id, read: false } });

  return (
    <div className="terminal-floor min-h-dvh pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-line bg-night/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1760px] items-center gap-6 px-4 py-3 sm:px-6">
          <Logo href="/dashboard" />
          <AppTabs unread={unread} agentName={user.agent?.name} assistantName={ASSISTANT_NAME} />
          <div className="ml-auto flex items-center gap-3">
            <Link href="/settings" aria-label="Settings">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full border border-line" />
              ) : (
                <span className="block h-8 w-8 rounded-full border border-line bg-panel-2" />
              )}
            </Link>
            <span className="hidden text-sm text-mute lg:inline">@{user.username}</span>
            <form action="/api/auth/logout" method="post">
              <button className="text-xs text-mute hover:text-ink">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1760px] px-4 py-6 sm:px-6">{children}</main>
      <AssistantToasts name={ASSISTANT_NAME} />
    </div>
  );
}
