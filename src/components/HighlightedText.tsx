import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClaimWithVerdict } from '../types';
import { buildHighlightSegments } from '../utils';

const HIGHLIGHT_STYLES: Record<string, string> = {
  "True": "border-verdict-true/40 text-text-primary",
  "False": "border-verdict-false/40 text-text-primary",
  "Partially True": "border-verdict-partial/40 text-text-primary",
  "Conflicting": "border-verdict-conflict/40 text-text-primary",
  "Unverifiable": "border-verdict-unknown/40 text-text-primary",
  "Temporally Uncertain": "border-verdict-temporal/40 text-text-primary"
};

const VERDICT_COLORS: Record<string, string> = {
  "True": "var(--verdict-true)",
  "False": "var(--verdict-false)",
  "Partially True": "var(--verdict-partial)",
  "Conflicting": "var(--verdict-conflict)",
  "Unverifiable": "var(--text-muted)",
  "Temporally Uncertain": "var(--verdict-temporal)"
};

export function HighlightedText({ text, claims, onClaimClick }: { text: string, claims: ClaimWithVerdict[], onClaimClick?: (id: string) => void }) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  if (!text) return null;
  
  const segments = buildHighlightSegments(text, claims);
  const hoveredClaim = hoveredId ? claims.find(c => c.id === hoveredId) : null;

  return (
    <div className="relative">
      <div className="font-body text-[15px] leading-[1.8] text-text-secondary selection:bg-primary/20">
        {segments.map((seg, idx) => {
           if (!seg.claimId) return <span key={idx}>{seg.text}</span>;
           
           const verdict = seg.verdict || "Unverifiable";
           const styleClass = HIGHLIGHT_STYLES[verdict] || HIGHLIGHT_STYLES["Unverifiable"];
           const color = VERDICT_COLORS[verdict] || "var(--text-muted)";
           
           return (
              <motion.span 
                key={`claim-${seg.claimId}-${idx}`} 
                className={`inline border-b-2 cursor-pointer transition-all duration-200 ${styleClass} ${
                  hoveredId && hoveredId !== seg.claimId ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'
                }`}
                style={{ backgroundColor: hoveredId === seg.claimId ? `rgba(${color.includes('true') ? '16, 185, 129' : color.includes('false') ? '239, 68, 68' : '124, 58, 237'}, 0.1)` : 'transparent' }}
                onMouseEnter={() => setHoveredId(seg.claimId!)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => onClaimClick && onClaimClick(seg.claimId!)}
              >
                {seg.text}
              </motion.span>
           );
        })}
      </div>

      <AnimatePresence>
        {hoveredClaim && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="mt-6 verit-card p-4 shadow-xl border-primary/20 bg-elevated/90 backdrop-blur-md"
          >
             <div className="flex items-center gap-2 mb-2">
               <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: VERDICT_COLORS[hoveredClaim.verdict || 'Unverifiable'] }} />
               <span className="font-heading font-bold text-text-primary text-xs uppercase tracking-wider">{hoveredClaim.verdict || 'Analyzing...'}</span>
               {hoveredClaim.confidence !== undefined && (
                 <span className="text-[9px] font-mono text-text-muted ml-auto uppercase tracking-widest">
                   {Math.round(hoveredClaim.confidence * 100)}% Confidence
                 </span>
               )}
             </div>
             {hoveredClaim.reasoning && (
               <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                 {hoveredClaim.reasoning}
               </p>
             )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEGEND */}
      <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 pt-6 border-t border-border">
        {[
          { label: "True", color: "var(--verdict-true)" },
          { label: "False", color: "var(--verdict-false)" },
          { label: "Partial", color: "var(--verdict-partial)" },
          { label: "Conflict", color: "var(--verdict-conflict)" },
          { label: "Temporal", color: "var(--verdict-temporal)" },
          { label: "Unknown", color: "var(--text-muted)" }
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-[9px] font-mono font-bold text-text-muted uppercase tracking-widest">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
