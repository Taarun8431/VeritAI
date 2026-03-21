export function SkeletonCard() {
  return (
    <div className="card p-5 border-l-4 border-[var(--border)] mb-3 animate-pulse">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-[var(--bg-elevated)] rounded w-1/4" />
          <div className="space-y-2">
            <div className="h-4 bg-[var(--bg-elevated)] rounded w-full" />
            <div className="h-4 bg-[var(--bg-elevated)] rounded w-5/6" />
          </div>
          <div className="h-3 bg-[var(--bg-elevated)] rounded w-1/2 mt-4" />
        </div>
        <div className="w-[60px] h-[60px] rounded-full border-4 border-[var(--bg-elevated)] shrink-0" />
      </div>
    </div>
  );
}
