# 📊 Clear Code — OpenClaw Session Dashboard

A session log dashboard that parses real OpenClaw JSONL session logs and visualizes agent activity, token usage, costs, and tool calls.

**Inspired by [chatgptprojects/clear-code](https://github.com/chatgptprojects/clear-code)** — adapted from "clear visibility into AI coding" into operational visibility for a multi-agent household.

## Live

🌐 [mvp.trollefsen.com/2026-04-01-clear-code/](https://mvp.trollefsen.com/2026-04-01-clear-code/)

## Features

- **Real data** — parses 1,628 OpenClaw sessions across 5 agents (Eve, Wilson, C-3PO, Pepper, Radar)
- **Overview dashboard** — total sessions, messages, tokens ($434 total cost, 600M tokens)
- **Per-agent cards** — color-coded stats with click-to-filter
- **Daily cost chart** — stacked area chart by agent (last 30 days)
- **Tool call heatmap** — top 20 most-used tools with frequency bars
- **Session list** — sortable by cost/tokens/messages/duration/date, filterable by agent, paginated
- **Session detail** — modal with full turn-by-turn timeline showing model, tool calls, thinking blocks, and per-turn cost

## How It Works

1. **Extract**: `node scripts/extract.cjs` reads JSONL logs from `/home/eve/.openclaw/agents/*/sessions/`
2. **Build**: `npm run build` produces a static dashboard with the extracted data baked in
3. **Deploy**: `mv dist out && generate-caddyfile.sh && caddy reload`

## Refresh Data

```bash
node scripts/extract.cjs  # Re-extract from live logs
npm run build              # Rebuild static dashboard
```

## Tech Stack

- React + TypeScript
- [Recharts](https://recharts.org/) for charts
- Tailwind CSS v4
- Vite
- Node.js extraction script (reads JSONL, outputs JSON summaries)

## Data Pipeline

```
JSONL logs → extract.cjs → public/data/overview.json + sessions.json → Vite build → static dashboard
```

The extraction script:
- Reads all `.jsonl` files across all agent directories
- Parses each session into a summary (agent, messages, tokens, costs, models, tool calls)
- Keeps turn-level detail for the top 200 sessions by cost
- Outputs two files: `overview.json` (8KB) and `sessions.json` (1.8MB)

---

Built by [Nightly MVP Builder](https://github.com/sys-fairy-eve) 🌙
