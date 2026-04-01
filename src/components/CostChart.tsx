import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import type { Overview } from '../types';

interface Props {
  overview: Overview;
}

const AGENT_COLORS: Record<string, string> = {
  main: '#8b5cf6',
  wilson: '#3b82f6',
  c3po: '#f59e0b',
  pepper: '#ef4444',
  radar: '#10b981',
};

const AGENT_NAMES: Record<string, string> = {
  main: 'Eve',
  wilson: 'Wilson',
  c3po: 'C-3PO',
  pepper: 'Pepper',
  radar: 'Radar',
};

export default function CostChart({ overview }: Props) {
  const data = overview.dailyCosts.map((d) => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
  }));

  const agentIds = Object.keys(overview.agents);

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-4">💰 Daily Cost (Last 30 Days)</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v.toFixed(1)}`} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: unknown, name: unknown) => [
              `$${Number(value || 0).toFixed(4)}`,
              AGENT_NAMES[String(name)] || String(name),
            ]}
          />
          {agentIds.map((id) => (
            <Area
              key={id}
              type="monotone"
              dataKey={id}
              stackId="1"
              stroke={AGENT_COLORS[id] || '#6b7280'}
              fill={AGENT_COLORS[id] || '#6b7280'}
              fillOpacity={0.4}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
