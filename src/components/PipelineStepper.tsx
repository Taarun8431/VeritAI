import { motion, AnimatePresence } from 'framer-motion';
import { PipelineStage } from '../types';

interface StepperProps {
  stage: PipelineStage | 'idle';
  progress: number;
  claimsTotal: number;
  claimsDone: number;
  elapsed?: number;
}

export function PipelineStepper({ stage, progress, claimsTotal, claimsDone, elapsed }: StepperProps) {
  const stageMap: Record<PipelineStage | 'idle', number> = {
    'idle': -1,
    'extracting': 0,
    'searching': 1,
    'verifying': 2,
    'complete': 3
  };
  const currentIndex = stageMap[stage];
  
  const steps = [
    { label: "Extracting" },
    { label: "Searching" },
    { label: "Verifying" }
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-start relative">
        {/* Connector lines backend */}
        <div className="absolute top-[22px] left-[10%] right-[10%] h-[2px] bg-border z-0" />
        
        {/* Animated connector lines foreground */}
        <div className="absolute top-[22px] left-[10%] right-[10%] h-[2px] z-0 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (Math.max(0, currentIndex) / 2) * 100)}%` }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="h-full bg-gradient-to-r from-primary to-blue-500"
          />
        </div>

        {steps.map((step, idx) => {
          const isDone = currentIndex > idx;
          const isActive = currentIndex === idx;
          const isPending = currentIndex < idx;

          return (
            <div key={idx} className="flex flex-col items-center gap-3 z-10 w-24">
              <div className="relative">
                <AnimatePresence>
                  {isActive && (
                    <motion.div 
                      layoutId="stepper-pulse"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.2 }}
                      className="absolute -inset-1.5 rounded-full border-2 border-primary/40 animate-pulse-ring"
                    />
                  )}
                </AnimatePresence>

                <motion.div 
                  initial={false}
                  animate={{ 
                    scale: isActive ? 1.1 : 1,
                    backgroundColor: isDone ? 'var(--primary)' : isPending ? 'var(--bg-elevated)' : 'rgba(124, 58, 237, 0.1)',
                    borderColor: isDone || isActive ? 'var(--primary)' : 'var(--border)'
                  }}
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors duration-500`}
                >
                   {isDone ? (
                      <motion.svg 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 text-white" 
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </motion.svg>
                   ) : isActive ? (
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                   ) : (
                      <span className="text-text-muted">{idx + 1}</span>
                   )}
                </motion.div>
              </div>

              <span className={`text-[10px] font-bold uppercase tracking-[0.15em] transition-colors duration-500 ${
                isActive ? 'text-text-primary' : isDone ? 'text-primary' : 'text-text-muted'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* PROGRESS BAR */}
      <div className="mt-8 space-y-3">
        <div className="w-full h-1.5 bg-elevated rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(2, progress * 100)}%` }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="h-full bg-gradient-to-r from-primary via-indigo-500 to-blue-500"
          />
        </div>
        
        <div className="flex justify-between items-center font-mono text-[10px] text-text-muted uppercase tracking-widest">
           <div>{Math.round(progress * 100)}% Complete</div>
           <div className="text-text-secondary">Analyzing... {elapsed?.toFixed(1) || '0.0'}s</div>
           <div>{claimsDone} of {claimsTotal} Claims</div>
        </div>
      </div>
    </div>
  );
}
