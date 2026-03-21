import { motion } from 'framer-motion';

interface ConfidenceRingProps {
  percentage: number;
  verdict?: string;
}

export function ConfidenceRing({ percentage, verdict }: ConfidenceRingProps) {
  const isGood = verdict === 'True';
  const isBad = verdict === 'False';
  const color = isGood ? '#10b981' : isBad ? '#ef4444' : '#7c3aed';
  
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-[60px] h-[60px] flex items-center justify-center shrink-0">
      <svg className="w-full h-full -rotate-90">
        <circle
          cx="30"
          cy="30"
          r={radius}
          className="stroke-[var(--bg-elevated)] fill-none stroke-[4]"
        />
        <motion.circle
          cx="30"
          cy="30"
          r={radius}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ strokeDasharray: circumference }}
          className="fill-none stroke-[4] transition-all duration-300"
          stroke={color}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[14px] font-bold text-[var(--text-primary)] font-mono leading-none">
          {percentage}
          <span className="text-[10px] opacity-40">%</span>
        </span>
      </div>
    </div>
  );
}
