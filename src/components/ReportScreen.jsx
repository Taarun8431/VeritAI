import ClaimCard from "./ClaimCard.jsx";
import HighlightedText from "./HighlightedText.jsx";
import PipelineStepper from "./PipelineStepper.jsx";

const filters = [
  "All",
  "True",
  "False",
  "Partially True",
  "Conflicting",
  "Unverifiable",
  "Temporally Uncertain",
];

const legend = [
  { label: "True", color: "var(--true)" },
  { label: "False", color: "var(--false)" },
  { label: "Partial", color: "var(--partial)" },
  { label: "Conflict", color: "var(--conflict)" },
  { label: "Unverifiable", color: "var(--unverifiable)" },
  { label: "Temporal", color: "var(--temporal)" },
];

function getAccuracyColor(value) {
  if (value >= 70) {
    return "var(--true)";
  }
  if (value >= 45) {
    return "var(--partial)";
  }
  return "var(--false)";
}

function getMediaTypeLabel(type) {
  if (type === "face_swapped") {
    return "Synthetically Manipulated";
  }
  return "AI-Generated";
}

export default function ReportScreen({
  accuracy,
  aiScore,
  claims,
  deepfakes,
  durationSeconds,
  filter,
  filteredClaims,
  progress,
  sourceText,
  verdictSummary,
  verdicts,
  onClaimSelect,
  onExport,
  onFilterChange,
  onNewAnalysis,
  onOpenBonusPage,
}) {
  const reviewCount =
    verdictSummary["Partially True"] +
    verdictSummary.Conflicting +
    verdictSummary["Temporally Uncertain"];

  const stats = [
    { label: "True", value: verdictSummary.True, tone: "var(--true)" },
    { label: "False", value: verdictSummary.False, tone: "var(--false)" },
    { label: "Needs Review", value: reviewCount, tone: "var(--partial)" },
    { label: "Unverifiable", value: verdictSummary.Unverifiable, tone: "var(--unverifiable)" },
  ];
  const aiProbability = Number(aiScore?.probability ?? 0);
  const hasAiScore = !!aiScore;
  const hasDeepfakes = deepfakes.length > 0;

  return (
    <main className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
      <nav className="panel no-print sticky top-4 z-30 mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[28px] px-5 py-4 backdrop-blur">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--text-soft)]">
            Report
          </div>
          <div className="mt-1 text-lg text-white">
            {claims.length} claims analysed in {durationSeconds.toFixed(1)}s
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => onOpenBonusPage("ai")}
              className="rounded-full border border-[var(--border)] px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] text-[var(--text-main)] transition hover:bg-[rgba(79,142,247,0.1)]"
            >
              AI Detector
            </button>
            <button
              type="button"
              onClick={() => onOpenBonusPage("media")}
              className="rounded-full border border-[var(--border)] px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] text-[var(--text-main)] transition hover:bg-[rgba(52,211,153,0.08)]"
            >
              Media Scanner
            </button>
          </div>
          <button
            type="button"
            onClick={onExport}
            className="rounded-full border border-[var(--border)] px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] text-[var(--text-main)] transition hover:bg-[rgba(79,142,247,0.1)]"
          >
            Export PDF
          </button>
          <button
            type="button"
            onClick={onNewAnalysis}
            className="rounded-full bg-[var(--accent)] px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] text-white transition hover:brightness-110"
          >
            New Analysis
          </button>
        </div>
      </nav>

      <div className="panel mb-6 rounded-[28px] border-l-4 border-l-[var(--partial)] px-5 py-4">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--text-dim)]">
          Bonus Feature - AI Detector
        </div>
        {hasAiScore ? (
          <>
            <div className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--text-soft)]">
              AI Text Signal
            </div>
            <div className="mt-2 text-lg text-white">
              {aiScore.label} with {aiProbability}% confidence according to {aiScore.model}.
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(4, Math.min(100, aiProbability))}%`,
                  backgroundColor:
                    aiProbability >= 60 ? "var(--partial)" : aiProbability >= 40 ? "var(--accent)" : "var(--true)",
                }}
              />
            </div>
          </>
        ) : (
          <>
            <div className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--text-soft)]">
              AI Text Signal
            </div>
            <div className="mt-2 text-lg text-white">AI detector did not return a result for this run.</div>
            <div className="mt-2 text-sm text-[var(--text-dim)]">
              This card stays visible so the bonus feature is always present in the demo.
            </div>
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="space-y-6">
          <div className="panel rounded-[30px] p-6 lg:p-8">
            <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--text-dim)]">
              Bonus Feature - Media Scanner
            </div>
            <div className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--text-soft)]">
              Deepfake Media Scan
            </div>
            {hasDeepfakes ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {deepfakes.map((item) => (
                  <div
                    key={item.image_url}
                    className="overflow-hidden rounded-[22px] border border-[var(--border)] bg-[rgba(7,12,18,0.88)]"
                  >
                    <img src={item.image_url} alt={item.label} className="h-44 w-full object-cover" />
                    <div className="space-y-2 px-4 py-4">
                      <div className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--text-soft)]">
                        {getMediaTypeLabel(item.type)}
                      </div>
                      <div className="text-lg text-white">
                        {item.label} at {(item.score * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-[22px] border border-dashed border-[var(--border)] bg-[rgba(7,12,18,0.5)] px-4 py-5">
                <div className="text-white">No media findings were returned for this run.</div>
                <div className="mt-2 text-sm text-[var(--text-dim)]">
                  The scanner activates for URL checks and shows image-based results here when media is found.
                </div>
              </div>
            )}
          </div>

          <div className="panel rounded-[30px] p-6 lg:p-8">
            <div className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--text-soft)]">
              Verification Score
            </div>
            <div
              className="mt-4 font-['Instrument_Serif'] text-[80px] italic leading-none"
              style={{ color: getAccuracyColor(accuracy) }}
            >
              {accuracy}%
            </div>
            <div className="mt-3 text-sm text-[var(--text-dim)]">
              Weighted by verdict certainty across all streamed claims.
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[22px] border border-[var(--border)] bg-[rgba(7,12,18,0.88)] px-4 py-4"
                >
                  <div className="font-mono text-xs uppercase tracking-[0.26em] text-[var(--text-soft)]">
                    {stat.label}
                  </div>
                  <div className="mt-3 text-3xl font-semibold text-white" style={{ color: stat.tone }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel rounded-[30px] p-6 lg:p-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--text-soft)]">
                  Annotated Source
                </div>
                <div className="mt-2 text-sm text-[var(--text-dim)]">
                  Tap a highlight to jump to its verification card.
                </div>
              </div>
            </div>

            <div className="scrollbar-thin max-h-[520px] overflow-auto rounded-[24px] border border-[var(--border)] bg-[rgba(8,12,17,0.88)] p-5">
              <HighlightedText
                claims={claims}
                text={sourceText}
                verdicts={verdicts}
                onClaimSelect={onClaimSelect}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {legend.map((item) => (
                <div
                  key={item.label}
                  className="rounded-full border border-[var(--border)] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--text-soft)]"
                >
                  <span
                    className="mr-2 inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <PipelineStepper progress={progress} />

          <div className="panel rounded-[30px] p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--text-soft)]">
                  Claim Verdicts
                </div>
                <div className="mt-2 text-sm text-[var(--text-dim)]">
                  Filter verdicts to focus the live presentation.
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {filters.map((item) => {
                  const active = item === filter;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onFilterChange(item)}
                      className={`rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.22em] transition ${
                        active
                          ? "bg-[var(--accent)] text-white"
                          : "border border-[var(--border)] text-[var(--text-soft)] hover:bg-[rgba(79,142,247,0.08)]"
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              {filteredClaims.length ? (
                filteredClaims.map((claim, index) => (
                  <ClaimCard
                    key={claim.id}
                    claim={claim}
                    index={index}
                    verdictData={verdicts[claim.id]}
                  />
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-[var(--border)] px-5 py-10 text-center text-[var(--text-soft)]">
                  No claims match the current filter.
                </div>
              )}
            </div>
          </div>

          <div className="panel no-print rounded-[30px] p-5">
            <div className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--text-soft)]">
              Keyboard Shortcuts
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              {[
                ["Ctrl+Enter", "Run verification"],
                ["P", "Export PDF"],
                ["N", "New analysis"],
              ].map(([key, label]) => (
                <div
                  key={key}
                  className="rounded-full border border-[var(--border)] px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--text-soft)]"
                >
                  {key} - {label}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
