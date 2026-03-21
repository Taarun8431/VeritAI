import { motion, AnimatePresence } from 'framer-motion';
import { Verdict } from '../types';
import { useEffect } from 'react';

export interface ToastMessage { id: string, verdict: Verdict | string, claimText: string }

const VERDICT_COLORS: Record<string, string> = {
  "True": "var(--verdict-true)",
  "False": "var(--verdict-false)",
  "Partially True": "var(--verdict-partial)",
  "Conflicting": "var(--verdict-conflict)",
  "Unverifiable": "var(--text-muted)",
  "Temporally Uncertain": "var(--verdict-temporal)"
};

export function Toast({ toast, onClose }: { toast: ToastMessage, onClose: () => void }) {
  const color = VERDICT_COLORS[toast.verdict] || VERDICT_COLORS['Unverifiable'];
  
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      layout
      onClick={onClose}
      className="verit-card p-3 shadow-2xl border-l-[3px] flex items-center gap-3 cursor-pointer mb-3 max-w-[280px] sm:max-w-sm ml-auto z-50 pointer-events-auto bg-elevated/95 backdrop-blur-md"
      style={{ borderLeftColor: color }}
    >
      <div className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: color }} />
      <div className="flex flex-col min-w-0">
         <span className="font-heading font-bold text-[11px] uppercase tracking-wider mb-0.5" style={{ color }}>{toast.verdict}</span>
         <span className="text-text-secondary text-[10px] leading-tight truncate">{toast.claimText}</span>
      </div>
    </motion.div>
  );
}

export function ToastContainer({ toasts, removeToast }: { toasts: ToastMessage[], removeToast: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none w-full max-w-sm">
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <Toast key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}
