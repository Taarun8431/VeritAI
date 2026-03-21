import { motion, AnimatePresence } from 'framer-motion';
import { ToastMessage } from '../types';

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => {
          const type = toast.verdict === 'True' ? 'success' : toast.verdict === 'False' ? 'error' : 'info';
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              className={`
                min-w-[280px] p-4 rounded-xl shadow-xl border flex items-center gap-3 bg-[var(--bg-card)]
                ${type === 'success' ? 'border-emerald-500/20 shadow-emerald-500/10' : 
                  type === 'error' ? 'border-red-500/20 shadow-red-500/10' : 
                  'border-[#7c3aed]/20 shadow-[#7c3aed]/10'}
              `}
            >
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                ${type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 
                  type === 'error' ? 'bg-red-500/10 text-red-500' : 
                  'bg-[#7c3aed]/10 text-[#7c3aed]'}
              `}>
                {type === 'success' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : type === 'error' ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Verdict: {toast.verdict}</span>
                <span className="text-sm font-medium text-[var(--text-primary)] truncate">{toast.claimText}</span>
              </div>
              <button 
                onClick={() => removeToast(toast.id)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
