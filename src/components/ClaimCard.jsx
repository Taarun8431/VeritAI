import { motion } from "framer-motion";

import ConfidenceRing, { getVerdictConfig } from "./ConfidenceRing.jsx";
import SourceChip from "./SourceChip.jsx";

const pendingStyle = {
  label: "Pending",
  color: "var(--accent)",
  surface: "rgba(79, 142, 247, 0.08)",
};

export default function ClaimCard({ claim, index = 0, pending = false, verdictData }) {
  const config = pending ? pendingStyle : getVerdictConfig(verdictData?.verdict);
  const sources = verdictData?.sources || [];

  return (
    <motion.article
      id={`claim-card-${claim.id}`}
      initial={{ opacity: 0, x: 28 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.38, delay: Math.min(index * 0.05, 0.24) }}
      className="panel rounded-[28px] p-5"
      style={{ backgroundColor: config.surface }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[var(--border)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text-soft)]">
              {claim.type}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.24em]" style={{ color: config.color }}>
              {pending ? "Searching" : config.label}
            </span>
          </div>

          <h3 className="text-xl leading-8 text-white">{claim.text}</h3>

          <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">
            {pending
              ? "Gathering live evidence and waiting for a verdict."
              : verdictData?.reasoning || "No reasoning available for this claim."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {sources.length ? (
              sources.map((source) => <SourceChip key={`${claim.id}-${source.url}`} source={source} />)
            ) : (
              <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
                Sources will appear here as they stream in.
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0">
          <ConfidenceRing
            confidence={pending ? 0.18 : verdictData?.confidence}
            verdict={pending ? "Pending" : verdictData?.verdict}
          />
        </div>
      </div>
    </motion.article>
  );
}
