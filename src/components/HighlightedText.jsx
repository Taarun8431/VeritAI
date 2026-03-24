import { getVerdictConfig } from "./ConfidenceRing.jsx";

export default function HighlightedText({ claims, text, verdicts, onClaimSelect }) {
  if (!text) {
    return <div className="text-[var(--text-dim)]">No source text available yet.</div>;
  }

  const sortedClaims = [...claims].sort((left, right) => {
    if (left.char_start !== right.char_start) {
      return left.char_start - right.char_start;
    }
    return left.char_end - right.char_end;
  });

  const segments = [];
  let cursor = 0;

  sortedClaims.forEach((claim) => {
    const start = Math.max(0, Math.min(text.length, claim.char_start ?? 0));
    const end = Math.max(start, Math.min(text.length, claim.char_end ?? start));

    if (end <= start || start < cursor) {
      return;
    }

    if (start > cursor) {
      segments.push({
        type: "text",
        value: text.slice(cursor, start),
      });
    }

    segments.push({
      type: "claim",
      claim,
      value: text.slice(start, end),
    });

    cursor = end;
  });

  if (cursor < text.length) {
    segments.push({
      type: "text",
      value: text.slice(cursor),
    });
  }

  return (
    <div className="whitespace-pre-wrap text-[15px] leading-8 text-[var(--text-main)]">
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return <span key={`text-${index}`}>{segment.value}</span>;
        }

        const verdict = verdicts[segment.claim.id]?.verdict || "Pending";
        const config = getVerdictConfig(verdict);

        return (
          <span
            key={segment.claim.id}
            role="button"
            tabIndex={0}
            data-highlight-id={segment.claim.id}
            data-highlight-verdict={verdict}
            onClick={() => onClaimSelect(segment.claim.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClaimSelect(segment.claim.id);
              }
            }}
            className="cursor-pointer rounded px-1 py-0.5 transition hover:brightness-110"
            style={{
              backgroundColor: config.surface,
              boxShadow: `inset 0 -1px 0 ${config.color}`,
            }}
          >
            {segment.value}
          </span>
        );
      })}
    </div>
  );
}
