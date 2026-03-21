import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEMO_PRESETS } from '../utils/demoPresets';

interface InputPageProps {
  onVerify?: (input: string, isUrl: boolean) => void;
  isRunning?: boolean;
}

export function InputPage({ onVerify, isRunning }: InputPageProps) {
  const [tab, setTab] = useState<'text' | 'url'>('text');
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState(false);

  const activeInput = tab === 'text' ? textInput : urlInput;
  const isOverSoft = tab === 'text' && textInput.length > 2000;
  const isOverHard = tab === 'text' && textInput.length > 4500;
  const isDisabled = !activeInput.trim() || isRunning || isOverHard;

  const handleSubmit = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (isDisabled) return;
    
    if (tab === 'url') {
      if (!/^https?:\/\//i.test(urlInput.trim())) {
        setUrlError(true);
        return;
      }
      setUrlError(false);
      onVerify?.(urlInput.trim(), true);
    } else {
      onVerify?.(textInput.trim(), false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit]);

  return (
    <div className="max-w-[1200px] mx-auto p-6 space-y-6">
      {/* WELCOME BANNER */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#7c3aed] via-[#4f46e5] to-[#2563eb] p-8 md:p-10 shadow-lg"
      >
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-[10px] font-mono font-bold uppercase tracking-wider mb-4 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              AI-Powered Fact Verification
            </span>
            <h1 className="font-heading font-bold text-3xl md:text-4xl text-white tracking-tight mb-2">
              Verify any claim, instantly.
            </h1>
            <p className="text-white/70 text-sm md:text-base leading-relaxed">
              Paste text or enter a URL — VeritAI automatically extracts claims, <br className="hidden md:block" />
              cross-references global sources, and generates an accuracy report.
            </p>
          </div>

          <div className="flex flex-col gap-2 shrink-0 md:items-end">
            {[
              { label: '6 Verdict Types', icon: <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /> },
              { label: 'Multi-Source', icon: <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /> },
              { label: 'Live Results', icon: <path d="M13 10V3L4 14h7v7l9-11h-7z" /> }
            ].map(pill => (
              <div key={pill.label} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-mono border border-white/10 backdrop-blur-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">{pill.icon}</svg>
                {pill.label}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Accuracy Rate', val: '—', sub: 'Verified claims', bg: 'from-[#10b981] to-[#059669]', icon: <path d="M5 13l4 4L19 7" /> },
          { label: 'Claims Checked', val: '0', sub: 'This session', bg: 'from-[#f59e0b] to-[#d97706]', icon: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /> },
          { label: 'Sources Found', val: '0', sub: 'Cross-referenced', bg: 'from-[#3b82f6] to-[#2563eb]', icon: <path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /> },
          { label: 'AI Score', val: '—', sub: 'Authenticity', bg: 'from-[#8b5cf6] to-[#7c3aed]', icon: <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /> }
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`card relative p-5 bg-gradient-to-br ${stat.bg} border-none group cursor-default hover:scale-[1.02] transition-transform duration-200 shadow-md`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">{stat.icon}</svg>
              </div>
            </div>
            <div className="relative z-10">
              <div className="font-heading font-bold text-3xl text-white">{stat.val}</div>
              <div className="font-body font-semibold text-sm text-white/90 mt-1">{stat.label}</div>
              <div className="font-mono text-[10px] text-white/60 uppercase tracking-widest mt-1">{stat.sub}</div>
            </div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/5 rounded-full translate-x-1/2 translate-y-1/2 blur-2xl" />
          </motion.div>
        ))}
      </div>

      {/* INPUT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT: Input Card */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card overflow-hidden">
            <div className="px-6 py-5 border-b border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-heading font-semibold text-base text-[var(--text-primary)]">Input Article or URL</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Paste content below to start analysis</p>
              </div>
              <div className="flex bg-[var(--bg-elevated)] p-1 rounded-lg">
                <button 
                  onClick={() => setTab('text')}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${tab === 'text' ? 'bg-[var(--bg-surface)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  Text
                </button>
                <button 
                  onClick={() => setTab('url')}
                  className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${tab === 'url' ? 'bg-[var(--bg-surface)] text-[var(--primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                >
                  URL
                </button>
              </div>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {tab === 'text' ? (
                  <motion.div key="text" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <textarea 
                      value={textInput}
                      onChange={e => setTextInput(e.target.value)}
                      placeholder="Paste a news article, social media post, or any text you want to verify..."
                      className="w-full h-48 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-4 text-sm font-body leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)]/40 transition-colors resize-none"
                    />
                  </motion.div>
                ) : (
                  <motion.div key="url" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                    <div className="flex items-center gap-3 px-4 h-14 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl focus-within:border-[var(--primary)]/40 transition-colors">
                      <svg className="w-5 h-5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                      </svg>
                      <input 
                        type="url"
                        value={urlInput}
                        onChange={e => { setUrlInput(e.target.value); setUrlError(false); }}
                        placeholder="https://example.com/news/article-123"
                        className="flex-1 bg-transparent border-none text-sm font-body focus:outline-none text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
                      />
                    </div>
                    {urlError && <p className="text-[10px] font-medium text-[var(--false)] pl-1">Link must start with http:// or https://</p>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-elevated)]/30 flex items-center justify-between">
              <div className={`font-mono text-[10px] flex items-center gap-1.5 ${isOverHard ? 'text-[var(--false)]' : isOverSoft ? 'text-[var(--partial)]' : 'text-[var(--text-muted)]'}`}>
                {isOverHard ? '✗' : isOverSoft ? '⚠' : ''}
                {textInput.length} / 4500 chars
              </div>
              <div className="flex items-center gap-2">
                <div className="bg-[var(--bg-surface)] border border-[var(--border)] px-2 py-0.5 rounded text-[10px] font-mono text-[var(--text-muted)] shadow-sm">
                  ⌘ + Enter
                </div>
              </div>
            </div>
          </div>

          <button 
            disabled={isDisabled}
            onClick={() => handleSubmit()}
            className="w-full h-12 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white font-heading font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200"
          >
            {isRunning ? (
              <div className="flex items-center justify-center gap-2">
                <div className="flex gap-1">
                  {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: `${i*0.2}s` }} />)}
                </div>
                Analyzing Content
              </div>
            ) : 'Verify Content Now'}
          </button>
        </div>

        {/* RIGHT: Demo Panel */}
        <div className="card h-fit">
          <div className="px-6 py-5 border-b border-[var(--border)]">
            <h3 className="font-heading font-semibold text-sm text-[var(--text-primary)]">Quick Demo Articles</h3>
            <p className="font-mono text-[10px] text-[var(--text-muted)] uppercase tracking-widest mt-0.5">Test the pipeline instantly</p>
          </div>
          <div className="p-3 space-y-1">
            {DEMO_PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  const isUrl = /^https?:\/\//i.test(p.text);
                  if (isUrl) { setTab('url'); setUrlInput(p.text); }
                  else { setTab('text'); setTextInput(p.text); }
                }}
                className="w-full flex items-start gap-4 p-3 rounded-xl hover:bg-[var(--bg-elevated)] transition-all group border-l-2 border-transparent hover:border-[var(--primary)]"
              >
                <div className={`w-10 h-10 rounded-lg shrink-0 flex items-center justify-center bg-gradient-to-br shadow-sm ${
                  p.type === 'MIXED' ? 'from-violet-500 to-indigo-600' :
                  p.type === 'MOSTLY TRUE' ? 'from-emerald-400 to-teal-600' :
                  p.type === 'MOSTLY FALSE' ? 'from-red-400 to-rose-600' :
                  'from-amber-400 to-orange-600'
                }`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                      p.type === 'MOSTLY TRUE' ? "M5 13l4 4L19 7" : 
                      p.type === 'MOSTLY FALSE' ? "M6 18L18 6M6 6l12 12" :
                      "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    } />
                  </svg>
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-heading font-bold text-sm text-[var(--text-primary)] truncate">{p.label}</span>
                    {p.id === 'mixed' && <span className="text-[9px] font-bold text-amber-500 uppercase tracking-tighter">⭐ Start</span>}
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-1 opacity-70">{p.text}</p>
                </div>
                <div className="text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-transform duration-200 translate-x-0 group-hover:translate-x-1">→</div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
