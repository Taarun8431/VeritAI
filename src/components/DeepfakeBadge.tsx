import { motion } from 'framer-motion';
import { DeepfakeResult } from '../types';

export function DeepfakeBadge({ result, index }: { result: DeepfakeResult, index: number }) {
  if (result.score <= 0.7) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
      className="relative group min-w-[200px] rounded-2xl overflow-hidden card bg-[var(--bg-elevated)] border-[var(--false)]/20 shadow-xl"
    >
      <div className="aspect-square relative overflow-hidden">
        <img 
          src={result.image_url} 
          alt="Media Analysis" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.2] group-hover:grayscale-0" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
      </div>
      
      <div className="absolute inset-x-0 bottom-0 p-3">
         <motion.div 
           className="bg-[var(--false)]/90 backdrop-blur-md p-2.5 rounded-xl border border-white/20 shadow-lg text-white"
         >
           <div className="flex items-center justify-between mb-1">
             <span className="text-[9px] font-bold font-mono uppercase opacity-80 tracking-wider text-white">Media Risk</span>
             <span className="text-[9px] font-bold font-mono text-white">{Math.round(result.score * 100)}% Match</span>
           </div>
           <div className="text-[10px] font-bold uppercase tracking-widest text-white">
             {result.type === "ai_generated" ? "AI GENERATED CONTENT" : "AI MODIFIED MEDIA"}
           </div>
         </motion.div>
      </div>

      <div className="absolute top-2.5 right-2.5">
         <div className="w-8 h-8 rounded-full bg-[var(--false)] flex items-center justify-center text-white shadow-lg border border-white/20">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
               <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
         </div>
      </div>
    </motion.div>
  );
}

export function DeepfakeSection({ deepfakes }: { deepfakes: DeepfakeResult[] }) {
  if (!deepfakes || deepfakes.length === 0) return null;
  
  const fakes = deepfakes.filter(d => d.score > 0.7);
  if (fakes.length === 0) return null;

  return (
    <div className="space-y-4 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-heading font-bold text-[var(--false)] tracking-tight">Anomalies Detected</h3>
          <p className="text-[var(--text-muted)] text-[9px] font-mono uppercase tracking-[0.2em] mt-0.5">ViT-Neural-Scanner v4.2</p>
        </div>
        <div className="px-2.5 py-1 rounded-md bg-[var(--false)]/10 border border-[var(--false)]/20 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--false)] animate-pulse" />
          <span className="text-[9px] font-bold text-[var(--false)] uppercase tracking-wider">{fakes.length} Alert</span>
        </div>
      </div>
      
      <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar snap-x">
        {fakes.map((df, i) => (
          <DeepfakeBadge key={i} result={df} index={i} />
        ))}
      </div>
      
      <div className="p-4 rounded-xl bg-[var(--false)]/5 border border-[var(--false)]/10">
        <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed italic opacity-80">
          <span className="text-[var(--false)] font-bold not-italic mr-2">Deepfake Warning:</span>
          Our neural media analysis detected significant synthetic markers consistent with digital tampering. 
        </p>
      </div>
    </div>
  );
}
