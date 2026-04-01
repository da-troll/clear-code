import { useState } from 'react';
import { useData } from './hooks/useData';
import type { SessionSummary } from './types';
import OverviewStats from './components/OverviewStats';
import AgentCard from './components/AgentCard';
import CostChart from './components/CostChart';
import ToolHeatmap from './components/ToolHeatmap';
import SessionList from './components/SessionList';
import SessionDetail from './components/SessionDetail';

type View = 'overview' | 'sessions';

export default function App() {
  const { overview, sessions, loading, error } = useData();
  const [view, setView] = useState<View>('overview');
  const [selectedSession, setSelectedSession] = useState<SessionSummary | null>(null);
  const [agentFilter, setAgentFilter] = useState<string>('all');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">📊</div>
          <div className="text-sm text-slate-400">Loading session data…</div>
        </div>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-400">
          <div className="text-4xl mb-3">⚠️</div>
          <div className="text-sm">{error || 'Failed to load data'}</div>
          <p className="text-xs text-slate-500 mt-2">Run <code className="bg-slate-800 px-1 rounded">node scripts/extract.cjs</code> to generate data.</p>
        </div>
      </div>
    );
  }

  const filteredSessions = agentFilter === 'all'
    ? sessions
    : sessions.filter((s) => s.agentId === agentFilter);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 sticky top-0 z-30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">📊</span>
            <div>
              <h1 className="text-sm font-bold text-white">Clear Code</h1>
              <p className="text-[10px] text-slate-500">OpenClaw Session Dashboard</p>
            </div>
          </div>

          <div className="flex gap-1">
            {(['overview', 'sessions'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`text-xs px-3 py-1.5 rounded-md transition-colors capitalize ${
                  view === v ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          <div className="text-[10px] text-slate-500">
            Generated {new Date(overview.generatedAt).toLocaleString('en-GB')}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {view === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <OverviewStats overview={overview} />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.values(overview.agents).map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onClick={() => {
                    setAgentFilter(agent.id);
                    setView('sessions');
                  }}
                />
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CostChart overview={overview} />
              <ToolHeatmap toolCalls={overview.toolCalls} />
            </div>
          </div>
        )}

        {view === 'sessions' && (
          <div className="animate-fade-in">
            <SessionList
              sessions={filteredSessions}
              agents={overview.agents}
              onSelectSession={setSelectedSession}
            />
          </div>
        )}
      </main>

      {/* Session detail modal */}
      {selectedSession && (
        <SessionDetail
          session={selectedSession}
          agent={overview.agents[selectedSession.agentId]}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}
