import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PipelineStepper } from '../components/PipelineStepper';
import { SkeletonGroup } from '../components/SkeletonCard';
import { ClaimCard } from '../components/ClaimCard';
import { AIBanner } from '../components/AIBanner';
import { PipelineState } from '../types';

interface AnalysisPageProps {
  state: PipelineState;
  onAddToast?: (v: string, t: string) => void;
}

export function AnalysisPage({ state, onAddToast }: AnalysisPageProps) {
  const previousVerifiedCount = useRef(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      if (state.stage === 'complete') {
        clearInterval(interval);
      } else {
        setElapsed((Date.now() - start) / 1000);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [state.stage]);

  useEffect(() => {
    const verifiedClaims = state.claims.filter(c => !!c.verdict);
    if (verifiedClaims.length > previousVerifiedCount.current) {
      const newest = verifiedClaims[verifiedClaims.length - 1];
      onAddToast?.(newest.verdict!, newest.text.slice(0, 60));
      previousVerifiedCount.current = verifiedClaims.length;
    }
  }, [state.claims, onAddToast]);

  const verifiedCount = state.claims.filter(c => !!c.verdict).length;
  const trueCount = state.claims.filter(c => c.verdict === 'True').length;
  const falseCount = state.claims.filter(c => c.verdict === 'False').length;
  const partialCount = state.claims.filter(c => c.verdict === 'Partially True').length;

  return (
    <div className="max-w-[1200px] mx-auto p-6 space-y-6">
      {/* PIPELINE PROGRESS CARD */}
      <div className="card p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h3 className="font-heading font-semibold text-xl text-[var(--text-primary)]">Analyzing Claims</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">Extracting and verifying factual statements in real-time</p>
          </div>
          <div className="flex items-center gap-4 bg-[var(--bg-elevated)] px-6 py-3 rounded-2xl border border-[var(--border)]">
            <div className="text-right">
              <div className="font-mono text-2xl font-bold text-[var(--text-primary)] leading-none">{elapsed.toFixed(1)}s</div>
              <div className="font-mono text-[9px] text-[var(--text-muted)] uppercase tracking-widest mt-1">Elapsed Time</div>
            </div>
            <div className="w-px h-8 bg-[var(--border)]" />
            <div className="text-right">
              <div className="font-mono text-2xl font-bold text-[var(--primary)] leading-none">{state.claims_done}/{state.claims_total || '?'}</div>
              <div className="font-mono text-[9px] text-[var(--text-muted)] uppercase tracking-widest mt-1">Claims Verified</div>
            </div>
          </div>
        </div>

        <PipelineStepper 
          stage={state.stage} 
          progress={state.progress} 
          claimsTotal={state.claims_total} 
          claimsDone={state.claims_done} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Live Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card pb-6">
            <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-heading font-semibold text-base text-[var(--text-primary)]">Live Claims Feed</h3>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary-light)] border border-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-mono font-bold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
                {verifiedCount} Verified
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <AnimatePresence mode="popLayout">
                {state.claims.length > 0 ? (
                  state.claims.map((c, i) => (
                    <ClaimCard key={c.id} claim={c} index={i} />
                  ))
                ) : (
                  <SkeletonGroup count={3} />
                )}
                
                {state.stage === 'searching' && state.claims_total > state.claims.length && (
                  <SkeletonGroup count={1} />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* RIGHT: Live Stats */}
        <div className="space-y-6">
          <div className="card">
            <div className="px-6 py-5 border-b border-[var(--border)]">
              <h3 className="font-heading font-semibold text-sm text-[var(--text-primary)]">Live Statistics</h3>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Extracted Claims', val: state.claims_total, color: 'text-[var(--primary)]' },
                { label: 'Completed Checks', val: state.claims_done, color: 'text-emerald-500' },
                { label: 'Pending Queue', val: state.claims_total - state.claims_done, color: 'text-amber-500' }
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)]">{row.label}</span>
                  <span className={`font-heading font-bold text-lg ${row.color}`}>{row.val || 0}</span>
                </div>
              ))}
              
              <div className="h-px bg-[var(--border)] my-2" />
              
              <div className="space-y-3">
                <div className="text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-widest">Verdict Breakdown</div>
                {[
                  { label: 'True', val: trueCount, color: 'bg-[#10b981]' },
                  { label: 'False', val: falseCount, color: 'bg-[#ef4444]' },
                  { label: 'Partial', val: partialCount, color: 'bg-[#f59e0b]' }
                ].map(verdict => (
                  <div key={verdict.label} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${verdict.color}`} />
                    <span className="text-xs text-[var(--text-secondary)] flex-1">{verdict.label}</span>
                    <span className="font-mono text-xs font-bold text-[var(--text-primary)]">{verdict.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {state.aiScore && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card border-none bg-gradient-to-br from-[#8b5cf6] to-[#7c3aed] p-6 text-white"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="font-heading font-bold text-base">AI Text Score</h3>
                </div>
                
                <AIBanner score={state.aiScore} isCompact />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
