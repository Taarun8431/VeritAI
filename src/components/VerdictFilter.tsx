import { Verdict } from '../types';

type FilterOption = "All" | Verdict;

export function VerdictFilter({ 
  active, 
  onChange,
  counts
}: { 
  active: FilterOption, 
  onChange: (v: FilterOption) => void,
  counts: Partial<Record<FilterOption, number>>
}) {
  const options: FilterOption[] = ["All", "True", "False", "Partially True", "Conflicting", "Unverifiable", "Temporally Uncertain"];
  
  const COLORS: Record<string, string> = {
    "All": "var(--primary)",
    "True": "var(--verdict-true)",
    "False": "var(--verdict-false)",
    "Partially True": "var(--verdict-partial)",
    "Conflicting": "var(--verdict-conflict)",
    "Unverifiable": "var(--text-muted)",
    "Temporally Uncertain": "var(--verdict-temporal)"
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {options.map(opt => {
        const count = counts[opt] || 0;
        if (opt !== "All" && count === 0) return null;
        
        const isActive = active === opt;
        const color = COLORS[opt] || "var(--primary)";

        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border flex items-center gap-2 ${
              isActive 
                ? `bg-background border-primary text-primary shadow-sm dark:border-primary/40` 
                : `bg-elevated border-border text-text-muted hover:border-border-hover hover:text-text-secondary`
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-full transition-all`} style={{ backgroundColor: isActive ? color : 'var(--border)' }} />
            {opt}
            <span className={`min-w-[16px] px-1 rounded-md text-[9px] font-mono transition-all ${
               isActive ? 'bg-primary/10 text-primary' : 'bg-background text-text-muted'
            }`}>
              {count}
            </span>
          </button>
        )
      })}
    </div>
  );
}
