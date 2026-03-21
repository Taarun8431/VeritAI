import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PipelineState } from '../types';
import { ClaimCard } from '../components/ClaimCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { AIBanner } from '../components/AIBanner';

interface AnalysisPageProps {
  state: PipelineState;
}

export function AnalysisPage({ state }: AnalysisPageProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { id: 'extracting', label: 'Extracting Claims', icon: '🔍' },
    { id: 'searching', label: 'Searching Evidence', icon: '🌐' },
    { id: 'verifying', label: 'Verifying', icon: '🛡️' }
  ];

  const currentStepIndex = 
    state.stage === 'extracting' ? 0 :
    state.stage === 'searching' ? 1 : 2;

  const verifiedCount = state.claims.filter(c => c.status === 'verified').length;
  const progress = Math.min(100, (verifiedCount / (state.claims_total || 1)) * 100);

  return (
    <div className="space-y-6">
      {/* PIPELINE CARD */}
      <div className="card p-8 md:p-10 mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start mb-10">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Analyzing Claims</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">Extracting and verifying factual statements in real-time</p>
          </div>
          <div className="mt-4 md:mt-0 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl py-2 px-6 flex flex-col items-center shadow-inner">
            <span className="font-mono text-2xl font-bold text-[var(--text-primary)]">
              {elapsed}s
            </span>
            <span className="font-mono text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest">Elapsed</span>
          </div>
        </div>

        {/* 3-STEP STEPPER */}
        <div className="relative max-w-4xl mx-auto px-10">
          <div className="absolute top-6 left-10 right-10 h-[2px] bg-[var(--border)] z-0" />
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
            className="absolute top-6 left-10 h-[2px] bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] z-0"
          />

          <div className="flex justify-between items-start relative z-10">
            {steps.map((step, i) => {
              const isDone = i < currentStepIndex || state.stage === 'complete';
              const isActive = i === currentStepIndex && state.stage !== 'complete';
              return (
                <div key={step.id} className="flex flex-col items-center gap-4">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-mono font-bold text-lg
                    transition-all duration-300
                    ${isDone ? 'bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white shadow-lg shadow-[#7c3aed]/40' :
                      isActive ? 'bg-[#7c3aed]/10 border-2 border-[#7c3aed] text-[#7c3aed] shadow-[0_0_15px_rgba(124,58,237,0.3)] animate-pulse-ring' :
                      'bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]'}
                  `}>
                    {isDone ? (
                      <motion.svg initial={{ scale: 0.5 }} animate={{ scale: 1.2 }} className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </motion.svg>
                    ) : (
                      isActive ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : (i + 1)
                    )}
                  </div>
                  <span className={`text-xs font-bold uppercase tracking-wide ${isActive ? 'text-[#7c3aed]' : isDone ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* PROGRESS BAR SECTION */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="flex justify-between items-end mb-2">
            <span className="font-mono text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Analysis Progress</span>
            <span className="font-mono text-xs font-bold text-[#7c3aed]">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden border border-[var(--border)]">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-[#7c3aed] via-[#4f46e5] to-[#2563eb]"
            />
          </div>
          <div className="flex justify-between mt-3 px-1">
            <span className="font-mono text-[10px] text-[var(--text-muted)]">{state.claims.length} claims extracted</span>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">{verifiedCount} of {state.claims_total || '?'} verified</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT: Live Feed */}
        <div className="lg:col-span-3 card flex flex-col min-h-[500px]">
          <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-center">
            <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-3">
              Live Claims Feed
              <div className="px-2.5 py-0.5 rounded-full bg-[#7c3aed]/10 text-[#7c3aed] text-[10px] font-mono font-bold flex items-center gap-1.5 border border-[#7c3aed]/20">
                <span className="w-1.5 h-1.5 bg-[#7c3aed] rounded-full animate-pulse" />
                {verifiedCount} VERIFIED
              </div>
            </h3>
          </div>
          <div className="p-6 overflow-y-auto max-h-[800px]">
            <AnimatePresence>
              {state.claims.length === 0 ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {state.claims.map((claim, i) => (
                    <ClaimCard key={claim.id} claim={claim} index={i} />
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT: Live Stats */}
        <div className="flex flex-col gap-6">
          <div className="card">
            <div className="px-5 py-4 border-b border-[var(--border)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">Live Statistics</h3>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'Extracted', val: state.claims.length, color: 'text-[#7c3aed]' },
                { label: 'Verified', val: verifiedCount, color: 'text-emerald-500' },
                { label: 'Pending', val: state.claims.filter(c => c.status === 'searching').length, color: 'text-amber-500' },
                { label: 'Failed', val: state.claims.filter(c => c.status === 'pending').length, color: 'text-red-500' },
              ].map((stat, i) => (
                <div key={i} className={`flex justify-between items-center ${i < 3 ? 'pb-4 border-b border-[var(--border)]' : ''}`}>
                  <span className="text-xs text-[var(--text-secondary)] font-medium">{stat.label}</span>
                  <span className={`font-mono font-bold text-xl ${stat.color}`}>{stat.val}</span>
                </div>
              ))}
            </div>
          </div>

          {state.aiScore && <AIBanner score={state.aiScore} />}
        </div>
      </div>
    </div>
  );
}
