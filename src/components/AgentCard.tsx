import type { AgentOverview } from '../types';
import { formatCost, formatTokens } from '../utils';

interface Props {
  agent: AgentOverview;
  onClick?: () => void;
}

export default function AgentCard({ agent, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-left hover:bg-slate-700/40 hover:border-slate-600 transition-all duration-200 group"
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ backgroundColor: agent.color + '20', border: `2px solid ${agent.color}` }}
        >
          {agent.emoji}
        </div>
        <div>
          <div className="font-bold text-white text-sm">{agent.name}</div>
          <div className="text-xs text-slate-500">{agent.role}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[10px] uppercase text-slate-500 tracking-wider">Sessions</div>
          <div className="text-sm font-semibold text-white">{agent.sessions.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-slate-500 tracking-wider">Messages</div>
          <div className="text-sm font-semibold text-white">{agent.messages.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-slate-500 tracking-wider">Tokens</div>
          <div className="text-sm font-semibold text-white">{formatTokens(agent.tokens)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-slate-500 tracking-wider">Cost</div>
          <div className="text-sm font-semibold" style={{ color: agent.color }}>{formatCost(agent.cost)}</div>
        </div>
      </div>
    </button>
  );
}
