import { useState, useMemo } from 'react';
import type { SessionSummary, AgentOverview } from '../types';
import { formatCost, formatTokens, formatDuration, formatDate, shortModel } from '../utils';

interface Props {
  sessions: SessionSummary[];
  agents: Record<string, AgentOverview>;
  onSelectSession: (session: SessionSummary) => void;
}

type SortKey = 'cost' | 'tokens' | 'messages' | 'duration' | 'date';

export default function SessionList({ sessions, agents, onSelectSession }: Props) {
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [sortDesc, setSortDesc] = useState(true);
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const filtered = useMemo(() => {
    let result = sessions;
    if (filterAgent !== 'all') {
      result = result.filter((s) => s.agentId === filterAgent);
    }
    result = [...result].sort((a, b) => {
      let diff = 0;
      switch (sortBy) {
        case 'cost': diff = a.cost - b.cost; break;
        case 'tokens': diff = a.tokens.total - b.tokens.total; break;
        case 'messages': diff = a.messageCount - b.messageCount; break;
        case 'duration': diff = a.durationMs - b.durationMs; break;
        case 'date': diff = (a.startTime || '').localeCompare(b.startTime || ''); break;
      }
      return sortDesc ? -diff : diff;
    });
    return result;
  }, [sessions, filterAgent, sortBy, sortDesc]);

  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(key);
      setSortDesc(true);
    }
    setPage(0);
  };

  const SortHeader = ({ label, sortKey }: { label: string; sortKey: SortKey }) => (
    <button
      onClick={() => handleSort(sortKey)}
      className={`text-[10px] uppercase tracking-wider font-semibold text-left ${
        sortBy === sortKey ? 'text-blue-400' : 'text-slate-500'
      } hover:text-slate-300 transition-colors`}
    >
      {label} {sortBy === sortKey ? (sortDesc ? '↓' : '↑') : ''}
    </button>
  );

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-slate-700/50 flex items-center gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-white">📋 Sessions ({filtered.length.toLocaleString()})</h3>
        <div className="flex gap-1 ml-auto">
          <button
            onClick={() => { setFilterAgent('all'); setPage(0); }}
            className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
              filterAgent === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          {Object.values(agents).map((a) => (
            <button
              key={a.id}
              onClick={() => { setFilterAgent(a.id); setPage(0); }}
              className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                filterAgent === a.id ? 'text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
              }`}
              style={filterAgent === a.id ? { backgroundColor: a.color } : undefined}
            >
              {a.emoji} {a.name}
            </button>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[auto_1fr_80px_80px_80px_80px_120px] gap-2 px-4 py-2 border-b border-slate-700/30">
        <div className="w-8" />
        <SortHeader label="Session" sortKey="date" />
        <SortHeader label="Messages" sortKey="messages" />
        <SortHeader label="Tokens" sortKey="tokens" />
        <SortHeader label="Cost" sortKey="cost" />
        <SortHeader label="Duration" sortKey="duration" />
        <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">Model</div>
      </div>

      {/* Rows */}
      <div className="max-h-[600px] overflow-y-auto">
        {paginated.map((session) => {
          const agent = agents[session.agentId];
          return (
            <button
              key={session.id}
              onClick={() => onSelectSession(session)}
              className="w-full grid grid-cols-[auto_1fr_80px_80px_80px_80px_120px] gap-2 px-4 py-2.5 border-b border-slate-800/50 hover:bg-slate-700/20 transition-colors text-left"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                style={{ backgroundColor: (agent?.color || '#6b7280') + '20' }}
              >
                {agent?.emoji || '🤖'}
              </div>
              <div className="min-w-0">
                <div className="text-xs text-slate-300 truncate font-mono">{session.id.slice(0, 12)}…</div>
                <div className="text-[10px] text-slate-500">{formatDate(session.startTime)}</div>
              </div>
              <div className="text-xs text-slate-300 self-center">{session.messageCount}</div>
              <div className="text-xs text-slate-300 self-center">{formatTokens(session.tokens.total)}</div>
              <div className="text-xs font-medium self-center" style={{ color: agent?.color || '#6b7280' }}>
                {formatCost(session.cost)}
              </div>
              <div className="text-xs text-slate-400 self-center">{formatDuration(session.durationMs)}</div>
              <div className="text-[10px] text-slate-500 self-center truncate">
                {session.models.map(shortModel).join(', ') || '—'}
              </div>
            </button>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-3 border-t border-slate-700/50 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="text-xs px-3 py-1 bg-slate-700 rounded-md disabled:opacity-30 text-white"
          >
            ← Prev
          </button>
          <span className="text-xs text-slate-500">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            className="text-xs px-3 py-1 bg-slate-700 rounded-md disabled:opacity-30 text-white"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
