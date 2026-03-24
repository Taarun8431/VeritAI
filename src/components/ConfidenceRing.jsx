import { motion } from "framer-motion";

const verdictConfig = {
  True: {
    label: "True",
    color: "var(--true)",
    surface: "rgba(52, 211, 153, 0.08)",
  },
  False: {
    label: "False",
    color: "var(--false)",
    surface: "rgba(248, 113, 113, 0.08)",
  },
  "Partially True": {
    label: "Partially True",
    color: "var(--partial)",
    surface: "rgba(251, 191, 36, 0.1)",
  },
  Conflicting: {
    label: "Conflicting",
    color: "var(--conflict)",
    surface: "rgba(251, 146, 60, 0.1)",
  },
  Unverifiable: {
    label: "Unverifiable",
    color: "var(--unverifiable)",
    surface: "rgba(148, 163, 184, 0.1)",
  },
  "Temporally Uncertain": {
    label: "Temporally Uncertain",
    color: "var(--temporal)",
    surface: "rgba(167, 139, 250, 0.1)",
  },
  Pending: {
    label: "Pending",
    color: "var(--accent)",
    surface: "rgba(79, 142, 247, 0.1)",
  },
};

export function getVerdictConfig(verdict) {
  return verdictConfig[verdict] || verdictConfig.Unverifiable;
}

export default function ConfidenceRing({ confidence = 0, verdict = "Unverifiable" }) {
  const value = Math.max(0, Math.min(1, Number(confidence) || 0));
  const config = getVerdictConfig(verdict);
  const circumference = 138;
  const dashoffset = circumference * (1 - value);

  return (
    <div className="relative flex h-[60px] w-[60px] items-center justify-center">
      <svg viewBox="0 0 60 60" className="h-[60px] w-[60px] -rotate-90">
        <circle
          cx="30"
          cy="30"
          r="22"
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="5"
        />
        <motion.circle
          cx="30"
          cy="30"
          r="22"
          fill="none"
          stroke={config.color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={false}
          animate={{ strokeDashoffset: dashoffset }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        />
      </svg>
      <span className="absolute font-mono text-[11px] uppercase tracking-[0.08em] text-white">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}
