import { motion } from "framer-motion";

const featurePills = ["Live Sources", "Streamed Verdicts", "Source Highlights", "AI Signals"];

const tickerItems = [
  "Claim extraction in real time",
  "Evidence gathered from live web sources",
  "Verdicts updated claim by claim",
  "Designed for fast demo walkthroughs",
];

const bonusButtons = [
  {
    key: "ai",
    eyebrow: "Bonus +10",
    title: "AI Text Detector",
    description: "Open the score-and-label bonus view for AI-generated versus human-written text.",
    tone: "rgba(79,142,247,0.08)",
  },
  {
    key: "media",
    eyebrow: "Bonus +20",
    title: "Media Scanner",
    description: "Open the deepfake scanner view for AI-generated and synthetically manipulated media.",
    tone: "rgba(52,211,153,0.08)",
  },
];

export default function LandingScreen({
  activeValue,
  isVerifying,
  mode,
  presets,
  textValue,
  urlValue,
  onModeChange,
  onOpenBonusPage,
  onPresetSelect,
  onSubmit,
  onTextChange,
  onUrlChange,
}) {
  const charCount = activeValue.length;
  const counterTone =
    charCount >= 4500 ? "text-[#f87171]" : charCount >= 2000 ? "text-[#fbbf24]" : "text-[var(--text-soft)]";
  const submitDisabled = !activeValue.trim() || isVerifying;

  return (
    <main className="mx-auto flex min-h-screen max-w-[1600px] flex-col justify-center px-6 py-8 lg:px-10">
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <section className="flex flex-col justify-between gap-10">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="inline-flex items-center gap-3 rounded-full border border-[var(--border)] bg-[rgba(10,14,19,0.82)] px-4 py-2"
            >
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_16px_rgba(79,142,247,0.75)]" />
              <span className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--text-soft)]">
                VeritAI
              </span>
            </motion.div>

            <div className="space-y-6">
              {[
                "Verify any claim.",
                "Against live sources.",
                "In seconds.",
              ].map((line, index) => (
                <motion.h1
                  key={line}
                  initial={{ opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  className="max-w-3xl font-['Instrument_Serif'] text-5xl italic leading-[0.95] text-white sm:text-6xl 2xl:text-7xl"
                >
                  {line}
                </motion.h1>
              ))}
            </div>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.22 }}
              className="max-w-2xl text-lg leading-8 text-[var(--text-soft)]"
            >
              Stream claim extraction, web evidence, and verdicts in a presentation-ready flow built
              for tomorrow&apos;s demo.
            </motion.p>

            <div className="flex flex-wrap gap-3">
              {featurePills.map((pill, index) => (
                <motion.span
                  key={pill}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.3 + index * 0.06 }}
                  className="rounded-full border border-[var(--border)] bg-[rgba(79,142,247,0.08)] px-4 py-2 font-mono text-xs uppercase tracking-[0.25em] text-[var(--text-main)]"
                >
                  {pill}
                </motion.span>
              ))}
            </div>
          </div>

          <div className="ticker-shell rounded-3xl">
            <div className="ticker-track px-4 py-3 font-mono text-xs uppercase tracking-[0.28em] text-[var(--text-soft)]">
              {[...tickerItems, ...tickerItems].map((item, index) => (
                <span key={`${item}-${index}`}>{item}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="panel sticky top-6 rounded-[30px] p-6 sm:p-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex gap-2">
                <span className="h-3 w-3 rounded-full bg-[#f87171]" />
                <span className="h-3 w-3 rounded-full bg-[#fbbf24]" />
                <span className="h-3 w-3 rounded-full bg-[#34d399]" />
              </div>
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-[var(--text-soft)]">
                Verification Console
              </p>
            </div>
            <div className="rounded-full border border-[var(--border)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--text-dim)]">
              Ctrl+Enter
            </div>
          </div>

          <div className="mb-6 rounded-[24px] border border-[var(--border)] bg-[rgba(7,12,18,0.78)] p-3">
            <div className="px-2 pb-3 pt-1">
              <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text-soft)]">
                Bonus Features
              </div>
              <div className="mt-2 text-sm leading-6 text-[var(--text-dim)]">
                Open each rubric bonus separately. Both views stay connected to the live backend results.
              </div>
            </div>

            <div className="space-y-3">
              {bonusButtons.map((button) => (
                <button
                  key={button.key}
                  type="button"
                  onClick={() => onOpenBonusPage(button.key)}
                  className="w-full rounded-[20px] border border-[var(--border)] px-4 py-4 text-left transition hover:border-[rgba(79,142,247,0.24)] hover:bg-[rgba(79,142,247,0.12)]"
                  style={{ backgroundColor: button.tone }}
                >
                  <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text-soft)]">
                    {button.eyebrow}
                  </div>
                  <div className="mt-2 text-lg text-white">{button.title}</div>
                  <div className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                    {button.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3 rounded-2xl border border-[var(--border)] bg-[rgba(7,12,18,0.85)] p-2">
            {["TEXT", "URL"].map((option) => {
              const active = option === mode;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onModeChange(option)}
                  className={`rounded-xl px-4 py-3 font-mono text-xs uppercase tracking-[0.28em] transition ${
                    active
                      ? "bg-[var(--accent)] text-white shadow-[0_0_24px_rgba(79,142,247,0.35)]"
                      : "text-[var(--text-soft)] hover:bg-[rgba(79,142,247,0.08)]"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>

          <label className="mb-3 block font-mono text-xs uppercase tracking-[0.3em] text-[var(--text-soft)]">
            {mode === "TEXT" ? "Input Text" : "Article URL"}
          </label>
          <textarea
            value={mode === "TEXT" ? textValue : urlValue}
            onChange={(event) =>
              mode === "TEXT"
                ? onTextChange(event.target.value)
                : onUrlChange(event.target.value)
            }
            placeholder={
              mode === "TEXT"
                ? "Paste a speech, post, article excerpt, or debate transcript..."
                : "Paste a story URL to scrape and verify live..."
            }
            className="min-h-[250px] w-full rounded-[24px] border border-[var(--border)] bg-[rgba(8,12,17,0.92)] px-5 py-5 text-[15px] leading-7 text-[var(--text-main)] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] transition placeholder:text-[var(--text-dim)] focus:border-[rgba(79,142,247,0.32)]"
          />

          <div className="mt-3 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
              Presets tuned for the live demo
            </span>
            <span className={`font-mono text-xs uppercase tracking-[0.24em] ${counterTone}`}>
              {charCount} chars
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {presets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onPresetSelect(preset)}
                className="rounded-2xl border border-[var(--border)] bg-[rgba(79,142,247,0.06)] px-4 py-4 text-left transition hover:border-[rgba(79,142,247,0.28)] hover:bg-[rgba(79,142,247,0.12)]"
              >
                <span className="font-mono text-xs uppercase tracking-[0.24em] text-[var(--text-soft)]">
                  Preset
                </span>
                <div className="mt-2 text-lg text-white">{preset}</div>
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-[var(--border)] bg-[rgba(79,142,247,0.05)] px-4 py-4">
              <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
                Bonus Feature
              </div>
              <div className="mt-2 text-lg text-white">AI Detector</div>
              <div className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                Runs before the main pipeline and scores whether the submitted text looks AI-generated.
              </div>
            </div>

            <div className="rounded-[22px] border border-[var(--border)] bg-[rgba(52,211,153,0.05)] px-4 py-4">
              <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text-dim)]">
                Bonus Feature
              </div>
              <div className="mt-2 text-lg text-white">Media Scanner</div>
              <div className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                Activates in URL mode and scans article images for possible deepfake or AI-generated media.
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={submitDisabled}
            onClick={() => void onSubmit()}
            className={`mt-6 flex w-full items-center justify-between rounded-[24px] px-5 py-4 transition ${
              submitDisabled
                ? "cursor-not-allowed border border-[var(--border)] bg-[rgba(255,255,255,0.04)] text-[var(--text-dim)]"
                : "border border-[rgba(79,142,247,0.22)] bg-[linear-gradient(135deg,#4f8ef7,#2c6be1)] text-white shadow-[0_22px_42px_rgba(79,142,247,0.28)]"
            }`}
          >
            <div>
              <div className="font-mono text-xs uppercase tracking-[0.32em]">Initiate Verification</div>
              <div className="mt-1 text-sm text-white/75">
                {isVerifying ? "Streaming verdicts..." : "Start the live fact-check pipeline"}
              </div>
            </div>
            <div className="font-mono text-sm uppercase tracking-[0.25em]">
              {isVerifying ? "Running" : "Go"}
            </div>
          </button>
        </section>
      </div>
    </main>
  );
}
