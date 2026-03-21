import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PipelineState, Verdict } from '../types';
import { ClaimCard } from '../components/ClaimCard';
import { HighlightedText } from '../components/HighlightedText';
import { VerdictFilter } from '../components/VerdictFilter';
import { AIBanner } from '../components/AIBanner';
import { DeepfakeSection } from '../components/DeepfakeBadge';
import { exportReportJSON } from '../utils';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface ResultsPageProps {
  state: PipelineState;
  stats: {
    total: number;
    accuracyPct: number;
    trueCount: number;
    falseCount: number;
    partialCount: number;
    conflictingCount: number;
    unverifiableCount: number;
  };
  onReset: () => void;
}

export function ResultsPage({ state, stats, onReset }: ResultsPageProps) {
  const [filter, setFilter] = useState<Verdict | "All">("All");
  const { claims, originalText, aiScore, deepfakes } = state;

  const counts: Partial<Record<Verdict | "All", number>> = useMemo(() => {
    const acc: Record<string, number> = { "All": claims.length };
    claims.forEach(c => {
      const v = c.verdict || "Unverifiable";
      acc[v] = (acc[v] || 0) + 1;
    });
    return acc;
  }, [claims]);

  const filteredClaims = useMemo(() => {
    if (filter === "All") return claims;
    return claims.filter((c) => (c.verdict || "Unverifiable") === filter);
  }, [claims, filter]);

  const chartData = [
    { name: 'True', value: stats.trueCount, color: '#10b981' },
    { name: 'False', value: stats.falseCount, color: '#ef4444' },
    { name: 'Partial', value: stats.partialCount, color: '#f59e0b' },
    { name: 'Unknown', value: stats.conflictingCount + stats.unverifiableCount, color: '#64748b' },
  ].filter(d => d.value > 0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E') {
        exportReportJSON({ state, stats }, 'veritai_report.json');
      }
      if (e.key === 'f' || e.key === 'F') {
        setFilter("All");
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, stats]);

  return (
    <div className="max-w-[1200px] mx-auto p-6 space-y-6">
      {/* SUMMARY BANNER */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#7c3aed] via-[#4f46e5] to-[#2563eb] p-8 md:p-10 shadow-lg"
      >
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-mono font-bold uppercase tracking-wider mb-4 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Verification Complete
            </span>
            <div className="flex items-baseline gap-3 justify-center md:justify-start">
              <h1 className="font-heading font-bold text-5xl text-white tracking-tight">
                {Math.round(stats.accuracyPct)}%
              </h1>
              <span className="text-white/60 font-heading font-semibold text-lg uppercase tracking-widest">Accuracy</span>
            </div>
            <p className="text-white/70 text-sm mt-2 font-mono">
              {stats.total} claims analyzed across multiple sources
            </p>
          </div>

          <div className="w-[120px] h-[120px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* STATS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'True', val: stats.trueCount, bg: 'from-[#10b981] to-[#059669]', icon: <path d="M5 13l4 4L19 7" /> },
          { label: 'False', val: stats.falseCount, bg: 'from-[#ef4444] to-[#dc2626]', icon: <path d="M6 18L18 6M6 6l12 12" /> },
          { label: 'Partial', val: stats.partialCount, bg: 'from-[#f59e0b] to-[#d97706]', icon: <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> },
          { label: 'Unknown', val: stats.conflictingCount + stats.unverifiableCount, bg: 'from-[#64748b] to-[#475569]', icon: <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`card relative p-5 bg-gradient-to-br ${stat.bg} border-none group cursor-default shadow-md overflow-hidden`}
          >
            <div className="relative z-10 flex flex-col items-center">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="font-heading font-bold text-3xl text-white"
              >
                {stat.val}
              </motion.div>
              <div className="font-mono text-[10px] text-white/70 uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
            <div className="absolute top-0 right-0 p-2 opacity-10">
               <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">{stat.icon}</svg>
            </div>
            <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-white/5 rounded-full blur-xl" />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* Article Analysis */}
          {originalText && (
            <div className="card">
              <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-base text-[var(--text-primary)]">Article Analysis</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{claims.length} potential claims identified</p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--primary-light)] border border-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-mono font-bold uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                  Semantic Overlay
                </div>
              </div>
              <div className="p-6">
                <HighlightedText 
                  text={originalText} 
                  claims={claims} 
                  onClaimClick={(id) => {
                    const el = document.getElementById("claim-" + id);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      el.classList.add('ring-2', 'ring-[var(--primary)]/50', 'ring-offset-4', 'ring-offset-[var(--bg-surface)]', 'transition-all');
                      setTimeout(() => el.classList.remove('ring-2', 'ring-[var(--primary)]/50', 'ring-offset-4', 'ring-offset-[var(--bg-surface)]'), 2500);
                    }
                  }} 
                />
                <div className="mt-6 pt-6 border-t border-[var(--border)] flex flex-wrap gap-4">
                  {[
                    { label: 'True', color: 'bg-[#10b981]' },
                    { label: 'False', color: 'bg-[#ef4444]' },
                    { label: 'Partial', color: 'bg-[#f59e0b]' },
                    { label: 'Other', color: 'bg-[#64748b]' }
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${item.color} opacity-40`} />
                      <span className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">{item.label}</span>
                    </div>
                  ))}
                  <p className="ml-auto text-[10px] italic text-[var(--text-muted)]">Click highlighted text to view claim details</p>
                </div>
              </div>
            </div>
          )}

          {/* Claims List */}
          <div className="card">
            <div className="px-6 py-5 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="font-heading font-semibold text-base text-[var(--text-primary)]">Claim Details</h3>
              <VerdictFilter active={filter} onChange={(v) => setFilter(v)} counts={counts} />
            </div>
            
            <div className="p-6 space-y-4">
              <AnimatePresence mode="popLayout">
                {filteredClaims.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-12 text-center border-2 border-dashed border-[var(--border)] rounded-2xl">
                    <p className="text-xs text-[var(--text-muted)] font-mono uppercase tracking-widest leading-loose">
                      No claims match current filter<br />
                      <button onClick={() => setFilter('All')} className="text-[var(--primary)] font-bold hover:underline mt-2">Reset Filters</button>
                    </p>
                  </motion.div>
                ) : (
                  filteredClaims.map((c, i) => (
                    <div id={"claim-" + c.id} key={c.id}>
                      <ClaimCard claim={c} index={i} />
                    </div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* AI Detection */}
          {aiScore && (
            <div className="card">
              <div className="px-6 py-5 border-b border-[var(--border)]">
                <h3 className="font-heading font-semibold text-sm text-[var(--text-primary)]">AI Content Detection</h3>
              </div>
              <div className="p-6">
                <AIBanner score={aiScore} />
                <div className="mt-4 p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)]">
                  <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                    Our model analyzes linguistic patterns and perplexity to determine if the text was likely generated by an LLM (Gemini, GPT-4, etc).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Media Integrity */}
          {deepfakes && deepfakes.length > 0 && (
            <div className="card">
              <div className="px-6 py-5 border-b border-[var(--border)]">
                <h3 className="font-heading font-semibold text-sm text-[var(--text-primary)]">Media Integrity Scan</h3>
              </div>
              <div className="p-6">
                <DeepfakeSection deepfakes={deepfakes} />
              </div>
            </div>
          )}

          {/* Export & Actions */}
          <div className="card bg-[var(--bg-elevated)]/50">
            <div className="px-6 py-5 border-b border-[var(--border)]">
              <h3 className="font-heading font-semibold text-sm text-[var(--text-primary)]">Export Report</h3>
            </div>
            <div className="p-6 space-y-3">
              <button 
                onClick={() => exportReportJSON({ state, stats }, 'veritai_report.json')}
                className="w-full h-11 rounded-xl bg-gradient-to-br from-[#7733ff] to-[#5511ee] text-white font-heading font-semibold text-xs shadow-md hover:shadow-lg transition-all"
              >
                Download JSON Report
              </button>
              <button className="w-full h-11 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] font-heading font-semibold text-xs hover:bg-[var(--bg-hover)] transition-all">
                Copy Permanent Link
              </button>
              <div className="flex justify-center gap-4 mt-2 font-mono text-[9px] text-[var(--text-muted)] uppercase tracking-wider">
                <span>[E] Export</span>
                <span>[F] Reset Filters</span>
              </div>
            </div>
          </div>

          <button 
            onClick={onReset}
            className="w-full h-14 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] font-heading font-bold text-xs uppercase tracking-[0.15em] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-all"
          >
            ← Start New Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
