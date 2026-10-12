# Setup

## 1. Keys

Copy `.env.example` to `.env` and fill it in. `.env` is git-ignored; never commit it.

| Variable | Where to get it |
|---|---|
| `APP_URL` | your site, e.g. `https://example.com` (no trailing slash) |
| `SESSION_SECRET` | `openssl rand -hex 32` |
| `CRON_SECRET` | `openssl rand -hex 24` |
| `DATABASE_URL` | `file:./dev.db` for SQLite |
| `X_CLIENT_ID`, `X_CLIENT_SECRET` | developer.x.com → your app → User authentication settings (OAuth 2.0, Web App) |
| `X_BEARER_TOKEN` | developer.x.com → Keys and tokens |
| `TWITTERAPI_IO_KEY` | twitterapi.io (cheap reads; strongly recommended) |
| `HELIUS_API_KEY` | dashboard.helius.dev |
| `JUPITER_API_KEY` | optional, developers.jup.ag |
| `JUP_REFERRAL_ACCOUNT`, `JUP_REFERRAL_FEE_BPS` | optional platform fee on swaps, referral.jup.ag |
| `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL` | any OpenAI-compatible API (Groq by default) |
| `ANTHROPIC_API_KEY` | alternative to `LLM_*` |
| `ADMIN_X_USERNAMES` | X usernames (comma separated) that manage rewards and the reply bot |
| `TELEGRAM_BOT_TOKEN` | optional, alerts in Telegram (@BotFather) |

Without an LLM key the chat runs in a reduced mode: CA and post checks still work, the conversational agent doesn't.

### X app

- Type: Web App, OAuth 2.0.
- Callback URI: `https://YOUR-SITE/api/auth/x/callback` (and `http://localhost:3000/api/auth/x/callback` for local dev).
- App permissions: **Read** is enough for sign-in. Set **Read and write** if you use the reply bot.

## 2. Run locally

```bash
npm install          # installs and generates the Prisma client
npx prisma db push   # creates the SQLite database
npm run dev          # http://localhost:3000
```

## 3. Production on a VPS

Node 20+, a reverse proxy with HTTPS (Caddy shown) and a cron. Netlify / Vercel serverless is a poor fit: the app needs a per-minute cron and a database on disk.

```bash
npm ci
npx prisma db push
npm run build
npm start            # listens on :3000
```

systemd unit (example):

```ini
[Unit]
Description=trenchmates
After=network.target

[Service]
WorkingDirectory=/srv/trenchmates
EnvironmentFile=/srv/trenchmates/.env
ExecStart=/usr/bin/npm start
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

Caddyfile:

```
example.com {
  reverse_proxy 127.0.0.1:3000
}
```

Cron (one call per minute is enough; heavier jobs less often):

```bash
* * * * *    curl -s -m 110 -H "Authorization: Bearer $CRON_SECRET" "http://127.0.0.1:3000/api/cron/tick?jobs=assistant,wallets"
*/5 * * * *  curl -s -m 110 -H "Authorization: Bearer $CRON_SECRET" "http://127.0.0.1:3000/api/cron/tick?jobs=tokens,discovery"
*/15 * * * * curl -s -m 110 -H "Authorization: Bearer $CRON_SECRET" "http://127.0.0.1:3000/api/cron/tick?jobs=accounts"
0 * * * *    curl -s -m 110 -H "Authorization: Bearer $CRON_SECRET" "http://127.0.0.1:3000/api/cron/tick?jobs=digest"
```

## Postgres

Change `provider = "sqlite"` to `"postgresql"` in `prisma/schema.prisma`, point `DATABASE_URL` at your database and run `npx prisma db push`.

## AI provider

| Provider | `LLM_BASE_URL` |
|---|---|
| Groq | `https://api.groq.com/openai/v1` |
| OpenRouter | `https://openrouter.ai/api/v1` |
| Google Gemini | `https://generativelanguage.googleapis.com/v1beta/openai` |
| OpenAI | `https://api.openai.com/v1` |

Set `LLM_MODEL` to a model your provider offers. For reasoning models on Groq, `LLM_REASONING_EFFORT=low` keeps answers fast.
