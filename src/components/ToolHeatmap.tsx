interface Props {
  toolCalls: Record<string, number>;
}

export default function ToolHeatmap({ toolCalls }: Props) {
  const sorted = Object.entries(toolCalls)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  const maxCount = sorted[0]?.[1] || 1;

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-white mb-4">🔧 Tool Call Frequency</h3>
      <div className="space-y-1.5">
        {sorted.map(([tool, count]) => {
          const pct = (count / maxCount) * 100;
          return (
            <div key={tool} className="flex items-center gap-2">
              <div className="w-24 text-xs text-slate-400 truncate font-mono" title={tool}>
                {tool}
              </div>
              <div className="flex-1 bg-slate-900 rounded-full h-5 overflow-hidden">
                <div
                  className="h-full rounded-full flex items-center px-2 transition-all duration-500"
                  style={{
                    width: `${Math.max(pct, 3)}%`,
                    background: `linear-gradient(90deg, #3b82f6, ${pct > 70 ? '#8b5cf6' : '#06b6d4'})`,
                  }}
                >
                  <span className="text-[10px] text-white font-medium whitespace-nowrap">
                    {count.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
