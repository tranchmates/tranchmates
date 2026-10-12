# $PAWS rewards

$PAWS is the trenchmates coin on Solana (CA `5Gm8HQAijLVzXSjbWRqzCEotJwKrrZS8BdKdsof6pump`). Everything users earn on the site is tracked as **$PAWS points**. Logic: [`src/lib/rewards.ts`](../src/lib/rewards.ts).

## What pays

| Kind | Task | $PAWS | How often |
|---|---|--:|---|
| daily | Check-in | 100, +50 per streak day, up to day 7 (400) | once a day |
| daily | Scan 3 tokens | 200 | once a day |
| daily | Add a token to the watchlist | 100 | once a day |
| trading | 0.1 SOL of swaps on the site today | 1,000 | once a day |
| trading | 0.5 SOL | 7,000 | once a day |
| trading | 1 SOL | 15,000 | once a day |
| social | Follow @trenchmates_sol on X | 1,000 | once |
| social | Join the Telegram channel | 1,000 | once |
| social | Repost the rewards post | 1,000 | once |
| invites | A friend signs up with your link | 2,000 (friend gets 500) | per friend |

The day resets at 00:00 UTC. Missing a day resets the check-in streak.

Trading tiers count swaps made through the site (confirmed by Jupiter). Sell volume is the SOL that actually arrived after slippage and fees, so tiers accept 2% less than the nominal size.

## No double payouts

Every payout is a `RewardEvent` with a unique key per user, for example `checkin:2026-10-12`, `tier:0.5:2026-10-12` or `task:<id>`. The database refuses a second row with the same key, so double clicks, retries or two open tabs can't pay twice.

## Verified X tasks

Social tasks of type follow, repost, reply, quote and post are checked on X before they pay (through twitterapi.io). If X can't be reached, the claim says so and can be retried; nothing is paid on a guess.

## Invites

The invite link is `https://<site>/?ref=<your X username>`. The inviter gets paid when the friend's agent is ready, and the friend gets a welcome bonus.

## Managing tasks

Admins (X usernames in `ADMIN_X_USERNAMES`) add and edit tasks at `/rewards/admin`:

- **Daily** tasks: scan N tokens, add N to watchlist, send N messages to the agent, trade N SOL, post on X with a @handle or $ticker, visit a link. For one date or every day. With no daily tasks set, users get the defaults (scan 3, watch 1).
- **Social** tasks: follow an account, repost / reply to / quote a post, post with a @handle or $ticker, visit a link. Each pays once.

Team accounts listed as admins are hidden from the leaderboard.
