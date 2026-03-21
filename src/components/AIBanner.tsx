import { motion } from 'framer-motion';
import { AIScoreResult } from '../types';

interface AIBannerProps {
  score: AIScoreResult;
}

export function AIBanner({ score }: AIBannerProps) {
  const percentage = Math.round(score.probability * 100);
  const isAI = score.label === 'Likely AI-generated';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card p-5 overflow-hidden relative"
    >
      <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">AI Detection</div>
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <span className="font-mono font-bold text-3xl text-[#7c3aed]">{percentage}%</span>
          <span className="text-xs font-bold text-[var(--text-primary)] mt-1">
            {score.label}
          </span>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isAI ? 'bg-[#7c3aed]/10 text-[#7c3aed]' : 'bg-emerald-500/10 text-emerald-500'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
      <div className="mt-4 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden border border-[var(--border)]">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`h-full ${isAI ? 'bg-[#7c3aed]' : 'bg-emerald-500'}`}
        />
      </div>
      <div className="mt-3 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
        AI TEXT DETECTION · {score.model || 'ROBERTA-V2'}
      </div>
    </motion.div>
  );
}
