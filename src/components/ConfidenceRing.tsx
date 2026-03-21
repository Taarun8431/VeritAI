import { motion } from 'framer-motion';

interface ConfidenceRingProps {
  percentage: number;
  color: string;
  size?: number;
}

export function ConfidenceRing({ percentage, color, size = 60 }: ConfidenceRingProps) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="var(--bg-elevated)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <span 
        className="absolute font-mono text-[10px] font-bold"
        style={{ color }}
      >
        {Math.round(percentage)}%
      </span>
    </div>
  );
}
