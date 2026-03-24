import { motion } from "framer-motion";

const steps = [
  { stage: "extracting", label: "01 Extracting" },
  { stage: "searching", label: "02 Searching" },
  { stage: "verifying", label: "03 Verifying" },
];

function getStageIndex(stage) {
  if (stage === "complete") {
    return steps.length;
  }
  return Math.max(0, steps.findIndex((item) => item.stage === stage));
}

export default function PipelineStepper({ progress }) {
  const activeIndex = getStageIndex(progress.stage);
  const ratio = Math.max(0, Math.min(100, Math.round((progress.progress || 0) * 100)));

  return (
    <div className="panel rounded-[28px] p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        {steps.map((step, index) => {
          const done = progress.stage === "complete" || index < activeIndex;
          const active = progress.stage !== "complete" && index === activeIndex;

          return (
            <div key={step.stage} className="flex flex-1 items-center gap-4">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[rgba(79,142,247,0.06)] font-mono text-sm uppercase tracking-[0.22em] text-[var(--text-main)]">
                {done ? (
                  <svg viewBox="0 0 20 20" className="h-4 w-4 text-[var(--true)]" aria-hidden="true">
                    <path
                      d="M4 10.5 8 14.5 16 6.5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                ) : (
                  <span>{step.label.slice(0, 2)}</span>
                )}
                {active ? (
                  <motion.span
                    className="absolute inset-0 rounded-full border border-[var(--accent)]"
                    animate={{ scale: [1, 1.18], opacity: [0.8, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
                  />
                ) : null}
              </div>

              <div className="flex-1">
                <div className="font-mono text-xs uppercase tracking-[0.28em] text-[var(--text-soft)]">
                  {step.label}
                </div>
                <div className="mt-1 text-sm text-[var(--text-dim)]">
                  {done ? "Done" : active ? "Active" : "Queued"}
                </div>
              </div>

              {index < steps.length - 1 ? (
                <div className="hidden h-px flex-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)] lg:block">
                  <motion.div
                    className="h-full bg-[linear-gradient(90deg,#4f8ef7,#34d399)]"
                    animate={{ width: done ? "100%" : "0%" }}
                    transition={{ duration: 0.45 }}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.28em] text-[var(--text-soft)]">
          <span>Pipeline Progress</span>
          <span>
            {progress.claims_done || 0}/{progress.claims_total || 0}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
          <motion.div
            className="h-full bg-[linear-gradient(90deg,#4f8ef7,#34d399)]"
            animate={{ width: `${ratio}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>
    </div>
  );
}
