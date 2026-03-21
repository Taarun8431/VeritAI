export type Verdict = "True" | "False" | "Partially True" | "Conflicting" | "Unverifiable" | "Temporally Uncertain";
export type ClaimType = "factual" | "temporal" | "entity" | "opinion";
export type ClaimStatus = "pending" | "searching" | "verified" | "error";
export type CredibilityLevel = "high" | "medium" | "low";
export type PipelineStage = "extracting" | "searching" | "verifying" | "complete";

export interface EvidenceObject {
  claim_id: string;
  url: string;
  title: string;
  snippet: string;
  credibility: CredibilityLevel;
  published_date?: string;
}

export interface ClaimObject {
  id: string;
  text: string;
  type: ClaimType;
  anchor: string;
  char_start: number;
  char_end: number;
  status: ClaimStatus;
}

export interface VerificationResult {
  claim_id: string;
  verdict: Verdict;
  confidence: number;
  reasoning: string;
  sources: EvidenceObject[];
  conflicting: boolean;
}

export interface AIScoreResult {
  probability: number;
  label: "Likely AI-generated" | "Likely human-written";
  model: string;
}

export interface DeepfakeResult {
  image_url: string;
  score: number;
  label: "REAL" | "FAKE";
  type: "ai_generated" | "face_swapped";
}

export interface ClaimWithVerdict extends ClaimObject {
  verdict?: Verdict;
  confidence?: number;
  reasoning?: string;
  sources?: EvidenceObject[];
  conflicting?: boolean;
}

export interface ToastMessage {
  id: string;
  verdict: Verdict | string;
  claimText: string;
}

export interface PipelineState {
  stage: PipelineStage | "idle";
  progress: number;
  claims_total: number;
  claims_done: number;
  claims: ClaimWithVerdict[];
  aiScore?: AIScoreResult;
  deepfakes: DeepfakeResult[];
  originalText: string;
  error?: string;
}
