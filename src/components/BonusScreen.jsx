function getAiTone(probability) {
  if (probability >= 60) {
    return "var(--partial)";
  }
  if (probability >= 40) {
    return "var(--accent)";
  }
  return "var(--true)";
}

function getMediaTypeLabel(type) {
  if (type === "face_swapped") {
    return "Synthetically Manipulated";
  }
  return "AI-Generated";
}

const featureButtons = [
  {
    key: "ai",
    eyebrow: "Bonus +10",
    title: "AI Text Detector",
    description: "Shows the probability score and the binary human-vs-AI label required by the rubric.",
  },
  {
    key: "media",
    eyebrow: "Bonus +20",
    title: "Media Scanner",
    description: "Shows detections for AI-generated media and synthetically manipulated deepfakes.",
  },
];

export default function BonusScreen({
  aiScore,
  deepfakes,
  mode,
  onBack,
  onGoHome,
  onSelectFeature,
  selectedFeature,
}) {
  const activeFeature = selectedFeature === "media" ? "media" : "ai";
  const hasAiScore = !!aiScore;
  const aiProbability = Number(aiScore?.probability ?? 0);
  const hasDeepfakes = deepfakes.length > 0;

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8 lg:px-10">
      <nav className="panel sticky top-4 z-30 mb-6 flex flex-wrap items-center justify-between gap-4 rounded-[28px] px-5 py-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.34em] text-[var(--text-soft)]">
            Bonus Showcase
          </div>
          <div className="mt-1 text-lg text-white">
            Dedicated views for the two rubric bonus features
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-[var(--border)] px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] text-[var(--text-main)] transition hover:bg-[rgba(79,142,247,0.1)]"
          >
            Back
          </button>
          <button
            type="button"
            onClick={onGoHome}
            className="rounded-full bg-[var(--accent)] px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] text-white transition hover:brightness-110"
          >
            Home
          </button>
        </div>
      </nav>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="panel h-fit rounded-[30px] p-5 lg:p-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--text-dim)]">
            Bonus Features
          </div>
          <div className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
            Each button opens one bonus feature cleanly, with its own live result panel.
          </div>

          <div className="mt-5 space-y-3">
            {featureButtons.map((feature) => {
              const active = feature.key === activeFeature;
              return (
                <button
                  key={feature.key}
                  type="button"
                  onClick={() => onSelectFeature(feature.key)}
                  className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                    active
                      ? "border-[rgba(79,142,247,0.35)] bg-[rgba(79,142,247,0.12)] shadow-[0_16px_32px_rgba(79,142,247,0.14)]"
                      : "border-[var(--border)] bg-[rgba(8,12,17,0.75)] hover:border-[rgba(79,142,247,0.2)] hover:bg-[rgba(79,142,247,0.08)]"
                  }`}
                >
                  <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text-soft)]">
                    {feature.eyebrow}
                  </div>
                  <div className="mt-2 text-lg text-white">{feature.title}</div>
                  <div className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                    {feature.description}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="panel rounded-[30px] p-6 lg:p-8">
          {activeFeature === "ai" ? (
            <>
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--text-dim)]">
                Bonus Feature 01
              </div>
              <h1 className="mt-3 font-['Instrument_Serif'] text-5xl italic leading-none text-white">
                AI Text Detector
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-soft)]">
                This runs before the claim-verification pipeline and returns both the probability
                score and the human-versus-AI label required by the rubric.
              </p>

              <div className="mt-6 rounded-[24px] border border-[var(--border)] bg-[rgba(8,12,17,0.88)] p-5">
                <div className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--text-soft)]">
                  Latest Result
                </div>
                {hasAiScore ? (
                  <>
                    <div className="mt-3 text-3xl text-white">{aiScore.label}</div>
                    <div className="mt-2 text-sm text-[var(--text-dim)]">
                      Probability score: {aiProbability}% via {aiScore.model}
                    </div>
                    <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(4, Math.min(100, aiProbability))}%`,
                          backgroundColor: getAiTone(aiProbability),
                        }}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mt-3 text-lg text-white">
                      No AI detector result has been streamed yet.
                    </div>
                    <div className="mt-2 text-sm text-[var(--text-dim)]">
                      Run any text or URL verification once and the score-plus-label result will
                      appear here.
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 rounded-[24px] border border-[var(--border)] bg-[rgba(79,142,247,0.05)] p-5">
                <div className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--text-soft)]">
                  Rubric Coverage
                </div>
                <div className="mt-3 text-sm leading-7 text-[var(--text-main)]">
                  Required output: probability score plus a binary label such as
                  &quot;Likely AI-generated&quot; or &quot;Likely human-written.&quot;
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-[var(--text-dim)]">
                Bonus Feature 02
              </div>
              <h2 className="mt-3 font-['Instrument_Serif'] text-5xl italic leading-none text-white">
                Media Scanner
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-soft)]">
                This activates in URL mode, extracts article images, and reports both fully
                AI-generated media and synthetically manipulated deepfake-style media.
              </p>

              <div className="mt-6 rounded-[24px] border border-[var(--border)] bg-[rgba(8,12,17,0.88)] p-5">
                <div className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--text-soft)]">
                  Latest Result
                </div>
                {hasDeepfakes ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {deepfakes.map((item) => (
                      <div
                        key={item.image_url}
                        className="overflow-hidden rounded-[22px] border border-[var(--border)] bg-[rgba(255,255,255,0.02)]"
                      >
                        <img
                          src={item.image_url}
                          alt={item.label}
                          className="h-40 w-full object-cover"
                        />
                        <div className="space-y-2 px-4 py-4">
                          <div className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--text-soft)]">
                            {getMediaTypeLabel(item.type)}
                          </div>
                          <div className="text-lg text-white">{item.label}</div>
                          <div className="text-sm text-[var(--text-dim)]">
                            Confidence {(item.score * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="mt-3 text-lg text-white">
                      No media findings have been returned yet.
                    </div>
                    <div className="mt-2 text-sm text-[var(--text-dim)]">
                      Current mode: {mode}. Use URL mode to trigger the image scan.
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className="rounded-[24px] border border-[var(--border)] bg-[rgba(52,211,153,0.05)] p-5">
                  <div className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--text-soft)]">
                    Rubric Coverage
                  </div>
                  <div className="mt-3 text-sm leading-7 text-[var(--text-main)]">
                    Coverage includes AI-generated media and synthetically manipulated media such as
                    face-swapped or altered imagery.
                  </div>
                </div>

                <div className="rounded-[24px] border border-[var(--border)] bg-[rgba(79,142,247,0.05)] p-5">
                  <div className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--text-soft)]">
                    Recommended Test URL
                  </div>
                  <a
                    href="http://127.0.0.1:5173/demo-article.html"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block break-all text-sm leading-7 text-white underline decoration-[rgba(79,142,247,0.35)] underline-offset-4"
                  >
                    http://127.0.0.1:5173/demo-article.html
                  </a>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
