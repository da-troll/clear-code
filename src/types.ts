export interface AgentOverview {
  id: string;
  name: string;
  emoji: string;
  color: string;
  role: string;
  sessions: number;
  messages: number;
  tokens: number;
  cost: number;
}

export interface DailyCost {
  date: string;
  total: number;
  [agentId: string]: string | number; // date is string, rest are numbers
}

export interface Overview {
  generatedAt: string;
  totalSessions: number;
  totalMessages: number;
  totalTokens: number;
  totalCost: number;
  agents: Record<string, AgentOverview>;
  toolCalls: Record<string, number>;
  dailyCosts: DailyCost[];
}

export interface SessionTurn {
  role: string;
  ts: string;
  model: string | null;
  tokens: number;
  cost: number;
  tools: string[];
  thinking: boolean;
  preview: string;
}

export interface SessionSummary {
  id: string;
  agentId: string;
  startTime: string | null;
  endTime: string | null;
  durationMs: number;
  messageCount: number;
  userMessages: number;
  assistantMessages: number;
  tokens: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    total: number;
  };
  cost: number;
  models: string[];
  toolCalls: Record<string, number>;
  thinkingLevel: string | null;
  turns?: SessionTurn[];
}
