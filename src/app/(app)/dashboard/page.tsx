import { redirect } from "next/navigation";
import { getUser } from "@/lib/session";
import { parseJson } from "@/lib/db";
import type { InterestProfile } from "@/lib/interests";
import { Mascot } from "@/components/mascots/Mascot";
import { AgentChat } from "@/components/AgentChat";
import { WalletTrackers } from "@/components/WalletTrackers";
import { WatchMini } from "@/components/WatchMini";
import { MentionsColumn } from "@/components/MentionsColumn";
import { HistoryCard } from "@/components/HistoryCard";
import { PositionsCard } from "@/components/PositionsCard";

export default async function DashboardPage() {
  const user = await getUser();
  if (!user?.agent) redirect("/");
  const agent = user.agent;
  const interests = parseJson<InterestProfile | null>(agent.interests, null);
  const mascot = agent.mascot === "dog" ? "dog" : "cat";

  return (
    // Desktop (xl+): four columns that exactly fill the screen; only the inside of each column scrolls.
    //   [ positions / wallet tracker / history ] [ chat ] [ agent / watching ] [ on X ]
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:h-[calc(100dvh-106px)] xl:grid-cols-[264px_minmax(0,1fr)_280px_300px] 2xl:grid-cols-[300px_minmax(0,1fr)_320px_340px]">
      <div className="order-2 flex min-h-0 flex-col gap-4 lg:col-span-2 xl:order-none xl:col-span-1">
        <PositionsCard />
        <div className="min-h-0 xl:flex-1">
          <WalletTrackers />
        </div>
        <HistoryCard />
      </div>

      <div className="order-1 min-h-0 xl:order-none">
        <AgentChat agentName={agent.name ?? "Agent"} mascot={mascot} />
      </div>

      <aside className="scroll-thin order-1 min-h-0 space-y-4 xl:order-none xl:overflow-y-auto">
        {/* Agent + the user it was built from */}
        <section className="overflow-hidden rounded-2xl border border-line bg-panel">
          <div className={`relative flex items-end gap-4 px-5 pt-5 border-b border-line ${mascot === "dog" ? "bg-linear-to-b from-suit to-suit/20" : "bg-linear-to-b from-hat/20 to-hat/[0.02]"}`}>
            <Mascot kind={mascot} className="-mb-2 w-28 shrink-0" />
            <div className="pb-5">
              <p className="text-xs text-gain">online</p>
              <h2 className="font-display text-2xl font-bold">{agent.name}</h2>
              <p className="mt-1 flex items-center gap-2 text-xs text-mute">
                {user.avatarUrl && <img src={user.avatarUrl} alt="" className="h-5 w-5 rounded-full" />}
                built from @{user.username}
              </p>
            </div>
          </div>
          <div className="space-y-5 px-5 py-5">
            {agent.persona && <p className="text-[13px] leading-6 text-mute">{agent.persona}</p>}

            {!!interests?.tags.length && (
              <div>
                <h3 className="mb-2 text-xs text-mute">What your X says you&apos;re into</h3>
                <ul className="space-y-2">
                  {interests.tags.map((t) => (
                    <li key={t.label} className="grid grid-cols-[110px_1fr_28px] items-center gap-3 text-xs">
                      <span>{t.label}</span>
                      <span className="h-1.5 overflow-hidden rounded-full bg-panel-2">
                        <span className="block h-full rounded-full bg-hat" style={{ width: `${t.weight}%` }} />
                      </span>
                      <span className="text-right text-mute">{t.weight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!!interests?.tickers.length && (
              <div>
                <h3 className="mb-2 text-xs text-mute">Tickers you post about</h3>
                <p className="flex flex-wrap gap-1.5">
                  {interests.tickers.map((t) => (
                    <span key={t.symbol} className="rounded-md bg-panel-2 px-2 py-0.5 text-xs">
                      ${t.symbol} <span className="text-mute">{t.count}</span>
                    </span>
                  ))}
                </p>
              </div>
            )}

            <dl className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-night py-2">
                <dt className="text-mute">Followers</dt>
                <dd className="mt-0.5 font-bold">{user.followersCount.toLocaleString("en-US")}</dd>
              </div>
              <div className="rounded-lg bg-night py-2">
                <dt className="text-mute">Following</dt>
                <dd className="mt-0.5 font-bold">{user.followingCount.toLocaleString("en-US")}</dd>
              </div>
              <div className="rounded-lg bg-night py-2">
                <dt className="text-mute">Avg likes</dt>
                <dd className="mt-0.5 font-bold">{interests?.postStats.avgLikes ?? 0}</dd>
              </div>
            </dl>
          </div>
        </section>

        <WatchMini />
      </aside>

      <div className="order-3 min-h-0 lg:col-span-2 xl:order-none xl:col-span-1">
        <MentionsColumn />
      </div>
    </div>
  );
}
