import ClaimCard from "./ClaimCard.jsx";
import HighlightedText from "./HighlightedText.jsx";
import PipelineStepper from "./PipelineStepper.jsx";
import SkeletonCard from "./SkeletonCard.jsx";

export default function AnalysisScreen({
  aiScore,
  claims,
  deepfakes,
  mode,
  progress,
  sourceText,
  verdicts,
  onClaimSelect,
}) {
  const hasClaims = claims.length > 0;
  const hasAiScore = !!aiScore;
  const hasDeepfakes = deepfakes.length > 0;

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8 lg:px-10">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--text-soft)]">
            Live Analysis
          </p>
          <h1 className="mt-2 font-['Instrument_Serif'] text-4xl italic text-white">
            Streaming fact-check pipeline
          </h1>
        </div>
        <div className="rounded-full border border-[var(--border)] px-4 py-2 font-mono text-xs uppercase tracking-[0.28em] text-[var(--text-soft)]">
          {progress.stage}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="panel rounded-[30px] p-6 lg:p-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-[var(--text-soft)]">
                Source Text
              </div>
              <div className="mt-2 text-sm text-[var(--text-dim)]">
                Claims light up as structured evidence arrives.
              </div>
            </div>
          </div>

          <div className="scrollbar-thin max-h-[72vh] overflow-auto rounded-[24px] border border-[var(--border)] bg-[rgba(8,12,17,0.88)] p-5">
            <HighlightedText
              claims={claims}
              text={sourceText}
              verdicts={verdicts}
              onClaimSelect={onClaimSelect}
            />
          </div>
        </section>

        <section className="space-y-5">
          <PipelineStepper progress={progress} />

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="panel rounded-[26px] p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-dim)]">
                Bonus Feature
              </div>
              <div className="mt-2 font-mono text-xs uppercase tracking-[0.3em] text-[var(--text-soft)]">
                AI Detector
              </div>
              {hasAiScore ? (
                <div className="mt-3 text-sm leading-6 text-white">
                  {aiScore.label} at {aiScore.probability}% via {aiScore.model}.
                </div>
              ) : (
                <div className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                  Waiting for the preflight AI text score to arrive.
                </div>
              )}
            </div>

            <div className="panel rounded-[26px] p-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-dim)]">
                Bonus Feature
              </div>
              <div className="mt-2 font-mono text-xs uppercase tracking-[0.3em] text-[var(--text-soft)]">
                Media Scanner
              </div>
              {mode === "URL" ? (
                hasDeepfakes ? (
                  <div className="mt-3 text-sm leading-6 text-white">
                    {deepfakes.length} media result{deepfakes.length === 1 ? "" : "s"} detected so far.
                  </div>
                ) : (
                  <div className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                    URL mode is active. Scanning article media and waiting for image findings.
                  </div>
                )
              ) : (
                <div className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                  Switch to URL mode to run the deepfake and media scanner during verification.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {hasClaims
              ? claims.map((claim, index) => (
                  <ClaimCard
                    key={claim.id}
                    claim={claim}
                    index={index}
                    pending={!verdicts[claim.id]}
                    verdictData={verdicts[claim.id]}
                  />
                ))
              : Array.from({ length: 3 }).map((_, index) => <SkeletonCard key={index} />)}
          </div>
        </section>
      </div>
    </main>
  );
}
