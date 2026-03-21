import { useState, useEffect } from 'react';
import { usePipeline } from './hooks/usePipeline';
import { useToasts } from './hooks/useToasts';
import { InputPage } from './pages/InputPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ResultsPage } from './pages/ResultsPage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/Toast';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const { state, stats, isRunning, verify, reset } = usePipeline();
  const { toasts, dismissToast } = useToasts();
  
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('veritai-theme');
    return saved ? saved === 'dark' : false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('veritai-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const screen = state.stage === 'idle' ? 'input' : 
                 state.stage === 'complete' ? 'results' : 'analysis';

  const getPageTitle = (s: string) => {
    if (s === 'input') return 'Dashboard';
    if (s === 'analysis') return 'Analyzing...';
    return 'Verification Report';
  };

  const getBreadcrumb = (s: string) => {
    if (s === 'input') return 'VERITAI / DASHBOARD';
    if (s === 'analysis') return 'VERITAI / VERIFY / ANALYZING';
    return 'VERITAI / VERIFY / REPORT';
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] font-sans transition-colors duration-200">
      <Sidebar 
        isDark={isDark} 
        setIsDark={setIsDark} 
        activeScreen={screen} 
      />

      <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
        <Header 
          isDark={isDark}
          stage={state.stage}
          claimsTotal={stats.total}
          claimsDone={state.claims.filter(c => c.status === 'verified').length}
          pageTitle={getPageTitle(screen)}
          breadcrumb={getBreadcrumb(screen)}
        />

        <main className="flex-1 mt-16 p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.stage}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="w-full"
            >
              {screen === 'input' && <InputPage key="input" onVerify={(text) => verify(text, false)} isRunning={isRunning} />}
              {screen === 'analysis' && <AnalysisPage key="analysis" state={state} />}
              {screen === 'results' && <ResultsPage key="results" state={state} stats={stats} onReset={reset} />}
            </motion.div>
          </AnimatePresence>
        </main>

        <ToastContainer toasts={toasts} removeToast={dismissToast} />
      </div>
    </div>
  );
}

export default App;
