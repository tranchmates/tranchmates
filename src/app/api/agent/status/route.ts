import { requireUser } from "@/lib/session";
import { parseJson } from "@/lib/db";

export async function GET() {
  const { user, res } = await requireUser();
  if (!user) return res;
  const a = user.agent;
  return Response.json({
    user: { username: user.username, name: user.name, avatarUrl: user.avatarUrl, followers: user.followersCount, following: user.followingCount },
    agent: a
      ? {
          status: a.status,
          step: a.step,
          error: a.error,
          name: a.name,
          mascot: a.mascot,
          persona: a.persona,
          interests: parseJson(a.interests, null),
        }
      : null,
  });
}
