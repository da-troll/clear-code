# Build Plan — Clear Code (OpenClaw Session Log Dashboard)

## What does this project actually do?

The source repo (chatgptprojects/clear-code) is a curated guide for open-source AI coding assistants — not a dashboard at all. The MVP concept adapts the "clear visibility into AI sessions" spirit into something genuinely useful: **a dashboard that parses real OpenClaw session logs and visualizes them**.

OpenClaw session logs are JSONL files at `/home/eve/.openclaw/agents/*/sessions/*.jsonl`. Each line is a JSON event:
- `session` — session header (id, timestamp, cwd)
- `model_change` — model switches
- `thinking_level_change` — reasoning level switches  
- `message` — the meat: role (user/assistant), content (text/toolCall/thinking blocks), usage (tokens + costs), provider, model, stopReason, timestamp

We have 1,629 active sessions across 5 agents, ~260MB total. Rich data.

## Where does it fit?

**Agent household infrastructure.** This is pure operational visibility — understanding how the agents are used, what they cost, which tools they call most, where sessions get stuck. Daniel runs a 5-agent household and needs to see what's happening.

## What's the scoped MVP?

A **static dashboard** that pre-processes log files at build time into JSON summaries, then renders interactive charts and tables. No live log tailing — just a snapshot.

**Core views:**
1. **Overview** — total sessions, messages, tokens, cost across all agents. Per-agent breakdown cards.
2. **Session list** — filterable/sortable table of sessions with agent, message count, token usage, cost, duration, model(s) used
3. **Session detail** — timeline of a single session: messages, tool calls, thinking blocks, model switches. Token/cost per turn.
4. **Tool usage breakdown** — which tools get called most, by which agent
5. **Cost tracking** — daily/weekly cost by agent and model

**"Wow" element:** Per-agent color-coded cost sparklines and a tool call heatmap.

Since these are real logs on the filesystem, the build step will include a **data extraction script** that:
1. Walks `/home/eve/.openclaw/agents/*/sessions/*.jsonl`
2. Parses each session into a summary (agent, id, timestamps, message count, token totals, cost totals, models used, tool calls)
3. Writes a `data/sessions.json` manifest that the frontend reads at runtime

This keeps the frontend static (no Node server needed) while working with real data.

## Build tasks

1. **Data extraction script** (`scripts/extract.cjs`) — Node.js script that reads JSONL logs and produces `public/data/sessions.json` and `public/data/overview.json`
2. **Vite + React + Tailwind scaffold** with types for the data model
3. **Overview page** — agent cards, totals, sparklines
4. **Session list page** — table with sort/filter
5. **Session detail view** — timeline with tool calls and costs
6. **Build + deploy** — extract data → npm run build → deploy to Caddy

## Build Strategy

**`single`** — The data extraction script must run before the frontend can display anything. All views share the same data model. Tight coupling, sequential dependency. Estimated ~2-3h.
