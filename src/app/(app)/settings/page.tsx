import { getUser } from "@/lib/session";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const user = await getUser();
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-2xl font-bold">Settings</h1>
      <SettingsClient
        telegramChatId={user?.telegramChatId ?? ""}
        telegramEnabled={Boolean(process.env.TELEGRAM_BOT_TOKEN)}
        digestHourUtc={user?.digestHourUtc ?? null}
        agentName={user?.agent?.name ?? ""}
      />
    </div>
  );
}
