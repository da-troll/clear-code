#!/usr/bin/env node
/**
 * OpenClaw Session Log Extractor
 * Reads JSONL session logs from all agents and produces summary JSON for the dashboard.
 */

const fs = require('fs');
const path = require('path');

const AGENTS_DIR = '/home/eve/.openclaw/agents';
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'data');

const AGENT_META = {
  main:   { name: 'Eve',   emoji: '✨', color: '#8b5cf6', role: 'Personal assistant' },
  wilson: { name: 'Wilson', emoji: '🏐', color: '#3b82f6', role: 'Coding partner' },
  c3po:   { name: 'C-3PO', emoji: '🤖', color: '#f59e0b', role: 'Debug specialist' },
  pepper: { name: 'Pepper', emoji: '🌶️', color: '#ef4444', role: 'Email triage' },
  radar:  { name: 'Radar', emoji: '📡', color: '#10b981', role: 'Content curation' },
};

function parseSession(filePath, agentId) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n');
  
  let sessionId = path.basename(filePath, '.jsonl');
  let sessionStart = null;
  let sessionEnd = null;
  let messageCount = 0;
  let userMessages = 0;
  let assistantMessages = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheRead = 0;
  let totalCacheWrite = 0;
  let totalCost = 0;
  const models = new Set();
  const toolCalls = {};
  const turns = [];
  let thinkingLevel = null;

  for (const line of lines) {
    if (!line.trim()) continue;
    let event;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }

    if (event.type === 'session') {
      sessionId = event.id || sessionId;
      sessionStart = event.timestamp;
    }

    if (event.type === 'thinking_level_change') {
      thinkingLevel = event.thinkingLevel;
    }

    if (event.type === 'message' && event.message) {
      const msg = event.message;
      const ts = event.timestamp || msg.timestamp;
      if (!sessionStart) sessionStart = ts;
      sessionEnd = ts;

      if (msg.role === 'user') {
        userMessages++;
        messageCount++;
      } else if (msg.role === 'assistant') {
        assistantMessages++;
        messageCount++;

        if (msg.model) models.add(msg.model);

        // Usage
        if (msg.usage) {
          totalInputTokens += msg.usage.input || 0;
          totalOutputTokens += msg.usage.output || 0;
          totalCacheRead += msg.usage.cacheRead || 0;
          totalCacheWrite += msg.usage.cacheWrite || 0;
          if (msg.usage.cost) {
            totalCost += msg.usage.cost.total || 0;
          }
        }

        // Tool calls
        if (Array.isArray(msg.content)) {
          for (const block of msg.content) {
            if (block.type === 'toolCall' && block.name) {
              toolCalls[block.name] = (toolCalls[block.name] || 0) + 1;
            }
          }
        }

        // Turn summary for detail view (keep compact)
        const turnToolCalls = [];
        let hasThinking = false;
        let textPreview = '';
        if (Array.isArray(msg.content)) {
          for (const block of msg.content) {
            if (block.type === 'toolCall') {
              turnToolCalls.push(block.name);
            } else if (block.type === 'thinking') {
              hasThinking = true;
            } else if (block.type === 'text' && !textPreview) {
              textPreview = (block.text || '').slice(0, 200);
            }
          }
        }

        turns.push({
          role: msg.role,
          ts: typeof ts === 'string' ? ts : new Date(ts).toISOString(),
          model: msg.model || null,
          tokens: msg.usage ? (msg.usage.input || 0) + (msg.usage.output || 0) : 0,
          cost: msg.usage?.cost?.total || 0,
          tools: turnToolCalls,
          thinking: hasThinking,
          preview: textPreview,
        });
      } else if (msg.role === 'user') {
        let textPreview = '';
        if (Array.isArray(msg.content)) {
          for (const block of msg.content) {
            if (block.type === 'text' && !textPreview) {
              textPreview = (block.text || '').slice(0, 200);
            }
          }
        } else if (typeof msg.content === 'string') {
          textPreview = msg.content.slice(0, 200);
        }
        turns.push({
          role: 'user',
          ts: typeof ts === 'string' ? ts : new Date(ts).toISOString(),
          model: null,
          tokens: 0,
          cost: 0,
          tools: [],
          thinking: false,
          preview: textPreview,
        });
      }
    }
  }

  // Skip empty sessions
  if (messageCount === 0) return null;

  const startDate = sessionStart ? new Date(sessionStart) : null;
  const endDate = sessionEnd ? new Date(sessionEnd) : null;
  const durationMs = startDate && endDate ? endDate.getTime() - startDate.getTime() : 0;

  return {
    id: sessionId,
    agentId,
    startTime: sessionStart,
    endTime: sessionEnd,
    durationMs,
    messageCount,
    userMessages,
    assistantMessages,
    tokens: {
      input: totalInputTokens,
      output: totalOutputTokens,
      cacheRead: totalCacheRead,
      cacheWrite: totalCacheWrite,
      total: totalInputTokens + totalOutputTokens + totalCacheRead + totalCacheWrite,
    },
    cost: Math.round(totalCost * 10000) / 10000,
    models: [...models],
    toolCalls,
    thinkingLevel,
    turns,
  };
}

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const allSessions = [];
  const agentOverviews = {};
  const toolCallsGlobal = {};
  const dailyCosts = {};
  let totalCost = 0;
  let totalTokens = 0;
  let totalMessages = 0;

  const agentIds = fs.readdirSync(AGENTS_DIR).filter(d => {
    return fs.statSync(path.join(AGENTS_DIR, d)).isDirectory();
  });

  for (const agentId of agentIds) {
    const sessionsDir = path.join(AGENTS_DIR, agentId, 'sessions');
    if (!fs.existsSync(sessionsDir)) continue;

    const files = fs.readdirSync(sessionsDir).filter(f => f.endsWith('.jsonl'));
    let agentCost = 0;
    let agentTokens = 0;
    let agentMessages = 0;
    let agentSessions = 0;

    for (const file of files) {
      try {
        const session = parseSession(path.join(sessionsDir, file), agentId);
        if (!session) continue;

        // Keep turns only for top 100 sessions by cost (to limit data size)
        allSessions.push(session);

        agentCost += session.cost;
        agentTokens += session.tokens.total;
        agentMessages += session.messageCount;
        agentSessions++;

        // Aggregate tool calls
        for (const [tool, count] of Object.entries(session.toolCalls)) {
          toolCallsGlobal[tool] = (toolCallsGlobal[tool] || 0) + count;
        }

        // Daily cost aggregation
        if (session.startTime) {
          const day = new Date(session.startTime).toISOString().slice(0, 10);
          if (!dailyCosts[day]) dailyCosts[day] = {};
          if (!dailyCosts[day][agentId]) dailyCosts[day][agentId] = 0;
          dailyCosts[day][agentId] += session.cost;
        }
      } catch (err) {
        console.error(`Error parsing ${file}: ${err.message}`);
      }
    }

    totalCost += agentCost;
    totalTokens += agentTokens;
    totalMessages += agentMessages;

    const meta = AGENT_META[agentId] || { name: agentId, emoji: '🤖', color: '#6b7280', role: 'Agent' };
    agentOverviews[agentId] = {
      ...meta,
      id: agentId,
      sessions: agentSessions,
      messages: agentMessages,
      tokens: agentTokens,
      cost: Math.round(agentCost * 10000) / 10000,
    };
  }

  // Sort sessions by cost desc, keep turns only for top 200
  allSessions.sort((a, b) => b.cost - a.cost);
  const sessionsForExport = allSessions.map((s, i) => {
    if (i >= 200) {
      const { turns, ...rest } = s;
      return rest;
    }
    return s;
  });

  // Sort daily costs
  const sortedDays = Object.keys(dailyCosts).sort();
  const dailyCostArray = sortedDays.map(day => ({
    date: day,
    ...dailyCosts[day],
    total: Object.values(dailyCosts[day]).reduce((a, b) => a + b, 0),
  }));

  // Overview
  const overview = {
    generatedAt: new Date().toISOString(),
    totalSessions: allSessions.length,
    totalMessages,
    totalTokens,
    totalCost: Math.round(totalCost * 10000) / 10000,
    agents: agentOverviews,
    toolCalls: toolCallsGlobal,
    dailyCosts: dailyCostArray.slice(-30), // Last 30 days
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'overview.json'),
    JSON.stringify(overview, null, 2)
  );

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'sessions.json'),
    JSON.stringify(sessionsForExport)
  );

  console.log(`✅ Extracted ${allSessions.length} sessions across ${Object.keys(agentOverviews).length} agents`);
  console.log(`   Total cost: $${overview.totalCost.toFixed(4)}`);
  console.log(`   Total tokens: ${(totalTokens / 1e6).toFixed(1)}M`);
  console.log(`   Output: ${OUTPUT_DIR}/`);
}

main();
