import { motion } from 'framer-motion';

interface PipelineStepperProps {
  stage: string;
}

export function PipelineStepper({ stage }: PipelineStepperProps) {
  const steps = [
    { id: 'extracting', label: 'Extracting Claims', icon: '🔍' },
    { id: 'searching', label: 'Searching Evidence', icon: '🌐' },
    { id: 'verifying', label: 'Verifying', icon: '🛡️' }
  ];

  const currentStepIndex = 
    stage === 'extracting' ? 0 :
    stage === 'searching' ? 1 : 
    stage === 'verifying' || stage === 'complete' ? 2 : -1;

  return (
    <div className="relative w-full py-2">
      <div className="absolute top-6 left-10 right-10 h-[2px] bg-[var(--border)] z-0" />
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(0, (currentStepIndex / (steps.length - 1)) * 100)}%` }}
        className="absolute top-6 left-10 h-[2px] bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] z-0"
      />

      <div className="flex justify-between items-start relative z-10 px-4">
        {steps.map((step, i) => {
          const isDone = i < currentStepIndex || stage === 'complete';
          const isActive = i === currentStepIndex && stage !== 'complete';
          
          return (
            <div key={step.id} className="flex flex-col items-center gap-3">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-sm
                transition-all duration-300
                ${isDone ? 'bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-white shadow-lg shadow-[#7c3aed]/40' :
                  isActive ? 'bg-[#7c3aed]/10 border-2 border-[#7c3aed] text-[#7c3aed] shadow-[0_0_15px_rgba(124,58,237,0.3)]' :
                  'bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)]'}
              `}>
                {isDone ? (
                  <motion.svg initial={{ scale: 0.5 }} animate={{ scale: 1.2 }} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </motion.svg>
                ) : (
                  isActive ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : (i + 1)
                )}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-[#7c3aed]' : isDone ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
