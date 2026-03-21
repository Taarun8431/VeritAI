import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DEMO_PRESETS } from '../utils/demoPresets';

interface InputPageProps {
  onVerify: (text: string) => void;
  isRunning: boolean;
}

export function InputPage({ onVerify, isRunning }: InputPageProps) {
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'text' | 'url'>('text');

  const handleSubmit = () => {
    if (text.trim() && !isRunning) {
      onVerify(text);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [text, isRunning]);

  return (
    <div className="space-y-6">
      {/* WELCOME BANNER */}
      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#7c3aed] via-[#4f46e5] to-[#2563eb] p-8 md:p-10 shadow-lg shadow-[#7c3aed]/30"
      >
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[150px] h-[150px] bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-left max-w-[500px]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white font-mono text-[11px] font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI-Powered Fact Verification
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mt-4 leading-tight">
              Verify any claim, instantly.
            </h1>
            <p className="text-white/70 text-sm md:text-base mt-3 leading-relaxed">
              Paste text or enter a URL — VeritAI automatically extracts claims, cross-references global sources, and generates an accuracy report.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {[
              { icon: '🛡', label: '6 Verdict Types' },
              { icon: '🔍', label: 'Multi-Source' },
              { icon: '⚡', label: 'Live Results' }
            ].map((feature, i) => (
              <div key={i} className="bg-white/10 border border-white/20 rounded-full px-4 py-2 flex items-center gap-2 text-white text-sm font-medium backdrop-blur-sm">
                <span>{feature.icon}</span>
                {feature.label}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
        {[
          { label: 'Accuracy Rate', val: '—', sub: 'Verified claims', dot: 'bg-emerald-500', icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          ), gradient: 'from-[#7c3aed] to-[#4f46e5]' },
          { label: 'Claims Checked', val: '0', sub: 'This session', dot: 'bg-violet-500', icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          ), gradient: 'from-[#10b981] to-[#059669]' },
          { label: 'Sources Found', val: '0', sub: 'Cross-referenced', dot: 'bg-blue-500', icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          ), gradient: 'from-[#3b82f6] to-[#2563eb]' },
          { label: 'AI Score', val: '—', sub: 'Text authenticity', dot: 'bg-amber-500', icon: (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ), gradient: 'from-[#f59e0b] to-[#d97706]' },
        ].map((card, i) => (
          <div key={i} className="card p-5 relative transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
            <div className={`absolute -top-6 left-5 w-14 h-14 rounded-lg bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg shadow-black/10`}>
              {card.icon}
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{card.label}</span>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mt-1 font-mono">{card.val}</h3>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${card.dot}`} />
              <span className="text-[11px] text-[var(--text-muted)]">{card.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-8">
        {/* LEFT: Input Card */}
        <div className="lg:col-span-3 card overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-[var(--border)] flex justify-between items-start">
            <div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Input Article or URL</h3>
              <p className="text-xs text-[var(--text-muted)] mt-1">Paste content below to start analysis</p>
            </div>
            <div className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg p-1 flex gap-1">
              {(['text', 'url'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setMode(t)}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${mode === t ? 'bg-[var(--bg-card)] text-[#7c3aed] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 flex-1">
            {mode === 'text' ? (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste news article, social media post, or any text to verify..."
                className="w-100 w-full min-h-[220px] bg-[var(--bg-input)] border border-[var(--border)] rounded-xl p-4 text-sm text-[var(--text-primary)] outline-none focus:border-[#7c3aed]/40 focus:ring-4 focus:ring-[#7c3aed]/5 transition-all resize-none leading-relaxed"
              />
            ) : (
              <div className="flex items-center gap-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 h-14 focus-within:border-[#7c3aed]/40 focus-within:ring-4 focus-within:ring-[#7c3aed]/5 transition-all">
                <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <input
                  type="url"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter article URL (e.g., https://news-site.com/article...)"
                  className="bg-transparent border-none outline-none flex-1 text-sm text-[var(--text-primary)]"
                />
              </div>
            )}
          </div>

          <div className="px-6 py-3 border-t border-[var(--border)] bg-[var(--bg-elevated)] flex justify-between items-center">
            <span className={`font-mono text-[11px] font-bold ${text.length > 4500 ? 'text-red-500' : text.length > 2000 ? 'text-amber-500' : 'text-[var(--text-muted)]'}`}>
              {text.length > 2000 ? (text.length > 4500 ? '✗ ' : '⚠ ') : ''}{text.length} / 4500 chars
            </span>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] font-mono text-[10px] text-[var(--text-muted)] px-2 py-1 rounded-md uppercase font-bold tracking-wider">
              ⌘+Enter
            </div>
          </div>

          <div className="p-6 pt-2">
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || isRunning}
              className="w-full h-12 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white font-bold text-sm shadow-lg shadow-[#7c3aed]/30 hover:shadow-[#7c3aed]/50 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <>
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <motion.div key={i} animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }} className="w-1.5 h-1.5 bg-white rounded-full" />
                    ))}
                  </div>
                  Analyzing...
                </>
              ) : (
                'Start Verification'
              )}
            </button>
          </div>
        </div>

        {/* RIGHT: Demo List */}
        <div className="lg:col-span-2 card flex flex-col">
          <div className="px-6 py-5 border-b border-[var(--border)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Quick Demo Articles</h3>
            <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-widest mt-1 block">Test the pipeline instantly</span>
          </div>
          <div className="flex-1 py-1">
            {DEMO_PRESETS.map((demo, i) => (
              <div
                key={i}
                onClick={() => !isRunning && setText(demo.text)}
                className={`
                  p-4 flex items-start gap-4 cursor-pointer transition-all border-l-4 border-transparent
                  hover:bg-[var(--bg-elevated)] hover:border-[#7c3aed] group
                  ${i < DEMO_PRESETS.length - 1 ? 'border-b border-[var(--border)]' : ''}
                `}
              >
                <div className={`w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br ${
                  demo.label === 'Mixed' ? 'from-[#7c3aed] to-[#4f46e5]' :
                  demo.label === 'Mostly True' ? 'from-[#10b981] to-[#059669]' :
                  demo.label === 'Mostly False' ? 'from-[#ef4444] to-[#dc2626]' :
                  'from-[#f97316] to-[#ea580c]'
                } flex items-center justify-center shadow-md`}>
                  <span className="text-white text-xl">
                    {demo.label === 'Mixed' ? 'ℹ' : demo.label === 'Mostly True' ? '✓' : demo.label === 'Mostly False' ? '✗' : '⚠'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--text-primary)] leading-none">{demo.label}</span>
                    {demo.label === 'Mixed' && (
                      <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-mono text-[9px] px-1.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 font-bold uppercase">⭐ Start</span>
                    )}
                  </div>
                  <p className="text-[12px] text-[var(--text-muted)] mt-1.5 line-clamp-1 leading-relaxed">
                    {demo.text}
                  </p>
                </div>
                <div className="text-[var(--text-muted)] group-hover:text-[#7c3aed] group-hover:translate-x-1 transition-all pt-2">
                  →
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
