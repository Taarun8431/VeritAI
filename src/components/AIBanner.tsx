import { motion } from 'framer-motion';
import { AIScoreResult } from '../types';

export function AIBanner({ score, isCompact }: { score: AIScoreResult; isCompact?: boolean }) {
  const isAI = score.probability > 40; 
  
  if (isCompact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-heading text-4xl font-bold text-white">
            {Math.round(score.probability)}%
          </span>
          <span className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-mono font-bold uppercase tracking-wider">
            {score.label}
          </span>
        </div>
        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, score.probability)}%` }}
            className="h-full bg-white shadow-[0_0_8px_white]"
          />
        </div>
        <p className="text-[10px] text-white/60 italic leading-relaxed">
          Detected using chatgpt-detector-roberta
        </p>
      </div>
    );
  }

  return (
    <div className="card border-l-4 overflow-hidden relative" 
         style={{ borderLeftColor: isAI ? 'var(--primary)' : 'var(--text-muted)' }}>
      
      <div className="p-5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            isAI ? 'bg-[var(--primary-light)] text-[var(--primary)]' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
          }`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <div>
             <div className="flex items-baseline gap-2.5">
               <span className="font-heading text-3xl font-bold text-[var(--primary)]">
                 {Math.round(score.probability)}%
               </span>
               <span className="font-semibold text-sm text-[var(--text-primary)] whitespace-nowrap">{score.label}</span>
             </div>
             <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mt-0.5">
               AI text detection · chatgpt-detector-roberta
             </p>
          </div>
        </div>
        
        <div className="hidden sm:flex flex-col items-end gap-1.5">
          <div className="w-24 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden border border-[var(--border)]">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${Math.min(100, score.probability)}%` }}
               transition={{ duration: 1, ease: 'easeOut' }}
               className="h-full bg-[var(--primary)]"
             />
          </div>
          <div className="flex justify-between w-24 px-0.5">
            <span className="text-[9px] font-mono text-[var(--text-muted)]">HUMAN</span>
            <span className="text-[9px] font-mono text-[var(--text-muted)]">AI</span>
          </div>
        </div>
      </div>
    </div>
  );
}

