<div align="center">

<img src="assets/logo.png" width="132" alt="trenchmates logo: a cat in a yellow hard hat with a headlamp">

# trenchmates

**YOUR AI TRENCH AGENT. BUILT FROM YOUR X. PAID IN $PAWS.**

Sign in with X and a personal Solana agent is built from your feed in about a minute.
Paste a CA, get a verdict. Track any wallet. Give jobs to your assistant. Earn $PAWS for all of it.

[![Live](https://img.shields.io/badge/live-trenchmates.xyz-ffc531?style=for-the-badge&labelColor=0a0f1f)](https://trenchmates.xyz)
&nbsp;
[![Follow @trenchmates_sol](https://img.shields.io/badge/Follow-@trenchmates__sol-0a0f1f?style=for-the-badge&logo=x&logoColor=white)](https://x.com/trenchmates_sol)
&nbsp;
[![Telegram](https://img.shields.io/badge/Telegram-@trenchmates__sol-0a0f1f?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/trenchmates_sol)

![Next.js](https://img.shields.io/badge/Next.js-15-e8ecff?style=flat-square&labelColor=0a0f1f&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-9fb4ff?style=flat-square&labelColor=0a0f1f&logo=react&logoColor=9fb4ff)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-9fb4ff?style=flat-square&labelColor=0a0f1f&logo=typescript&logoColor=9fb4ff)
![Solana](https://img.shields.io/badge/chain-Solana-3ddc97?style=flat-square&labelColor=0a0f1f&logo=solana&logoColor=3ddc97)
![Custody](https://img.shields.io/badge/custody-none-3ddc97?style=flat-square&labelColor=0a0f1f)
![X access](https://img.shields.io/badge/X%20access-read--only-ffc531?style=flat-square&labelColor=0a0f1f)
![Runtime deps](https://img.shields.io/badge/runtime%20deps-6-ffc531?style=flat-square&labelColor=0a0f1f)

**$PAWS CA**

```
5Gm8HQAijLVzXSjbWRqzCEotJwKrrZS8BdKdsof6pump
```

[DexScreener](https://dexscreener.com/solana/5Gm8HQAijLVzXSjbWRqzCEotJwKrrZS8BdKdsof6pump) · [pump.fun](https://pump.fun/coin/5Gm8HQAijLVzXSjbWRqzCEotJwKrrZS8BdKdsof6pump) · [Solscan](https://solscan.io/token/5Gm8HQAijLVzXSjbWRqzCEotJwKrrZS8BdKdsof6pump)

<img src="assets/hero.gif" width="100%" alt="The cat swings a pickaxe in the mine, the dog types at an office desk, then both share one $PAWS coin">

</div>

<br>

<div align="center">
<img src="assets/scan-terminal.svg" width="100%" alt="Terminal: a contract address is pasted, the agent checks dev, bundles, snipers, holders and X buzz, and returns the verdict $JEANPHIL 85/100 Solid">
</div>

<br>

## Paste a CA. Get a verdict.

<img src="assets/scan.gif" width="100%" alt="Pasting a contract address into the chat, the agent answers with a verdict card scored 85/100 and a buy panel">

One contract address in, one answer out. The agent pulls the facts in parallel, scores them with fixed rules, then explains them in plain words:

| | What it checks | Where it comes from |
|:-:|---|---|
| 1 | Mint and freeze authority, top 10 holders | Solana RPC (Helius) |
| 2 | Price, market cap, liquidity, volume, buys vs sells, pair age | DexScreener |
| 3 | Dev wallet history, launch-block bundle, snipers, dev buy | raw chain history (Helius) |
| 4 | Who is posting about it, and whether people **you follow** did | X (twitterapi.io) |
| 5 | **Verdict, 0-100 risk score, the agent's own take** | rules + LLM |

The score is never the model's opinion. The numbers come from the rules in [`src/lib/risk.ts`](src/lib/risk.ts); the LLM only puts them into words.

<br>

## The score is honest

<img src="assets/risk-score.svg" width="100%" alt="Risk score bar from 0 to 100: Scam risk below 25, High risk to 45, Caution to 65, Fair to 80, Solid from 80. Hard caps: honeypot max 10, mint authority max 20, freeze authority max 15, almost no liquidity max 15, serial launcher max 15, bundled launch max 20, pair under an hour max 55, no dev data max 85, pump.fun memecoin max 90">

Every risky signal subtracts points. Obvious scam signals also **cap** the score, so great volume can never "offset" an active mint authority. A token without dev and launch data can't score above 85, and a pump.fun memecoin can't score above 90 however clean it looks. Details: [docs/RISK_SCORE.md](docs/RISK_SCORE.md).

<br>

## How the agent thinks

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#111833','primaryTextColor':'#e8ecff','primaryBorderColor':'#ffc531','lineColor':'#ffc531','fontFamily':'monospace'}}}%%
flowchart LR
  A["Paste a CA<br/>or an X link"] --> B["Mint facts<br/>authorities · holders"]
  A --> C["Market<br/>liquidity · volume · age"]
  A --> D["Launch<br/>dev history · bundle · snipers"]
  A --> E["X<br/>buzz · people you follow"]
  B & C & D & E --> F{"Risk rules<br/>penalties + caps"}
  F --> G["Score 0-100<br/>Scam risk … Solid"]
  G --> H["LLM take<br/>plain words, no new numbers"]
  H --> I["Verdict card<br/>+ one-click buy"]
```

<br>

## Built from your X

<div align="center"><img src="assets/mascots.png" width="60%" alt="The two mascots: a trencher cat in a hard hat and a business dog in a suit"></div>

Sign in with X (read-only) and the agent reads your profile, who you follow and your recent posts. It maps what you're into, picks a mascot, **a trencher cat or a dog in a suit**, and you give it a name. From then on it knows your circle: a scan tells you when accounts you follow posted the same CA.

The app never posts, likes or follows for you.

<br>

## Track any wallet

<table>
<tr>
<td width="58%"><img src="assets/wallets.gif" width="100%" alt="Adding a wallet with a name and an emoji, it appears in Your wallets with pop-ups, buys and sells switched on"></td>
<td>

Paste any Solana wallet, give it a **name and an emoji**, and every buy and sell lands in your feed.

- **sold all** or **sold N%** on exits, so you know how much of the bag left
- **cluster alert** when two or more of your wallets buy the same token within 15 minutes
- top-center pop-ups, like the terminals you already use
- **⚡ quick buy** and **Scan CA** right on the alert
- minimum SOL filter per wallet, buys / sells toggles

</td>
</tr>
</table>

<br>

## Barkley takes the job

<img src="assets/barkley.gif" width="100%" alt="Barkley chat: 'send me the mcap of this CA in 5 minutes' becomes a scheduled report that appears in the Jobs list">

Barkley is your assistant. Give it jobs in plain words and it runs them on the server, even with the tab closed:

| You say | Barkley does |
|---|---|
| "send me the mcap of this CA in 5 minutes" | a one-off report at that time |
| "update me on this token every 10 minutes, 6 times" | a repeating report |
| "tell me when this CA's mcap goes above 1M" | an alert, checked every minute |
| "remind me at 18:00" | a reminder |
| "track wallet `<address>` as degen" | a wallet tracker |

Every result shows up in Activity, in Alerts and as a pop-up.

<br>

## Trade without leaving the scan

<table>
<tr>
<td width="50%"><img src="assets/screens/buy-panel.png" width="100%" alt="Buy panel: amount 0.1 SOL, presets, balance, fee 1%, Buy button"><br><sub><b>Buy / sell.</b> Signed in your own wallet: Phantom, Solflare or Backpack.</sub></td>
<td width="50%"><img src="assets/screens/positions.png" width="100%" alt="Positions widget: one open position at +0.035 SOL, +30.4%"><br><sub><b>Live PnL.</b> Market cap at your entry against market cap now.</sub></td>
</tr>
</table>

Swaps route through **Jupiter**. Non-custodial: keys and funds never touch the server. Trades made on trenchmates carry a **1% platform fee**, shown in the panel before you sign.

<br>

## $PAWS rewards

<table>
<tr>
<td width="44%"><img src="assets/rewards.gif" width="100%" alt="Reward tasks one per beat: daily check-in, scan 3 tokens, watch a token, follow on X, Telegram, trade tiers, invite a friend; the balance counter ticks up"></td>
<td>

Everything you do on the site earns **$PAWS points**.

| Task | $PAWS |
|---|--:|
| Daily check-in (+50 per streak day) | 100 – 400 |
| Scan 3 tokens | 200 |
| Watch a token | 100 |
| Trade 0.1 / 0.5 / 1 SOL on the site | 1,000 / 7,000 / 15,000 |
| Follow @trenchmates_sol on X | 1,000 |
| Join the Telegram channel | 1,000 |
| Invite a friend (they get +500) | 2,000 |

Daily tasks and trade tiers reset at 00:00 UTC. Social tasks pay once.

</td>
</tr>
</table>

<img src="assets/rewards-ladder.svg" width="100%" alt="Bar chart of what each action pays: check-in 100 to 400, scan 200, watch 100, trade tiers 1,000, 7,000 and 15,000, follow 1,000, Telegram 1,000, repost 1,000, invite 2,000">

Rewards are decided on the server and every payout has a unique key per user, so nothing can be claimed twice (double clicks, retries, two tabs). X tasks are verified before they pay. Invite links use your X username: `trenchmates.xyz/?ref=<you>`. Details: [docs/REWARDS.md](docs/REWARDS.md).

<br>

## The agent answers on X too

```text
$FROG · 9/100 · Scam risk

- Almost no liquidity ($3K)
- Serial launcher: 12 of the dev's 12 recent tokens are dead
- Top 10 accounts hold 96% of supply

full scan on trenchmates.xyz
```

Drop a CA under one of our posts and the project account replies with the scan, usually within a minute. Same rules, same score. The reply bot only answers people who wrote to us first, once per reply, with hourly caps. Details: [docs/REPLY_BOT.md](docs/REPLY_BOT.md).

<br>

## Screens

<table>
<tr>
<td width="50%"><img src="assets/screens/verdict.png" width="100%" alt="Chat verdict: Solid 85/100 with the agent's take and key numbers"><br><sub><b>Verdict.</b> The take, the key numbers, the score.</sub></td>
<td width="50%"><img src="assets/screens/trades.png" width="100%" alt="Trades table: wallet, token, buy or sold all, size, market cap, time, quick buy and Scan CA"><br><sub><b>Wallet trades.</b> Buys, exits, quick buy, scan.</sub></td>
</tr>
<tr>
<td><img src="assets/screens/barkley-jobs.png" width="100%" alt="Barkley Jobs and Activity panels"><br><sub><b>Jobs.</b> What Barkley is doing and what it delivered.</sub></td>
<td><img src="assets/screens/rewards-balance.png" width="100%" alt="Rewards: balance 3,400 $PAWS, rank, streak, trading tiers and invite link"><br><sub><b>Rewards.</b> Balance, streak, tiers, invite link.</sub></td>
</tr>
</table>

<br>

## Architecture

```mermaid
%%{init: {'theme':'base','themeVariables':{'primaryColor':'#111833','primaryTextColor':'#e8ecff','primaryBorderColor':'#3ddc97','lineColor':'#3ddc97','fontFamily':'monospace'}}}%%
flowchart LR
  U["Trader"] -- "Sign in with X<br/>OAuth 2.0 PKCE" --> W["Next.js app<br/>pages + /api"]
  W --> DB[("SQLite · Prisma<br/>users · agents · rewards")]
  W -- "scan" --> S["Helius RPC<br/>DexScreener"]
  W -- "X data" --> X["twitterapi.io<br/>X API v2"]
  W -- "words" --> L["LLM<br/>Groq or Anthropic"]
  W -- "quote" --> J["Jupiter"]
  U -- "signs in own wallet" --> J
  C["cron · every minute"] -- "jobs · wallets · alerts · reply bot" --> W
```

| Layer | Stack |
|---|---|
| App | Next.js 15 (App Router), React 19, Tailwind CSS 4, TypeScript |
| Data | Prisma 6 + SQLite (Postgres works with a one-line change) |
| Solana | `@solana/web3.js`, Helius RPC, DexScreener, Jupiter swaps |
| X | official API v2 for sign-in and posting, twitterapi.io for cheap reads |
| AI | any OpenAI-compatible API (Groq by default) or Anthropic |
| Jobs | one cron call per minute: Barkley jobs, wallet trackers, token and account watch, reply bot |

More: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

<br>

## Run it

```bash
git clone <this repo> trenchmates
cd trenchmates
cp .env.example .env     # fill in the keys, see SETUP.md
npm install              # also generates the Prisma client
npx prisma db push       # creates the SQLite database
npm run dev              # http://localhost:3000
```

Background jobs run from one endpoint, called every minute:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" "http://localhost:3000/api/cron/tick?jobs=assistant,wallets"
```

Self-hosting on a VPS (systemd, Caddy, cron), every environment variable and the X app setup: **[SETUP.md](SETUP.md)**.

<details>
<summary><b>Project structure</b></summary>

```
src/
├── app/
│   ├── (app)/          dashboard (MemePaws), assistant (Barkley), wallets, watchlist,
│   │                   alerts, rewards (+ admin, reply bot), portfolio, airdrops, settings
│   ├── about/          public page: news, features, $PAWS, trust notes
│   ├── generate/       agent build screen: name your agent
│   └── api/            auth (X OAuth), agent, chat, analyze, token, swap, pnl,
│                       wallets, assistant, alerts, rewards, bot, cron/tick
├── components/         chat, token card, trade panel, positions, toasts, mascots
├── content/            about page content (news, features, $PAWS)
└── lib/
    ├── analyze.ts      token report: mint facts + market data
    ├── risk.ts         the 0-100 score: penalties and caps
    ├── devcheck.ts     dev history, launch bundle, snipers
    ├── agent.ts        agent build from X + chat with tools
    ├── assistant.ts    Barkley: reports, alerts, reminders
    ├── wallettrack.ts  wallet trackers, sold %, cluster alerts
    ├── rewards.ts      $PAWS: tasks, tiers, streaks, invites
    ├── replybot.ts     answers CAs under project posts on X
    ├── jupiter.ts      swaps (quote, execute, platform fee)
    ├── x.ts, xdata.ts  X API v2 and twitterapi.io
    └── llm.ts          OpenAI-compatible or Anthropic
prisma/                 schema (SQLite)
public/                 icon, OG image
docs/                   architecture, risk score, rewards, reply bot
```

</details>

<details>
<summary><b>Docs</b></summary>

- [Architecture](docs/ARCHITECTURE.md)
- [Risk score](docs/RISK_SCORE.md)
- [$PAWS rewards](docs/REWARDS.md)
- [Reply bot](docs/REPLY_BOT.md)
- [Self-hosting](SETUP.md)

</details>

<br>

## Trust

- **Non-custodial.** We never hold your keys or funds. Every trade is signed in your own wallet.
- **X access is read-only.** The app never posts, likes or follows for you.
- **One official CA.** `5Gm8HQAijLVzXSjbWRqzCEotJwKrrZS8BdKdsof6pump` is the only $PAWS contract address. It is posted on trenchmates.xyz, [@trenchmates_sol](https://x.com/trenchmates_sol) and our Telegram. Ignore any other CA.
- **AI verdicts can be wrong.** Nothing here is financial advice. Do your own research.

<br>

<div align="center">
<img src="assets/banner.png" width="100%" alt="trenchmates banner with the cat and the dog">

<br>

**YOUR AI TRENCH AGENT. BUILT FROM YOUR X. PAID IN $PAWS.**

<sub><a href="https://trenchmates.xyz">trenchmates.xyz</a> · <a href="https://x.com/trenchmates_sol">@trenchmates_sol</a> · <a href="https://t.me/trenchmates_sol">Telegram</a></sub>
</div>
