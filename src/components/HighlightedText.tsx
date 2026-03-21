import React from 'react';
import { motion } from 'framer-motion';
import { ClaimWithVerdict } from '../types';

interface HighlightedTextProps {
  text: string;
  claims: ClaimWithVerdict[];
}

const VERDICT_COLORS: Record<string, string> = {
  "True": "#10b981",
  "False": "#ef4444",
  "Partially True": "#f59e0b",
  "Conflicting": "#f97316",
  "Unverifiable": "#64748b",
  "Temporally Uncertain": "#8b5cf6"
};

const VERDICT_BG: Record<string, string> = {
  "True": "rgba(16,185,129,0.12)",
  "False": "rgba(239,68,68,0.12)",
  "Partially True": "rgba(245,158,11,0.12)",
  "Conflicting": "rgba(249,115,22,0.12)",
  "Unverifiable": "rgba(100,116,139,0.08)",
  "Temporally Uncertain": "rgba(139,92,246,0.12)"
};

export function HighlightedText({ text, claims }: HighlightedTextProps) {
  if (!claims.length) return <p className="whitespace-pre-wrap">{text}</p>;

  // Sort claims by their position in text to process linearly
  const sortedClaims = [...claims]
    .filter(c => c.status === 'verified')
    .sort((a, b) => {
      const indexA = text.indexOf(a.text);
      const indexB = text.indexOf(b.text);
      return indexA - indexB;
    });

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  sortedClaims.forEach((claim, i) => {
    const index = text.indexOf(claim.text, lastIndex);
    if (index === -1) return;

    // Add plain text before the claim
    if (index > lastIndex) {
      parts.push(text.substring(lastIndex, index));
    }

    const verdict = claim.verdict || "Unverifiable";
    const color = VERDICT_COLORS[verdict];
    const bg = VERDICT_BG[verdict];

    // Add highlighted claim
    parts.push(
      <motion.span
        key={claim.id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 + i * 0.05 }}
        onClick={() => {
          const element = document.getElementById(`claim-${claim.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-2', 'ring-[#7c3aed]', 'ring-offset-4');
            setTimeout(() => element.classList.remove('ring-2', 'ring-[#7c3aed]', 'ring-offset-4'), 2000);
          }
        }}
        className="cursor-pointer px-1 rounded transition-all hover:brightness-110"
        style={{ 
          backgroundColor: bg,
          borderBottom: `2px ${verdict === 'Unverifiable' ? 'dashed' : 'solid'} ${color}`
        }}
        title={`Click to view verification: ${verdict}`}
      >
        {claim.text}
      </motion.span>
    );

    lastIndex = index + claim.text.length;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <div className="whitespace-pre-wrap leading-relaxed">{parts}</div>;
}
