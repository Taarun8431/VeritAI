import { motion } from 'framer-motion';
import { ClaimWithVerdict } from '../types';
import { ConfidenceRing } from './ConfidenceRing';

const VERDICT_CONFIG: Record<string, { label: string, color: string, icon: string, lightColor: string }> = {
  "True": { label: "True", color: "#10b981", icon: "✓", lightColor: "rgba(16,185,129,0.1)" },
  "False": { label: "False", color: "#ef4444", icon: "✗", lightColor: "rgba(239,68,68,0.1)" },
  "Partially True": { label: "Partial", color: "#f59e0b", icon: "~", lightColor: "rgba(245,158,11,0.1)" },
  "Conflicting": { label: "Conflict", color: "#f97316", icon: "⚡", lightColor: "rgba(249,115,22,0.1)" },
  "Unverifiable": { label: "Unknown", color: "#64748b", icon: "?", lightColor: "rgba(100,116,139,0.1)" },
  "Temporally Uncertain": { label: "Temporal", color: "#8b5cf6", icon: "⏱", lightColor: "rgba(139,92,246,0.1)" }
};

export function ClaimCard({ claim, index }: { claim: ClaimWithVerdict; index: number }) {
  const isVerified = claim.status === 'verified';
  const isSearching = claim.status === 'searching';
  
  const verdict = claim.verdict || "Unverifiable";
  const config = VERDICT_CONFIG[verdict];

  return (
    <motion.div 
      id={`claim-${claim.id}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      className="card p-5 group relative overflow-hidden flex flex-col sm:flex-row gap-6 mb-3"
      style={{ borderLeft: `4px solid ${isVerified ? config.color : 'var(--border)'}` }}
    >
      <div className="flex-1 space-y-2">
        {/* ROW 1: Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] border border-[var(--border)] uppercase tracking-wider font-bold">
            #{index + 1} {claim.type}
          </span>
          
          {isVerified ? (
            <motion.div 
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border"
              style={{ 
                backgroundColor: config.lightColor,
                borderColor: `${config.color}33`,
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
                  <motion.div key={i} animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} className="w-1 h-1 bg-primary rounded-full" />
                ))}
              </div>
              Searching sources...
            </div>
          ) : null}
        </div>

        {/* ROW 2: Claim Text */}
        <p className="text-sm font-medium text-[var(--text-primary)] leading-relaxed">
          {claim.text}
        </p>

        {/* ROW 3: Reasoning */}
        {isVerified && claim.reasoning && (
          <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed line-clamp-3">
            {claim.reasoning}
          </p>
        )}

        {/* ROW 4: Sources (FIX 1) */}
        {isVerified && claim.sources && claim.sources.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {claim.sources.map((src, i) => (
              <a 
                key={i}
                href={src.url} 
                target="_blank" 
                rel="noopener noreferrer"
                title={src.title}
                className="inline-flex items-center gap-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full px-2.5 py-1 font-mono text-[10px] text-[var(--text-secondary)] hover:border-[#7c3aed]/40 hover:bg-[#ede9fe] hover:text-[#7c3aed] dark:hover:bg-[#7c3aed]/10 transition-all no-underline"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${
                  src.credibility === 'high' ? 'bg-[#10b981]' : 
                  src.credibility === 'medium' ? 'bg-[#f59e0b]' : 'bg-[#ef4444]'
                }`} />
                {new URL(src.url).hostname.replace('www.', '').slice(0, 20)}
                <svg className="w-2.5 h-2.5 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
          <ConfidenceRing 
          percentage={claim.confidence || 0} 
          verdict={claim.verdict}
        />
        ) : (
          <div className="w-[60px] h-[60px] rounded-full border-2 border-dashed border-[var(--border)] flex items-center justify-center opacity-40">
            <span className="text-[9px] font-mono font-bold text-[var(--text-muted)]">SCAN</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
