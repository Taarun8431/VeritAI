interface VerdictFilterProps {
  current: string;
  setFilter: (v: string) => void;
  counts: Record<string, number>;
}

export function VerdictFilter({ current, setFilter, counts }: VerdictFilterProps) {
  const options = [
    { id: 'all', label: 'All', color: 'var(--text-primary)' },
    { id: 'True', label: 'True', color: '#10b981' },
    { id: 'False', label: 'False', color: '#ef4444' },
    { id: 'Partially True', label: 'Partial', color: '#f59e0b' },
    { id: 'Conflicting', label: 'Conflict', color: '#f97316' },
    { id: 'Unverifiable', label: 'Unknown', color: '#64748b' },
  ];

  return (
    <div className="flex flex-wrap gap-1.5 p-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg">
      {options.map(opt => {
        const active = current === opt.id;
        const count = opt.id === 'all' 
          ? Object.values(counts).reduce((acc: number, val: number) => acc + val, 0) 
          : counts[opt.id] || 0;
        
        return (
          <button
            key={opt.id}
            onClick={() => setFilter(opt.id)}
            className={`
              px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all
              ${active 
                ? 'bg-[var(--bg-card)] shadow-sm text-[#7c3aed] border border-[#7c3aed]/20' 
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card)]/50'}
            `}
            style={active ? { borderColor: `${opt.color}44`, color: opt.color } : {}}
          >
            {opt.label}
            <span className="ml-1.5 opacity-50 font-mono">{count}</span>
          </button>
        );
      })}
    </div>
  );
}
