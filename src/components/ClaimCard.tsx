import { motion } from 'framer-motion';
import { ClaimWithVerdict } from '../types';
import { ConfidenceRing } from './ConfidenceRing';

const VERDICT_CONFIG: Record<string, { label: string, color: string, icon: string }> = {
  "True": { label: "True", color: "var(--true)", icon: "✓" },
  "False": { label: "False", color: "var(--false)", icon: "✗" },
  "Partially True": { label: "Partial", color: "var(--partial)", icon: "~" },
  "Conflicting": { label: "Conflict", color: "var(--conflict)", icon: "⚡" },
  "Unverifiable": { label: "Unknown", color: "var(--unknown)", icon: "?" },
  "Temporally Uncertain": { label: "Temporal", color: "var(--temporal)", icon: "⏱" }
};

export function ClaimCard({ claim, index }: { claim: ClaimWithVerdict; index: number }) {
  const isVerified = claim.status === 'verified';
  const isSearching = claim.status === 'searching';
  
  const verdict = claim.verdict || "Unverifiable";
  const config = VERDICT_CONFIG[verdict];

  return (
    <motion.div 
      id={`claim-${claim.id}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="card p-5 group relative overflow-hidden flex flex-col sm:flex-row gap-6"
      style={{ borderLeft: `4px solid ${isVerified ? config.color : 'var(--border)'}` }}
    >
      <div className="flex-1 space-y-3">
        {/* ROW 1: Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[9px] px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)] uppercase tracking-wider font-bold">
            #{index + 1} {claim.type}
          </span>
          
          {isVerified ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-heading text-[10px] font-bold border"
              style={{ 
                backgroundColor: `${config.color}15`,
                borderColor: `${config.color}30`,
                color: config.color 
              }}
            >
              <span>{config.icon}</span>
              {config.label}
            </motion.div>
          ) : isSearching ? (
            <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)] italic">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} className="w-1 h-1 bg-[var(--primary)] rounded-full" />
                ))}
              </div>
              Searching sources...
            </div>
          ) : null}
        </div>

        {/* ROW 2: Claim Text */}
        <p className="text-sm font-body text-[var(--text-primary)] leading-relaxed font-medium">
          {claim.text}
        </p>

        {/* ROW 3: Reasoning */}
        {isVerified && claim.reasoning && (
          <p className="text-[11px] font-body text-[var(--text-secondary)] italic leading-relaxed">
            {claim.reasoning}
          </p>
        )}

        {/* ROW 4: Sources (FIX 1) */}
        {isVerified && claim.sources && claim.sources.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {claim.sources.map((src, i) => (
              <a 
                key={i}
                href={src.url} 
                target="_blank" 
                rel="noopener noreferrer"
                title={src.title}
                className="inline-flex items-center gap-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full px-3 py-1 font-mono text-[9px] text-[var(--text-secondary)] hover:border-[var(--primary)]/40 hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-all group/src"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${
                  src.credibility === 'high' ? 'bg-[#10b981]' : 
                  src.credibility === 'medium' ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'
                }`} />
                {new URL(src.url).hostname.replace('www.', '')}
                <svg className="w-2.5 h-2.5 opacity-40 group-hover/src:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                </svg>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: Confidence Ring (FIX 2) */}
      <div className="flex-shrink-0 flex items-center justify-center">
        {isVerified && claim.confidence !== undefined ? (
          <ConfidenceRing percentage={claim.confidence * 100} color={config.color} size={60} />
        ) : (
          <div className="w-[60px] h-[60px] rounded-full border-2 border-dashed border-[var(--border)] flex items-center justify-center opacity-40">
            <span className="text-[9px] font-mono font-bold text-[var(--text-muted)]">SCAN</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
