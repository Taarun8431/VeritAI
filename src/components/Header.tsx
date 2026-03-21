import { AnimatePresence, motion } from 'framer-motion';

interface HeaderProps {

  isRunning: boolean;
  stats: {
    total: number;
    accuracyPct: number;
  };
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
}

export function Header({ isRunning, stats, isDark, setIsDark }: HeaderProps) {


  return (
    <header className="fixed top-0 left-0 right-0 z-30 h-16 bg-[var(--bg-surface)] border-b border-[var(--border)] shadow-[var(--shadow-sm)] transition-all duration-200">
      <div className="h-full flex items-center justify-between px-6">
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">


            {/* Brand */}
            <div className="flex items-center gap-3 pr-4 md:pr-6 border-r border-[var(--border)]">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="font-heading font-bold text-lg text-[var(--text-primary)] tracking-tight">VeritAI</span>
            </div>
          </div>


        </div>

        {/* CENTER: Status Indicator */}
        <div className="hidden lg:block">
          <AnimatePresence>
            {isRunning && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)]"
              >
                <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-pulse shadow-[0_0_8px_var(--primary)]" />
                <span className="font-mono text-xs text-[var(--text-secondary)]">
                  Analyzing {stats.total} claims...
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: User & Meta */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--primary-light)] border border-[var(--primary)]/10 text-[var(--primary)] font-mono text-[10px] font-bold uppercase tracking-wider">
            Powered by Gemini
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={() => setIsDark(!isDark)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all overflow-hidden relative"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.svg 
                  key="sun"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 5a7 7 0 100 14 7 7 0 000-14z" />
                </motion.svg>
              ) : (
                <motion.svg 
                  key="moon"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </motion.svg>
              )}
            </AnimatePresence>
          </button>

          <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] flex items-center justify-center text-white font-heading font-bold text-sm shadow-lg shadow-primary/20 cursor-pointer hover:scale-105 transition-transform">
            V
          </div>
        </div>

      </div>
    </header>
  );
}

