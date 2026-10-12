// Public "About trenchmates" content. Used by /about and by the public GitHub README.
// Only facts we can stand behind: no partners, audits, figures, tokenomics or contract address.

export const LINKS = {
  site: "https://trenchmates.xyz",
  x: "https://x.com/trenchmates_sol",
  xHandle: "@trenchmates_sol",
  telegram: "https://t.me/trenchmates_sol",
  telegramHandle: "@trenchmates_sol",
};

/** The official $PAWS contract address on Solana. */
export const PAWS_CA = "5Gm8HQAijLVzXSjbWRqzCEotJwKrrZS8BdKdsof6pump";

export type NewsItem = { date: string; title: string; body: string };

/** Newest first. Add a line here to publish news on /about. */
export const NEWS: NewsItem[] = [
  {
    date: "2026-10-12",
    title: "$PAWS is live",
    body: `The official contract address is ${PAWS_CA}. Copy it from trenchmates.xyz, our X or our Telegram only.`,
  },
  {
    date: "2026-10-10",
    title: "trenchmates is live",
    body: "trenchmates.xyz is open. Sign in with X and your agent is built from your feed in about a minute.",
  },
  {
    date: "2026-10-10",
    title: "Wallet tracker with cluster alerts",
    body: "Follow any Solana wallet. Every buy and sell lands in your feed, with \"sold all\" or \"sold N%\" on exits and a highlighted alert when two or more of your wallets buy the same token within 15 minutes.",
  },
  {
    date: "2026-10-10",
    title: "Quick buy and live PnL",
    body: "One-click buys from any alert, signed in your own wallet. Positions show entry market cap against market cap now, refreshed every few seconds.",
  },
  {
    date: "2026-10-10",
    title: "$PAWS rewards",
    body: "Earn $PAWS points for daily check-ins, tasks, trading on the site and inviting friends with your X username link.",
  },
];

export const FEATURES: { name: string; who?: string; text: string }[] = [
  {
    name: "MemePaws",
    who: "your agent",
    text: "Paste a contract address or an X link. You get a verdict with the agent's own take, a 0-100 risk score that goes red on obvious scams, the dev's track record, bundles and snipers, liquidity and holders, plus the top X posts about that token.",
  },
  {
    name: "Barkley",
    who: "your assistant",
    text: "Give it jobs in plain words: \"send me this token's market cap in 5 minutes\", \"tell me when it crosses 1M\", \"remind me at 18:00\". It also tracks wallets for you.",
  },
  {
    name: "Wallets",
    text: "Track influencer and smart-money wallets with your own emoji and name. Buys, sells, how much of the bag they sold, cluster alerts, one-click scan and quick buy.",
  },
  {
    name: "Positions",
    text: "Live PnL for what you hold: market cap at your average entry against market cap now, plus a trade history in SOL.",
  },
  {
    name: "Alerts",
    text: "Volume spikes, posts from projects you watch, new tokens, Barkley's reports and wallet trades, as pop-ups on the site and in one feed.",
  },
  {
    name: "Rewards",
    text: "Daily check-ins and tasks, social tasks, trading tiers and invites, all paid in $PAWS points.",
  },
];

export const HOW: { step: string; text: string }[] = [
  { step: "Sign in with X", text: "Read-only: we read your profile, who you follow and your recent posts. We never post, like or follow for you." },
  { step: "Your agent spawns", text: "It maps what you're into, picks a mascot (a trencher cat or a dog in a suit) and you give it a name." },
  { step: "Dig", text: "Scan contracts, track wallets, set alerts and trade from one screen." },
];

export const TRUST: string[] = [
  "Non-custodial. We never hold your keys or funds. Every trade is signed in your own wallet (Phantom, Solflare or Backpack).",
  "Swaps route through Jupiter. Trades made on trenchmates carry a 1% platform fee, shown in the trade panel before you sign.",
  "X access is read-only.",
  "AI verdicts can be wrong. Nothing here is financial advice. Do your own research.",
];

export const PAWS = {
  title: "$PAWS",
  lines: [
    "$PAWS is the trenchmates coin, live on Solana.",
    "Rewards you earn on the site are tracked as $PAWS points.",
    "The only official contract address is the one on this page, on our X and in our Telegram. Ignore any other CA.",
  ],
};
