import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PipelineState } from '../types';
import { ClaimCard } from '../components/ClaimCard';
import { HighlightedText } from '../components/HighlightedText';
import { AIBanner } from '../components/AIBanner';
import { DeepfakeBadge } from '../components/DeepfakeBadge';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export interface PipelineStats {
  total: number;
  trueCount: number;
  falseCount: number;
  partialCount: number;
  conflictingCount: number;
  unverifiableCount: number;
  accuracyPct: number;
}

interface ResultsPageProps {
  state: PipelineState;
  stats: PipelineStats;
  onReset: () => void;
}

export function ResultsPage({ state, stats, onReset }: ResultsPageProps) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const chartData = [
    { name: 'True', value: stats.trueCount, color: '#10b981' },
    { name: 'False', value: stats.falseCount, color: '#ef4444' },
    { name: 'Partial', value: stats.partialCount, color: '#f59e0b' },
    { name: 'Conflict', value: stats.conflictingCount, color: '#f97316' },
    { name: 'Unknown', value: stats.unverifiableCount, color: '#64748b' },
  ];

  const exportReportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ state, stats }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "veritai-report.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const fakeCount = state.deepfakes.filter(r => r.score > 0.7).length;

  return (
    <div className="space-y-6">
      {/* TOP BANNER CARD */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7c3aed] via-[#4f46e5] to-[#2563eb] p-8 md:p-10 shadow-lg shadow-[#7c3aed]/30"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-left flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white font-mono text-[11px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Verification Complete
            </div>
            <div className="mt-4 flex items-baseline gap-4">
              <h1 className="text-6xl font-bold text-white font-mono leading-none">
                {Math.round(stats.accuracyPct)}%
              </h1>
              <div className="flex flex-col">
                <span className="text-white/60 font-mono text-sm font-bold uppercase tracking-widest leading-none">Accuracy</span>
                <p className="text-white/80 text-sm mt-1">{stats.total} claims analyzed across multiple sources</p>
              </div>
            </div>
          </div>

          <div className="w-[110px] h-[110px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={34}
                  outerRadius={48}
                  paddingAngle={0}
                  dataKey="value"
                  stroke="none"
                  animationDuration={1500}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'True', val: stats.trueCount, sub: 'Confirmed claims', gradient: 'from-[#10b981] to-[#059669]', icon: '✓', shadow: 'shadow-emerald-500/30' },
          { label: 'False', val: stats.falseCount, sub: 'Contradicted claims', gradient: 'from-[#ef4444] to-[#dc2626]', icon: '✗', shadow: 'shadow-red-500/30' },
          { label: 'Partial', val: stats.partialCount, sub: 'Partially correct', gradient: 'from-[#f59e0b] to-[#d97706]', icon: '~', shadow: 'shadow-amber-500/30' },
          { label: 'Unknown', val: stats.unverifiableCount + stats.conflictingCount, sub: 'Unverifiable claims', gradient: 'from-[#64748b] to-[#475569]', icon: '?', shadow: 'shadow-slate-500/30' },
        ].map((stat, i) => (
          <div key={i} className={`card p-6 rounded-xl bg-gradient-to-br ${stat.gradient} text-white border-none shadow-lg ${stat.shadow} transition-transform hover:-translate-y-1`}>
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center font-bold text-2xl">
                {stat.icon}
              </div>
              <span className="text-[11px] font-mono text-white/50">{stat.sub}</span>
            </div>
            <h3 className="text-4xl font-bold font-mono">{stat.val}</h3>
            <span className="text-[12px] font-bold uppercase tracking-widest mt-1 block opacity-80">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-3 space-y-6">
          {/* ARTICLE ANALYSIS */}
          <div className="card h-fit">
            <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">Article Analysis</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">{stats.total} potential claims identified</p>
              </div>
              <div className="px-3 py-1 rounded-full bg-[var(--primary-light)] border border-[#7c3aed]/20 text-[#7c3aed] font-mono text-[10px] font-bold uppercase tracking-widest">
                ● Semantic Overlay
              </div>
            </div>
            <div className="p-10 leading-relaxed text-[var(--text-secondary)] text-[14px]">
              <HighlightedText 
                text={state.originalText || ''} 
                claims={state.claims} 
              />
            </div>
            <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-elevated)] flex flex-wrap gap-4 items-center">
              {[
                { label: 'True', color: 'bg-[#10b981]' },
                { label: 'False', color: 'bg-[#ef4444]' },
                { label: 'Partial', color: 'bg-[#f59e0b]' },
                { label: 'Conflict', color: 'bg-[#f97316]' },
                { label: 'Unknown', color: 'bg-[#64748b]' },
              ].map(tag => (
                <div key={tag.label} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-sm ${tag.color}`} />
                  <span className="text-[11px] text-[var(--text-muted)] font-medium">{tag.label}</span>
                </div>
              ))}
              <div className="ml-auto text-[11px] text-[var(--text-muted)] italic">
                Click highlighted text to view details
              </div>
            </div>
          </div>

          {/* CLAIM DETAILS */}
          <div className="card">
            <div className="px-6 py-5 border-b border-[var(--border)]">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Claim Details</h3>
            </div>
            <div className="p-4 space-y-2">
              <AnimatePresence>
                {state.claims.map((claim, i) => (
                  <ClaimCard key={claim.id} claim={claim} index={i} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI DETECTION */}
          {state.aiScore && <AIBanner score={state.aiScore} />}

          {/* MEDIA INTEGRITY */}
          <div className="card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Media Integrity Scan</h3>
              {fakeCount > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
                  {fakeCount} ALERT
                </div>
              )}
            </div>
            <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-widest block mb-4">VIT-NEURAL-SCAN V4.2</span>
            
            {state.deepfakes.length > 0 ? (
              <div className="space-y-4">
                {fakeCount > 0 && <p className="text-xs font-bold text-red-500">Anomalies Detected in media content</p>}
                <div className="grid grid-cols-2 gap-3">
                  {state.deepfakes.map((res, i) => (
                    <div key={i} className="relative aspect-[4/3] rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-elevated)]">
                      <img src={res.image_url} alt="Scan result" className="w-full h-full object-cover" />
                      <DeepfakeBadge score={res.score} type={res.type} />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed italic">
                  Powered by ViT on FaceForensics++ and MesoNet architectures.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-[var(--text-muted)] italic text-sm text-center border-2 border-dashed border-[var(--border)] rounded-xl">
                No external media attached to this article for analysis.
              </div>
            )}
          </div>

          {/* EXPORT REPORT */}
          <div className="card p-6">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Export Report</h3>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed mb-6">
              Download the complete verification report including all claims, evidence, and sources.
            </p>
            <div className="space-y-3">
              <button 
                onClick={exportReportJSON}
                className="w-full h-11 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white font-bold text-sm shadow-lg shadow-[#7c3aed]/30 hover:shadow-[#7c3aed]/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download JSON Report
              </button>
              <button 
                onClick={onReset}
                className="w-full h-11 rounded-lg bg-transparent border border-[var(--border)] text-[var(--text-secondary)] font-semibold text-sm hover:bg-[var(--bg-elevated)] hover:border-[var(--border-hover)] transition-all"
              >
                ← Verify Another Article
              </button>
            </div>
            <div className="mt-4 flex justify-center gap-4 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-bold">
              <span>E export</span>
              <span>F filter</span>
              <span>← go back</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
