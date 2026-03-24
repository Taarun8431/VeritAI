function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (error) {
    return url;
  }
}

const credibilityTone = {
  high: "var(--true)",
  medium: "var(--partial)",
  low: "var(--unverifiable)",
};

export default function SourceChip({ source }) {
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[rgba(7,12,18,0.92)] px-3 py-2 text-xs transition hover:border-[rgba(79,142,247,0.28)] hover:bg-[rgba(79,142,247,0.08)]"
    >
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: credibilityTone[source.credibility] || credibilityTone.low }}
      />
      <span className="font-mono uppercase tracking-[0.18em] text-[var(--text-soft)]">
        {hostnameFromUrl(source.url)}
      </span>
    </a>
  );
}
