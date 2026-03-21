import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  gradient: string;
  dotColor: string;
}

export function StatCard({ label, value, sub, icon, gradient, dotColor }: StatCardProps) {
  return (
    <div className="card p-5 relative transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className={`absolute -top-6 left-5 w-14 h-14 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shadow-black/10`}>
        {icon}
      </div>
      <div className="text-right">
        <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{label}</span>
        <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1 font-mono">{value}</h3>
      </div>
      <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className="text-[11px] text-[var(--text-muted)]">{sub}</span>
      </div>
    </div>
  );
}
