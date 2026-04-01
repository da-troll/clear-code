import type { SessionSummary, AgentOverview } from '../types';
import { formatCost, formatTokens, formatDuration, shortModel } from '../utils';

interface Props {
  session: SessionSummary;
  agent: AgentOverview | undefined;
  onClose: () => void;
}

export default function SessionDetail({ session, agent, onClose }: Props) {
  const topTools = Object.entries(session.toolCalls)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-4xl shadow-2xl animate-fade-in mx-4">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{ backgroundColor: (agent?.color || '#6b7280') + '20', border: `2px solid ${agent?.color || '#6b7280'}` }}
            >
              {agent?.emoji || '🤖'}
            </div>
            <div>
              <div className="font-bold text-white text-sm">{agent?.name || session.agentId}</div>
              <div className="text-xs text-slate-500 font-mono">{session.id}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors text-lg px-2"
          >
            ✕
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-4 border-b border-slate-700/50">
          {[
            { label: 'Messages', value: session.messageCount.toString() },
            { label: 'Tokens', value: formatTokens(session.tokens.total) },
            { label: 'Cost', value: formatCost(session.cost) },
            { label: 'Duration', value: formatDuration(session.durationMs) },
            { label: 'Model(s)', value: session.models.map(shortModel).join(', ') || '—' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-[10px] uppercase text-slate-500 tracking-wider">{s.label}</div>
              <div className="text-sm font-semibold text-white mt-0.5">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Tool calls */}
        {topTools.length > 0 && (
          <div className="px-4 py-3 border-b border-slate-700/50">
            <div className="text-[10px] uppercase text-slate-500 tracking-wider mb-2">Tool Calls</div>
            <div className="flex flex-wrap gap-1.5">
              {topTools.map(([tool, count]) => (
                <span key={tool} className="text-[10px] px-2 py-1 rounded-full bg-slate-700 text-slate-300 font-mono">
                  {tool} <span className="text-slate-500">×{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Turn timeline */}
        {session.turns && session.turns.length > 0 ? (
          <div className="max-h-[500px] overflow-y-auto p-4">
            <div className="text-[10px] uppercase text-slate-500 tracking-wider mb-3">Timeline ({session.turns.length} turns)</div>
            <div className="space-y-2">
              {session.turns.map((turn, i) => {
                const time = new Date(turn.ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const isUser = turn.role === 'user';
                return (
                  <div
                    key={i}
                    className={`flex gap-3 ${isUser ? 'pl-0' : 'pl-6'}`}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${
                          isUser ? 'bg-slate-700 text-slate-300' : 'text-white'
                        }`}
                        style={!isUser ? { backgroundColor: (agent?.color || '#6b7280') + '40' } : undefined}
                      >
                        {isUser ? '👤' : agent?.emoji || '🤖'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-slate-500">{time}</span>
                        {turn.model && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 font-mono">
                            {shortModel(turn.model)}
                          </span>
                        )}
                        {turn.thinking && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-400">
                            🧠 thinking
                          </span>
                        )}
                        {turn.tools.length > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-400">
                            🔧 {turn.tools.join(', ')}
                          </span>
                        )}
                        {turn.cost > 0 && (
                          <span className="text-[10px] text-slate-500">
                            {formatCost(turn.cost)} · {formatTokens(turn.tokens)}
                          </span>
                        )}
                      </div>
                      {turn.preview && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{turn.preview}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-500">
            Turn-level detail not available for this session.
          </div>
        )}
      </div>
    </div>
  );
}
