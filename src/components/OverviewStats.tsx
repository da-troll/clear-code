import type { Overview } from '../types';
import { formatCost, formatTokens } from '../utils';

interface Props {
  overview: Overview;
}

export default function OverviewStats({ overview }: Props) {
  const stats = [
    { label: 'Total Sessions', value: overview.totalSessions.toLocaleString(), icon: '📋' },
    { label: 'Total Messages', value: overview.totalMessages.toLocaleString(), icon: '💬' },
    { label: 'Total Tokens', value: formatTokens(overview.totalTokens), icon: '🔤' },
    { label: 'Total Cost', value: formatCost(overview.totalCost), icon: '💰' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 text-center"
        >
          <div className="text-2xl mb-1">{stat.icon}</div>
          <div className="text-xl font-bold text-white">{stat.value}</div>
          <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
