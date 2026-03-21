import { useState, useEffect } from 'react';
import { usePipeline } from './hooks/usePipeline';
import { useToasts } from './hooks/useToasts';
import { InputPage } from './pages/InputPage';
import { AnalysisPage } from './pages/AnalysisPage';
import { ResultsPage } from './pages/ResultsPage';
import { Header } from './components/Header';

import { ToastContainer } from './components/Toast';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  const { state, stats, isRunning, verify, reset } = usePipeline();
  const { toasts, dismissToast } = useToasts();

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('veritai-theme');
    if (saved) return saved === 'dark';
    return true; // default dark
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('veritai-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  let content;
  if (state.stage === 'idle') {
    content = <InputPage key="input" onVerify={verify} isRunning={isRunning} />;
  } else if (state.stage === 'complete') {
    content = <ResultsPage key="results" state={state} stats={stats} onReset={reset} />;
  } else {
    content = <AnalysisPage key="analysis" state={state} />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-body transition-colors duration-200">
      <div className="flex flex-col min-h-screen">
        <Header 
          isRunning={isRunning}
          stats={stats}
          isDark={isDark}
          setIsDark={setIsDark}
        />
        
        <main className="flex-1 mt-16 p-6 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.stage}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="max-w-[1280px] mx-auto"
            >
               {content}
            </motion.div>
          </AnimatePresence>
        </main>

        <ToastContainer toasts={toasts} removeToast={dismissToast} />
      </div>
    </div>
  );
}

export default App;
