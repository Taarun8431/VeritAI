import { useEffect, useRef, useState } from "react";

function formatCreatedAt(value) {
  if (!value) {
    return "Saved run";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Saved run";
  }

  return parsed.toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getPreview(entry) {
  const source = (entry.input_value || "").trim();
  if (!source) {
    return "Untitled run";
  }

  if (entry.mode === "URL") {
    return source.replace(/^https?:\/\//i, "");
  }

  return source.length > 120 ? `${source.slice(0, 117)}...` : source;
}

function getSummary(entry) {
  const verdictCount = Object.keys(entry.verdicts || {}).length;
  const mediaCount = Array.isArray(entry.deepfakes) ? entry.deepfakes.length : 0;
  const parts = [`${verdictCount} verdict${verdictCount === 1 ? "" : "s"}`];

  if (typeof entry.accuracy === "number") {
    parts.push(`${entry.accuracy}% score`);
  }

  if (entry.ai_score?.label) {
    parts.push(entry.ai_score.label);
  }

  if (mediaCount) {
    parts.push(`${mediaCount} media hit${mediaCount === 1 ? "" : "s"}`);
  }

  return parts.join(" • ");
}

export default function HistoryDropdown({ historyItems, isLoading, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const shellRef = useRef(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!shellRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  return (
    <div
      ref={shellRef}
      className="no-print fixed left-4 top-4 z-40 w-[min(24rem,calc(100vw-2rem))]"
    >
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="panel flex w-full items-center justify-between rounded-[22px] px-4 py-3 text-left backdrop-blur"
      >
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.28em] text-[var(--text-soft)]">
            Verification History
          </div>
          <div className="mt-1 text-sm text-white">
            {historyItems.length ? `${historyItems.length} recent runs saved` : "No saved runs yet"}
          </div>
        </div>
        <div className="font-mono text-xs uppercase tracking-[0.22em] text-[var(--text-dim)]">
          {isOpen ? "Close" : "Open"}
        </div>
      </button>

      {isOpen && (
        <div className="panel mt-3 max-h-[70vh] overflow-auto rounded-[24px] p-3 scrollbar-thin">
          {isLoading ? (
            <div className="rounded-[18px] border border-[var(--border)] px-4 py-5 text-sm text-[var(--text-soft)]">
              Loading saved runs...
            </div>
          ) : historyItems.length ? (
            <div className="space-y-3">
              {historyItems.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => {
                    onSelect(entry);
                    setIsOpen(false);
                  }}
                  className="w-full rounded-[20px] border border-[var(--border)] bg-[rgba(8,12,17,0.88)] px-4 py-4 text-left transition hover:border-[rgba(79,142,247,0.28)] hover:bg-[rgba(79,142,247,0.09)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full border border-[var(--border)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--text-soft)]">
                      {entry.mode}
                    </span>
                    <span className="text-xs text-[var(--text-dim)]">
                      {formatCreatedAt(entry.created_at)}
                    </span>
                  </div>
                  <div className="mt-3 text-sm leading-6 text-white">{getPreview(entry)}</div>
                  <div className="mt-3 text-xs leading-5 text-[var(--text-soft)]">
                    {getSummary(entry)}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-[18px] border border-dashed border-[var(--border)] px-4 py-5 text-sm text-[var(--text-soft)]">
              Run a text or URL verification once and it will appear here with its results.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
