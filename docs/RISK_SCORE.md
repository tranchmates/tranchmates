# Risk score

Every scan ends in one number from 0 (run) to 100 (looks clean). It is computed by fixed rules in [`src/lib/risk.ts`](../src/lib/risk.ts), never by the language model. The model only explains the result.

## Levels

| Score | Level |
|---|---|
| 0 – 24 | Scam risk |
| 25 – 44 | High risk |
| 45 – 64 | Caution |
| 65 – 79 | Fair |
| 80 – 100 | Solid |

## How it is computed

The score starts at 100. Each risky signal **subtracts** points. The worst signals also set a **cap**: whatever else the token has going for it, the final score can't go above that cap. The final score is the lower of the two.

### Contract

| Signal | Penalty | Cap |
|---|--:|--:|
| Mint authority active (more supply can be printed) | −40 | 20 |
| Freeze authority active (wallets can be frozen) | −35 | 15 |

### Liquidity

| Signal | Penalty | Cap |
|---|--:|--:|
| No DEX pair | −30 | 30 |
| Liquidity under $3K | −35 | 15 |
| Liquidity under $10K | −20 | 40 |
| Liquidity under $30K | −8 | |
| Liquidity under 2% of market cap | −20 | 35 |
| Liquidity under 5% of market cap | −14 | 72 |
| Liquidity under 8% of market cap | −6 | 85 |

### Holders

| Signal | Penalty | Cap |
|---|--:|--:|
| Top 10 accounts hold over 70% | −25 | 30 |
| Top 10 accounts hold over 50% | −15 | |
| Top 10 accounts hold over 35% | −6 | |

### Trading

| Signal | Penalty | Cap |
|---|--:|--:|
| 30+ buys and zero sells in 24h (possible honeypot) | −50 | 10 |
| Sells outnumber buys 2x (100+ trades) | −12 | |
| Down over 80% in 24h | −20 | 30 |
| Down over 50% in the last hour | −15 | |
| 24h volume over 50x liquidity (possible wash trading) | −15 | |
| 24h volume over 25x liquidity | −6 | |

### Age

| Signal | Penalty | Cap |
|---|--:|--:|
| Pair younger than 1 hour | −10 | 55 |
| Pair younger than 1 day | −5 | 70 |
| Pair younger than 1 week | | 85 |

### Dev and launch

| Signal | Penalty | Cap |
|---|--:|--:|
| Serial launcher: 80%+ of 5+ recent tokens are dead | −35 | 15 |
| 60%+ of 3+ recent tokens are dead | −20 | 35 |
| Dev launched 3+ other tokens recently | −8 | |
| Over 30% of supply bought in the launch block (bundle) | −30 | 20 |
| Over 15% bought in the launch block | −18 | |
| Over 8% bought in the launch block | −8 | |
| Snipers took over 25% in the first blocks | −15 | |
| Snipers took over 10% | −6 | |
| Dev bought over 10% at launch | −10 | |

### Positives

Positives are small and never lift a capped score.

| Signal | Bonus |
|---|--:|
| Mint and freeze renounced | noted, 0 |
| Liquidity over $100K and older than a week | +5 |
| Accounts you follow posted it (3+ accounts) | +5 (+8) |
| Actively discussed on X (10+ posts) | +3 |

### Always-on caps

| Condition | Cap |
|---|--:|
| No dev / launch data available yet | 85 |
| pump.fun memecoin (mint ends in `pump`) | 90 |

## Reasons

Each rule that fires adds a reason. Reasons are sorted worst first, and the top ones are what you see on the verdict card and in the reply bot's answers on X.

AI verdicts can be wrong and none of this is financial advice.
