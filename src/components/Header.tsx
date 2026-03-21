import { AnimatePresence, motion } from 'framer-motion';

interface HeaderProps {
  isDark: boolean;
  stage: string;
  claimsTotal: number;
  claimsDone: number;
  pageTitle: string;
  breadcrumb: string;
}

export function Header({ stage, claimsTotal, claimsDone, pageTitle, breadcrumb }: HeaderProps) {
  const isAnalyzing = stage !== 'idle' && stage !== 'complete';

  return (
    <header className="fixed top-0 right-0 left-[220px] h-16 bg-[var(--bg-header)] backdrop-blur-md border-b border-[var(--border)] z-40 px-6 flex items-center justify-between transition-all duration-200">
      <div className="flex flex-col">
        <div className="flex items-center gap-2 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
          {breadcrumb}
        </div>
        <h1 className="text-sm font-bold text-[var(--text-primary)] mt-0.5 tracking-tight">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-6">
        {isAnalyzing && (
          <AnimatePresence>
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center gap-3 bg-[var(--bg-elevated)] border border-[var(--border)] px-4 py-1.5 rounded-full shadow-sm"
            >
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
              </div>
              <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Analyzing... ({claimsDone}/{claimsTotal || '?'})
              </span>
            </motion.div>
          </AnimatePresence>
        )}

        <div className="hidden md:flex items-center gap-4 border-r border-[var(--border)] pr-6 mr-2">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-tighter">Powered by</span>
            <span className="text-[11px] font-black text-[var(--text-primary)] tracking-widest uppercase">Gemini 1.5 Pro</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] flex items-center justify-center shadow-md">
            <span className="text-white text-xs font-bold font-mono">G</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="p-2 text-[var(--text-muted)] hover:text-[#7c3aed] transition-colors rounded-lg hover:bg-[var(--bg-elevated)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button className="p-2 text-[var(--text-muted)] hover:text-[#7c3aed] transition-colors rounded-lg hover:bg-[var(--bg-elevated)] relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 00-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-[var(--bg-header)]"></span>
          </button>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 border border-[var(--border)] cursor-pointer hover:ring-2 hover:ring-[#7c3aed]/30 transition-all"></div>
        </div>
      </div>
    </header>
  );
}
