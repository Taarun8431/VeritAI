import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Verdict, ClaimWithVerdict } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const VERDICT_CONFIG: Record<string, { bg: string, border: string, text: string, highlight: string, dot: string, label: string }> = {
  "True": { 
    bg: "bg-verdict-true/10", 
    border: "border-verdict-true/20", 
    text: "text-verdict-true", 
    highlight: "bg-verdict-true/20 border border-verdict-true/30 text-verdict-true px-1 rounded-md", 
    dot: "bg-verdict-true", 
    label: "True" 
  },
  "False": { 
    bg: "bg-verdict-false/10", 
    border: "border-verdict-false/20", 
    text: "text-verdict-false", 
    highlight: "bg-verdict-false/20 border border-verdict-false/30 text-verdict-false px-1 rounded-md", 
    dot: "bg-verdict-false", 
    label: "False" 
  },
  "Partially True": { 
    bg: "bg-verdict-partial/10", 
    border: "border-verdict-partial/20", 
    text: "text-verdict-partial", 
    highlight: "bg-verdict-partial/20 border border-verdict-partial/30 text-verdict-partial px-1 rounded-md", 
    dot: "bg-verdict-partial", 
    label: "Partially True" 
  },
  "Conflicting": { 
    bg: "bg-verdict-conflicting/10", 
    border: "border-verdict-conflicting/20", 
    text: "text-verdict-conflicting", 
    highlight: "bg-verdict-conflicting/20 border border-verdict-conflicting/30 text-verdict-conflicting px-1 rounded-md", 
    dot: "bg-verdict-conflicting", 
    label: "Conflicting" 
  },
  "Unverifiable": { 
    bg: "bg-white/5", 
    border: "border-white/10", 
    text: "text-text-muted", 
    highlight: "bg-white/10 border border-white/20 text-white px-1 rounded-md", 
    dot: "bg-text-muted", 
    label: "Unverifiable" 
  },
  "Temporally Uncertain": { 
    bg: "bg-verdict-temporal/10", 
    border: "border-verdict-temporal/20", 
    text: "text-verdict-temporal", 
    highlight: "bg-verdict-temporal/20 border border-verdict-temporal/30 text-verdict-temporal px-1 rounded-md", 
    dot: "bg-verdict-temporal", 
    label: "Temporally Uncertain" 
  }
};

export const VERDICT_RING_COLOR: Record<string, string> = {
  "True": "#10b981",
  "False": "#ef4444",
  "Partially True": "#f59e0b",
  "Conflicting": "#f97316",
  "Unverifiable": "#6b7280",
  "Temporally Uncertain": "#8b5cf6"
};

export interface TextSegment {
  text: string;
  claimId?: string;
  verdict?: Verdict;
  confidence?: number;
}

export function buildHighlightSegments(text: string, claims: ClaimWithVerdict[]): TextSegment[] {
  if (!text) return [];
  const sorted = [...claims].sort((a, b) => a.char_start - b.char_start);
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  
  sorted.forEach(c => {
    if (c.char_start >= lastIndex) {
      if (c.char_start > lastIndex) {
        segments.push({ text: text.slice(lastIndex, c.char_start) });
      }
      segments.push({
        text: text.slice(c.char_start, c.char_end),
        claimId: c.id,
        verdict: c.verdict,
        confidence: c.confidence
      });
      lastIndex = c.char_end;
    }
  });
  
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }
  return segments;
}

export function exportReportJSON(data: any, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
